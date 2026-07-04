import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface SavedItem {
    id: string;
    post_id: string;
    created_at: string;
    post: {
        id: string;
        title: string | null;
        type: string;
        category: string | null;
        image_url?: string | null;
        content?: string | null;
        payload: any;
    };
}

export const useSavedContent = () => {
    const { user } = useAuth();
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSaved = async () => {
        if (!user) {
            setSavedItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('post_interactions')
            .select(`
                id,
                post_id,
                created_at,
                post:posts(id, type, title, category, image_url, content, payload)
            `)
            .eq('user_id', user.id)
            .eq('type', 'save')
            .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
            const formatted = data.map((item: any) => ({
                id: item.id,
                post_id: item.post_id,
                created_at: item.created_at,
                post: {
                    id: item.post?.id,
                    title: item.post?.title || item.post?.payload?.title || 'İsimsiz İçerik',
                    type: item.post?.type || 'post',
                    category: item.post?.category || item.post?.payload?.category || 'Genel',
                    image_url: item.post?.image_url || item.post?.payload?.image_url || null,
                    content: item.post?.content || item.post?.payload?.content || null,
                    payload: item.post?.payload || {},
                }
            }));
            setSavedItems(formatted);
        } else {
            setSavedItems([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        
        fetchSaved();

        if (!user) return;

        const channel = supabase.channel(`saved_content_rt_${Date.now()}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'post_interactions', 
                filter: `user_id=eq.${user.id}` 
            }, (payload) => {
                if (payload.new && (payload.new as any).type !== 'save') return;
                if (isMounted) fetchSaved();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const groupedContent = useMemo(() => {
        return {
            posts: savedItems.filter(item => item?.post?.type === 'knowledge_card'),
            debates: savedItems.filter(item => item?.post?.type === 'discussion'),
            quizzes: savedItems.filter(item => item?.post?.type === 'quiz'),
            all: savedItems,
        };
    }, [savedItems]);

    return { savedItems, groupedContent, loading, refetch: fetchSaved };
};
