import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchFeed } from '../services/feedService';
import { Post } from '../types/database.types';

export const useRealtimeFeed = (categoryFilter?: string, searchQuery?: string) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPosts = useCallback(async () => {
        try {
            const data = await fetchFeed(categoryFilter, searchQuery);
            setPosts(data as unknown as Post[]);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [categoryFilter, searchQuery]);

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
        const channel = supabase.channel('feed_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
                console.log('Post change received!', payload);
                // For a new post, we might want to refetch or prepend
                // For simplicity, refetching ensures relations are loaded correctly
                loadPosts();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, payload => {
                // We could do optimistic updates here too, but fetching ensures sync
                // In a true highly-optimized app, we'd update just the specific post's like count in state
                // Example optimized update:
                if (payload.eventType === 'INSERT') {
                    setPosts(prev => prev.map(p => p.id === payload.new.post_id ? { ...p, likes: (p.likes as number) + 1 } : p));
                } else if (payload.eventType === 'DELETE') {
                    setPosts(prev => prev.map(p => p.id === payload.old.post_id ? { ...p, likes: Math.max(0, (p.likes as number) - 1) } : p));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, payload => {
                 if (payload.eventType === 'INSERT') {
                    setPosts(prev => prev.map(p => p.id === payload.new.post_id ? { ...p, comments: (p.comments as number) + 1 } : p));
                } else if (payload.eventType === 'DELETE') {
                    setPosts(prev => prev.map(p => p.id === payload.old.post_id ? { ...p, comments: Math.max(0, (p.comments as number) - 1) } : p));
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
                    likes: (p.likes as number) + (wasLiked ? -1 : 1)
                };
            }
            return p;
        }));
    };

    const optimisticToggleSave = (postId: string) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return { ...p, user_has_saved: !p.user_has_saved };
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
                return { ...p, user_debate_vote: vote };
            }
            return p;
        }));
    };

    return { 
        posts, 
        loading, 
        refreshing, 
        handleRefresh,
        optimisticToggleLike,
        optimisticToggleSave,
        optimisticQuizAnswer,
        optimisticDebateVote
    };
};
