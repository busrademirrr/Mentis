import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchFeed, hidePost } from '../services/feedService';
import { Post } from '../types/database.types';

export const useRealtimeFeed = (feedType: 'for_you' | 'following' | 'trending' = 'for_you', categoryFilter?: string, searchQuery?: string) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPosts = useCallback(async () => {
        try {
            const data = await fetchFeed(feedType, categoryFilter, searchQuery);
            setPosts(data as unknown as Post[]);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [feedType, categoryFilter, searchQuery]);

    useEffect(() => {
        setLoading(true);
        loadPosts();
    }, [loadPosts]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadPosts();
    };

    useEffect(() => {
        // Subscribe to real-time changes
        const channel = supabase.channel(`feed_changes_${Math.random().toString(36).substr(2, 9)}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
                console.log('Post change received!', payload);
                // For a new post, we might want to refetch or prepend
                // For simplicity, refetching ensures relations are loaded correctly
                loadPosts();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_interactions' }, payload => {
                // Handle both likes and saves dynamically through post_interactions
                if (payload.eventType === 'INSERT') {
                    if (payload.new.type === 'like') {
                        setPosts(prev => prev.map(p => p.id === payload.new.post_id ? { ...p, likes_count: (Number((p as any).likes_count) || 0) + 1 } : p));
                    } else if (payload.new.type === 'save') {
                        setPosts(prev => prev.map(p => p.id === payload.new.post_id ? { ...p, saves_count: (Number((p as any).saves_count) || 0) + 1 } : p));
                    }
                } else if (payload.eventType === 'DELETE') {
                    if (payload.old.type === 'like') {
                        setPosts(prev => prev.map(p => p.id === payload.old.post_id ? { ...p, likes_count: Math.max(0, (Number((p as any).likes_count) || 0) - 1) } : p));
                    } else if (payload.old.type === 'save') {
                        setPosts(prev => prev.map(p => p.id === payload.old.post_id ? { ...p, saves_count: Math.max(0, (Number((p as any).saves_count) || 0) - 1) } : p));
                    }
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_shares' }, payload => {
                if (payload.eventType === 'INSERT') {
                    setPosts(prev => prev.map(p => p.id === payload.new.post_id ? { ...p, shares_count: (Number((p as any).shares_count) || 0) + 1 } : p));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, payload => {
                 if (payload.eventType === 'INSERT' && payload.new.is_hidden === false) {
                    setPosts(prev => prev.map(p => p.id === payload.new.post_id ? { ...p, comments_count: (Number((p as any).comments_count) || 0) + 1 } : p));
                } else if (payload.eventType === 'DELETE' || payload.new?.deleted_at !== null) {
                    // Approximate comment decrement if hard deleted or soft deleted
                    setPosts(prev => prev.map(p => p.id === (payload.old?.post_id || payload.new?.post_id) ? { ...p, comments_count: Math.max(0, (Number((p as any).comments_count) || 0) - 1) } : p));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadPosts]);

    // Optimistic UI Updaters
    const optimisticToggleLike = (postId: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const wasLiked = p.user_has_liked;
                return {
                    ...p,
                    user_has_liked: !wasLiked,
                    likes_count: Math.max(0, (Number((p as any).likes_count) || 0) + (wasLiked ? -1 : 1))
                };
            }
            return p;
        }));
    };

    const optimisticToggleSave = (postId: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const wasSaved = p.user_has_saved;
                return { 
                    ...p, 
                    user_has_saved: !wasSaved,
                    saves_count: Math.max(0, (Number((p as any).saves_count) || 0) + (wasSaved ? -1 : 1))
                };
            }
            return p;
        }));
    };

    const optimisticQuizAnswer = (postId: string, answer: any) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return { ...p, user_quiz_answer: answer };
            }
            return p;
        }));
    };

    const optimisticDebateVote = (postId: string, vote: any) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const newPayload = { ...p.payload };
                if (vote.selected_option === 'A') {
                    newPayload.votes_A = (newPayload.votes_A || 0) + 1;
                } else if (vote.selected_option === 'B') {
                    newPayload.votes_B = (newPayload.votes_B || 0) + 1;
                }
                return { ...p, user_debate_vote: vote, payload: newPayload };
            }
            return p;
        }));
    };

    const optimisticHidePost = (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
        hidePost(postId).catch(console.error);
    };

    return { 
        posts, 
        loading, 
        refreshing, 
        handleRefresh,
        optimisticToggleLike,
        optimisticToggleSave,
        optimisticQuizAnswer,
        optimisticDebateVote,
        optimisticHidePost
    };
};
