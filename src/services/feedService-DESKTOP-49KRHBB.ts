import { supabase } from '../lib/supabase';
import { Post, Like, SavedPost, QuizAnswer, DebateVote } from '../types/database.types';
import { toggleSave as savedServiceToggleSave } from './savedService';

const getUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id;
};

export const fetchPostsWithBypass = async (feedType: 'for_you' | 'following' | 'trending' | 'latest', categoryFilter?: string, searchQuery?: string, userId?: string | null): Promise<any[]> => {
    let query = supabase
        .from('posts')
        .select(`
            *,
            author:author_id(id, username, full_name, avatar_url),
            interactions:post_interactions(id, user_id, type),
            comments:comments(id)
        `)
        .eq('is_published', true);

    if (categoryFilter && categoryFilter !== 'Hepsi' && categoryFilter !== 'Tümü') {
        query = query.eq('category', categoryFilter);
    }
    if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
    }

    if (feedType === 'following' && userId) {
        const { data: follows } = await supabase.from('followers').select('following_id').eq('follower_id', userId).eq('status', 'accepted');
        const followingIds = follows ? follows.map((f: any) => f.following_id) : [];
        if (followingIds.length > 0) {
            query = query.in('author_id', followingIds);
        } else {
            return []; // Follows no one
        }
    }

    if (feedType === 'trending') {
        // Fetch last 14 days for trending
        query = query.gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
    } else {
        query = query.order('created_at', { ascending: false }).limit(20);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Frontend query error:', error);
        return [];
    }
    return data || [];
};

export const fetchFeed = async (initialFeedType: 'for_you' | 'following' | 'trending' = 'for_you', categoryFilter?: string, searchQuery?: string): Promise<Post[]> => {
    try {
        const userId = await getUserId();
        
        let rawData: any[] = [];
        let usedFeedType = initialFeedType;

        if (initialFeedType === 'for_you') {
            // Sadece Sizin İçin (for_you) sekmesinde şelale mantığı (fallback) kullan
            const feedTypes: ('for_you' | 'trending' | 'latest')[] = ['for_you', 'trending', 'latest'];
            for (let i = 0; i < feedTypes.length; i++) {
                usedFeedType = feedTypes[i] as any;
                rawData = await fetchPostsWithBypass(usedFeedType, categoryFilter, searchQuery, userId);
                if (rawData.length > 0) break;
            }
        } else {
            // Takip Edilenler veya Trendler ise KESİNLİKLE fallback yapma, boşsa boş dönsün
            rawData = await fetchPostsWithBypass(initialFeedType, categoryFilter, searchQuery, userId);
        }

        if (rawData.length === 0) return [];
        
        // Filter out soft deleted and test posts
        rawData = rawData.filter((item: any) => {
            if (item.is_deleted === true) return false;
            
            const titleStr = item.title || '';
            const titleUpper = titleStr.toUpperCase();
            const usernameStr = item.author?.username || '';
            
            // 1. Remove obvious test/fake posts
            const isFake = titleUpper.includes('TEST POST') || 
                           titleUpper.includes('TESTING') || 
                           titleUpper.includes('ACCEPTANCE TEST') || 
                           titleUpper.includes('FLORENCE +') || 
                           usernameStr.includes('testuser') || 
                           usernameStr === 'system';
                           
            if (isFake) return false;

            // 2. Remove completely wiped posts (soft deletes)
            // Strictly check for missing payload or invalid payload on specific types
            const hasPayload = item.payload && typeof item.payload === 'object' && Object.keys(item.payload).length > 0;
            if ((item.type === 'quiz' || item.type === 'discussion' || item.type === 'debate') && !hasPayload) return false;
            
            // If it's a discussion/debate, it MUST have side_a and side_b
            if (item.type === 'discussion' || item.type === 'debate') {
                if (!item.payload?.side_a || !item.payload?.side_b) return false;
            }
            
            // If it's a quiz, it MUST have options
            if (item.type === 'quiz') {
                if (!item.payload?.options) return false;
            }
            
            const hasTitle = titleStr.trim().length > 0;
            const hasContent = typeof item.content === 'string' && item.content.trim().length > 0;
            
            if (!hasTitle && !hasContent && !hasPayload) return false;
            
            // 3. Type-specific checks for soft deletes
            if (item.type === 'knowledge_card' && !hasTitle) return false;
            
            return true;
        });

        if (rawData.length === 0) return [];
        
        // 2. PREPARE QUIZ / DEBATE STATES
        const postIds = rawData.map((p: any) => p.id);
        let quizAnswersMap = new Map();
        let debateVotesMap = new Map();

        if (userId && postIds.length > 0) {
            const [quizRes, debateRes] = await Promise.all([
                supabase.from('quiz_answers').select('quiz_id, selected_answer, is_correct').in('quiz_id', postIds).eq('user_id', userId),
                supabase.from('debate_votes').select('post_id, selected_option').in('post_id', postIds).eq('user_id', userId)
            ]);
            quizAnswersMap = new Map((quizRes.data || []).map(q => [q.quiz_id, q]));
            debateVotesMap = new Map((debateRes.data || []).map(d => [d.post_id, d]));
        }

        // 3. MAP AND CALCULATE SCORES
        rawData = rawData || [];
        let processedPosts = rawData.map((post: any) => {
            const interactions = post.interactions || [];
            const likesCount = interactions.filter((i: any) => i.type === 'like').length;
            const savesCount = interactions.filter((i: any) => i.type === 'save').length;
            const commentsCount = (post.comments || []).length;
            
            const userHasLiked = userId ? interactions.some((i: any) => i.type === 'like' && i.user_id === userId) : false;
            const userHasSaved = userId ? interactions.some((i: any) => i.type === 'save' && i.user_id === userId) : false;

            // TIME DECAY ALGORITHM
            const hoursSincePost = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
            const views = post.views || 10; // Fallback view count
            const trendScore = ((likesCount * 2) + (commentsCount * 4) + (savesCount * 3) + (views * 0.2)) / Math.pow(Math.max(1, hoursSincePost + 2), 1.2);

            return {
                ...post,
                author: {
                    id: post.author?.id || 'system',
                    username: post.author?.username || 'Kullanıcı',
                    full_name: post.author?.full_name || 'Gizli Üye',
                    avatar_value: post.author?.avatar_url || null,
                    level: 1
                },
                likes: likesCount,
                comments: commentsCount,
                saves: savesCount, // For sorting if needed
                trend_score: trendScore,
                user_has_liked: userHasLiked,
                user_has_saved: userHasSaved,
                user_quiz_answer: quizAnswersMap.get(post.id),
                user_debate_vote: debateVotesMap.get(post.id)
            } as any;
        });

        // 4. SORTING
        if (usedFeedType === 'trending') {
            processedPosts = processedPosts.sort((a, b) => b.trend_score - a.trend_score);
        }

        return processedPosts;

    } catch (error) {
        console.error('Error fetching feed:', error);
        return [];
    }
};

export const toggleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    if (isCurrentlyLiked) {
        await supabase.from('post_interactions').delete().match({ post_id: postId, user_id: userId, type: 'like' });
    } else {
        await supabase.from('post_interactions').insert({ post_id: postId, user_id: userId, type: 'like' });
    }
};

export const toggleSave = async (postId: string, isCurrentlySaved: boolean, type: 'post' | 'quiz' | 'debate' = 'post') => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    if (isCurrentlySaved) {
        await supabase.from('post_interactions').delete().match({ post_id: postId, user_id: userId, type: 'save' });
    } else {
        await supabase.from('post_interactions').insert({ post_id: postId, user_id: userId, type: 'save' });
    }
};

export const toggleShare = async (postId: string, shareType: string = 'native_share') => {
    return supabase.rpc('track_share', { p_post_id: postId, p_share_type: shareType });
};

export const submitQuizAnswer = async (postId: string, selectedOption: string, isCorrect: boolean) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    await supabase.from('quiz_answers').insert({
        quiz_id: postId,
        user_id: userId,
        selected_answer: selectedOption,
        is_correct: isCorrect
    });
};

export const submitDebateVote = async (postId: string, selectedOption: 'A' | 'B') => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not authenticated');
    
    await supabase.from('debate_votes').insert({
        post_id: postId,
        user_id: userId,
        selected_option: selectedOption
    });
};

export const hidePost = async (postId: string) => {
    const { error } = await supabase.rpc('hide_post', { p_post_id: postId });
    if (error) throw error;
};
