import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Platform } from 'react-native';
import { Text } from '../ui';
import { colors, spacing } from '../../theme';
import { supabase } from '../../lib/supabase';
import { HeroCard } from '../feed/HeroCard';
import { DiscussionCard } from '../feed/DiscussionCard';
import { QuizCard } from '../feed/QuizCard';

type TabType = 'all' | 'cards' | 'debates' | 'quizzes' | 'saved';

interface ProfileContentHubProps {
    userId: string;
    activeTab: TabType;
}

export const ProfileContentHub: React.FC<ProfileContentHubProps> = ({ userId, activeTab }) => {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            setError(null);
            try {
                let sortParam = 'author';
                let authorIdParam = userId;
                let userIdParam = undefined;

                if (activeTab === 'saved') {
                    sortParam = 'saved_by_me';
                    userIdParam = userId;
                    authorIdParam = undefined;
                }

                const { data, error: fetchError } = await supabase.rpc('get_profile_feed_v1', {
                    p_author_id: authorIdParam,
                    p_saved_by_user_id: userIdParam,
                    p_viewer_id: userId
                });

                if (fetchError) throw fetchError;

                let filtered = data || [];
                // Filter out soft-deleted posts completely
                filtered = filtered.filter((item: any) => {
                    if (item.is_deleted === true) return false;
                    
                    const titleStr = typeof item.title === 'string' ? item.title : '';
                    const titleUpper = titleStr.toUpperCase();
                    
                    if (titleUpper.includes('TEST') || titleUpper.includes('ACCEPTANCE') || titleUpper.includes('PIPELINE') || titleUpper.includes('TESTING')) {
                        return false;
                    }
                    
                    const hasTitle = titleStr.trim().length > 0;
                    const hasContent = typeof item.content === 'string' && item.content.trim().length > 0;
                    const hasPayload = item.payload && typeof item.payload === 'object' && Object.keys(item.payload).length > 0;
                    
                    if ((item.type === 'quiz' || item.type === 'discussion' || item.type === 'debate') && !hasPayload) return false;
                    
                    if (item.type === 'discussion' || item.type === 'debate') {
                        if (!item.payload?.side_a || !item.payload?.side_b) return false;
                    }
                    if (item.type === 'quiz') {
                        if (!item.payload?.options) return false;
                    }
                    
                    // Remove completely wiped posts
                    if (!hasTitle && !hasContent && !hasPayload) return false;
                    
                    // Type-specific checks for soft deletes
                    if (item.type === 'knowledge_card' && !hasTitle) return false;
                    
                    return true;
                });
                console.log("All posts", filtered);
                
                if (activeTab === 'cards') {
                    filtered = filtered.filter((item: any) => item.type === 'knowledge_card');
                    console.log("Knowledge tab posts", filtered);
                }
                if (activeTab === 'debates') filtered = filtered.filter((item: any) => item.type === 'discussion');
                if (activeTab === 'quizzes') filtered = filtered.filter((item: any) => item.type === 'quiz');

                setContent(filtered);
            } catch (err: any) {
                console.error("Error fetching content hub:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchContent();
        }
    }, [userId, activeTab]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text color="error">İçerik yüklenemedi: {error}</Text>
            </View>
        );
    }

    if (content.length === 0) {
        return (
            <View style={styles.center}>
                <Text color="textSecondary">Henüz içerik bulunmuyor.</Text>
            </View>
        );
    }

    const handleDelete = (postId: string) => {
        setContent(prev => prev.filter(p => p.id !== postId && p.post_id !== postId));
    };

    const renderItem = ({ item }: { item: any }) => {
        // Format object exactly as expected by existing Feed components
        const formattedItem = {
            ...item,
            id: item.id || item.post_id, // Ensure id is always present for PostOptionsMenu
            author: {
                id: item.author_id,
                username: item.author_username,
                full_name: item.author_full_name,
                avatar_value: item.author_avatar_url,
                level: item.author_level
            },
            likes: Number(item.likes_count),
            comments: Number(item.comments_count),
        };

        if (item.type === 'knowledge_card') return <HeroCard post={formattedItem} onToggleLike={() => {}} onToggleSave={() => {}} onDelete={(id?: string) => handleDelete(id || item.post_id || item.id)} />;
        if (item.type === 'discussion') return <DiscussionCard post={formattedItem} onVote={() => {}} onDelete={(id?: string) => handleDelete(id || item.post_id || item.id)} />;
        if (item.type === 'quiz') return <QuizCard post={formattedItem} onAnswer={() => {}} onDelete={(id?: string) => handleDelete(id || item.post_id || item.id)} />;
        
        return null;
    };

    return (
        <FlatList
            data={content}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // Disable nested scroll, rely on ProfileScreen scroll
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        />
    );
};

const styles = StyleSheet.create({
    center: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        paddingBottom: spacing.xxl,
    }
});
