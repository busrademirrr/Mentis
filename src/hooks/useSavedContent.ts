import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CURRENT_USER_ID } from '../services/profileService';

export interface SavedItem {
    id: string;
    post_id: string;
    created_at: string;
    post: {
        id: string;
        title: string;
        type: string;
        category: string;
        payload: any;
    };
}

export const useSavedContent = () => {
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSaved = async () => {
        setLoading(true);
        // We query post_interactions where type = 'save' and join posts
        const { data, error } = await supabase
            .from('post_interactions')
            .select(`
                id,
                post_id,
                created_at,
                post:posts(id, type, payload)
            `)
            .eq('user_id', CURRENT_USER_ID)
            .eq('type', 'save')
            .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
            const formatted = data.map((item: any) => ({
                id: item.id,
                post_id: item.post_id,
                created_at: item.created_at,
                post: {
                    id: item.post?.id,
                    title: item.post?.payload?.title || 'İsimsiz İçerik',
                    type: item.post?.type || 'post',
                    category: item.post?.payload?.category || 'Genel',
                    payload: item.post?.payload || {},
                }
            }));
            setSavedItems(formatted);
        } else {
            // Sadece bilgi kartları (article) eklenecek
            setSavedItems([
                {
                    id: 'mock-1',
                    post_id: 'p1',
                    created_at: new Date().toISOString(),
                    post: { id: 'p1', title: 'Yapay Zeka ve İnsan Bilinci', type: 'article', category: 'Felsefe', payload: {} }
                },
                {
                    id: 'mock-2',
                    post_id: 'p2',
                    created_at: new Date().toISOString(),
                    post: { id: 'p2', title: 'Antik Yunan\'da Demokrasi', type: 'article', category: 'Tarih', payload: {} }
                },
                {
                    id: 'mock-3',
                    post_id: 'p3',
                    created_at: new Date().toISOString(),
                    post: { id: 'p3', title: 'Modern Sanatın Evrimi', type: 'article', category: 'Sanat', payload: {} }
                }
            ]);
        }
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        
        fetchSaved();

        const channel = supabase.channel('saved_content_rt')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'post_interactions', 
                filter: `user_id=eq.${CURRENT_USER_ID}` 
            }, (payload) => {
                if (isMounted) fetchSaved();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    const groupedContent = useMemo(() => {
        return {
            posts: savedItems.filter(item => item?.post?.type === 'article' || item?.post?.type === 'post'),
            debates: savedItems.filter(item => item?.post?.type === 'debate'),
            quizzes: savedItems.filter(item => item?.post?.type === 'quiz'),
            all: savedItems,
        };
    }, [savedItems]);

    return { savedItems, groupedContent, loading, refetch: fetchSaved };
};
