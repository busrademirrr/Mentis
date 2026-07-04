import { supabase } from '../lib/supabase';
import { Post, Like, SavedPost, QuizAnswer, DebateVote } from '../types/database.types';

// Hardcoded for testing. In production, this comes from Supabase Auth.
export const CURRENT_USER_ID = '11111111-1111-1111-1111-111111111111';

export const fetchFeed = async (categoryFilter?: string, searchQuery?: string): Promise<Post[]> => {
    try {
        let query = supabase
            .from('posts')
            .select(`
                *,
                author:author_id(id, username, full_name, avatar_value, is_premium, level),
                likes:likes(count),
                comments:comments(count),
                saved_content(id)
            `)
            .order('created_at', { ascending: false });

        if (categoryFilter && categoryFilter !== 'Hepsi') {
            query = query.eq('category', categoryFilter);
        }

        if (searchQuery) {
            query = query.ilike('title', `%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        if (!data) return [];

        // Map the results to check if current user liked/saved
        // Wait, to check if current user liked, we should ideally filter the join, 
        // but Supabase JS doesn't easily support filtering aggregate joins for a specific user while still getting total count in one go.
        // We will fetch user's likes separately for optimal performance, or just use a separate query.
        
        // For simplicity in this demo, let's just fetch the user's interactions for these posts
        const postIds = data.map(p => p.id);
        
        const [likesRes, savesRes, quizRes, debateRes] = await Promise.all([
            supabase.from('likes').select('post_id').eq('user_id', CURRENT_USER_ID).in('post_id', postIds),
            supabase.from('saved_content').select('content_id').eq('user_id', CURRENT_USER_ID).in('content_id', postIds),
            supabase.from('quiz_answers').select('quiz_id, selected_answer, is_correct').eq('user_id', CURRENT_USER_ID).in('quiz_id', postIds),
            supabase.from('debate_votes').select('debate_id, selected_option').eq('user_id', CURRENT_USER_ID).in('debate_id', postIds)
        ]);

        const likedPostIds = new Set(likesRes.data?.map(l => l.post_id) || []);
        const savedPostIds = new Set(savesRes.data?.map(s => s.content_id) || []);
        const quizAnswersMap = new Map((quizRes.data || []).map(q => [q.quiz_id, q]));
        const debateVotesMap = new Map((debateRes.data || []).map(d => [d.debate_id, d]));

        return data.map(post => {
            // Supabase returns count as an array [{count: X}] when using count aggregate
            const likesCount = Array.isArray(post.likes) ? post.likes[0]?.count || 0 : 0;
            const commentsCount = Array.isArray(post.comments) ? post.comments[0]?.count || 0 : 0;

            return {
                ...post,
                likes: likesCount,
                comments: commentsCount,
                user_has_liked: likedPostIds.has(post.id),
                user_has_saved: savedPostIds.has(post.id),
                user_quiz_answer: quizAnswersMap.get(post.id),
                user_debate_vote: debateVotesMap.get(post.id)
            } as any;
        });

    } catch (error) {
        console.error('Error fetching feed:', error);
        return [];
    }
};

export const toggleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    if (isCurrentlyLiked) {
        await supabase.from('likes').delete().eq('user_id', CURRENT_USER_ID).eq('post_id', postId);
    } else {
        await supabase.from('likes').insert({ user_id: CURRENT_USER_ID, post_id: postId });
    }
};

export const toggleSave = async (postId: string, isCurrentlySaved: boolean, type: 'post' | 'quiz' | 'debate' = 'post') => {
    if (isCurrentlySaved) {
        await supabase.from('saved_content').delete().eq('user_id', CURRENT_USER_ID).eq('content_id', postId);
    } else {
        await supabase.from('saved_content').insert({ user_id: CURRENT_USER_ID, content_id: postId, type: type });
    }
};

export const submitQuizAnswer = async (postId: string, selectedOption: number, isCorrect: boolean) => {
    await supabase.from('quiz_answers').insert({
        user_id: CURRENT_USER_ID,
        quiz_id: postId,
        selected_answer: selectedOption,
        is_correct: isCorrect
    });
};

export const submitDebateVote = async (postId: string, selectedOption: 'A' | 'B') => {
    await supabase.from('debate_votes').insert({
        user_id: CURRENT_USER_ID,
        debate_id: postId,
        selected_option: selectedOption
    });
};
