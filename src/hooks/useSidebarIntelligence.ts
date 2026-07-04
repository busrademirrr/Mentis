import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface SidebarData {
    learningSummary: {
        topCategory: string | null;
        contentReadThisWeek: number;
        quizzesCompleted: number;
        arenaWins: number;
    };
    recommendedContent: any[];
    recommendedUsers: any[];
    trendingTopics: { category: string; count: number }[];
    leaderboard: any[];
}

export const useSidebarIntelligence = () => {
    const { user } = useAuth();
    const [data, setData] = useState<SidebarData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const iso7Days = sevenDaysAgo.toISOString();

            // 1. Learning Summary (Views, Quizzes, Arena)
            const viewsPromise = supabase.from('post_views').select('post_id, posts(category)').eq('user_id', user.id).gte('created_at', iso7Days);
            const quizzesPromise = supabase.from('quiz_answers').select('id').eq('user_id', user.id).gte('created_at', iso7Days);
            const arenaPromise = supabase.from('arena_matches').select('id').eq('winner_id', user.id).gte('created_at', iso7Days);

            // 2. Recommended Content
            const contentPromise = supabase.from('posts').select('id, title, type, category, author:author_id(username, avatar_value)').in('type', ['knowledge_card', 'discussion', 'quiz']).order('created_at', { ascending: false }).limit(3);

            // 3. Recommended Users (Excluding already followed users)
            const followsRes = await supabase.from('followers').select('following_id').eq('follower_id', user.id);
            const followingIds = (followsRes.data || []).map((f: any) => f.following_id);
            const excludeIds = [user.id, ...followingIds];

            const usersPromise = supabase.from('users')
                .select('id, username, avatar_value, arena_elo, league')
                .not('id', 'in', `(${excludeIds.join(',')})`)
                .order('arena_elo', { ascending: false })
                .limit(5);

            // 4. Trending Topics
            const trendingPromise = supabase.from('posts').select('category').gte('created_at', iso7Days);

            // 5. Weekly Leaderboard
            const leaderboardPromise = supabase
                .from('users')
                .select('id, username, avatar_value, arena_elo')
                .not('username', 'in', '("socrates","plato","aristotle","ibn sina","homer","shakespeare","herodotus","leonardo","kant","felsefe_uzmani","bilim_insani","sanat_tarihcisi","kantinkedisi")')
                .not('username', 'ilike', 'test%')
                .not('username', 'ilike', 'user_%')
                .order('arena_elo', { ascending: false })
                .limit(10);

            const [viewsRes, quizzesRes, arenaRes, contentRes, usersRes, trendingRes, leaderboardRes] = await Promise.all([
                viewsPromise, quizzesPromise, arenaPromise, contentPromise, usersPromise, trendingPromise, leaderboardPromise
            ]);

            // Process Learning Summary
            const viewsData = viewsRes.data || [];
            let topCategory = null;
            if (viewsData.length > 0) {
                const categoryCounts: Record<string, number> = {};
                viewsData.forEach((v: any) => {
                    const cat = v.posts?.category;
                    if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });
                if (Object.keys(categoryCounts).length > 0) {
                    topCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);
                }
            }

            // Process Trending Topics
            const trends: Record<string, number> = {};
            (trendingRes.data || []).forEach(p => {
                if (p.category) trends[p.category] = (trends[p.category] || 0) + 1;
            });
            const trendingTopics = Object.entries(trends)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setData({
                learningSummary: {
                    topCategory,
                    contentReadThisWeek: viewsData.length,
                    quizzesCompleted: quizzesRes.data?.length || 0,
                    arenaWins: arenaRes.data?.length || 0
                },
                recommendedContent: contentRes.data || [],
                recommendedUsers: usersRes.data || [],
                trendingTopics,
                leaderboard: leaderboardRes.data || []
            });
        } catch (e) {
            console.error('Sidebar fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        let isMounted = true;
        fetchData();

        // Realtime
        const channelId = `sidebar_hub_${Math.random().toString(36).substr(2, 9)}`;
        const channel = supabase.channel(channelId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { if(isMounted) fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => { if(isMounted) fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_matches' }, () => { if(isMounted) fetchData(); })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    return { data, loading, refetch: fetchData };
};
