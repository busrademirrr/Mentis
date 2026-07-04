import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { Text, Icon } from '../components/ui';
import { Screen } from '../components/layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
    CommentV4, 
    getThreadedComments, 
    createComment, 
    toggleCommentLike, 
    editComment, 
    deleteComment 
} from '../services/commentsService';
import { CommentItem } from '../components/comments/CommentItem';
import { CommentInput } from '../components/comments/CommentInput';
import { CommentEmptyState } from '../components/comments/CommentEmptyState';

export const CommentsScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    let { postId } = route.params || {};

    // Fallback for Web where URL query params might not map directly to route.params in some configs
    if ((!postId || postId === 'undefined') && Platform.OS === 'web') {
        try {
            const params = new URLSearchParams(window.location.search);
            const queryPostId = params.get('postId');
            if (queryPostId) postId = queryPostId;
        } catch(e) {}
    }

    const { user } = useAuth();

    const [rawComments, setRawComments] = useState<CommentV4[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [replyingTo, setReplyingTo] = useState<CommentV4 | null>(null);
    const [editingComment, setEditingComment] = useState<CommentV4 | null>(null);

    const loadData = useCallback(async () => {
        if (!postId || postId === 'undefined') {
            setLoadError('Geçersiz Post ID');
            setLoading(false);
            return;
        }
        
        try {
            setLoadError(null);
            const comments = await getThreadedComments(postId, user?.id);
            setRawComments(comments);
        } catch (error: any) {
            console.error('Error loading threaded comments:', error);
            setLoadError(error.message || 'Yorumlar yüklenemedi.');
            alert('Hata: ' + (error.message || 'Yorumlar yüklenirken bir sorun oluştu. Lütfen veritabanı loglarını kontrol et.'));
        } finally {
            setLoading(false);
        }
    }, [postId, user?.id]);

    useEffect(() => {
        loadData();

        // Realtime Subscription for Tab A / Tab B Sync
        const channel = supabase.channel(`comments_v4_${postId}_${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => {
                loadData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_likes' }, () => {
                loadData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [postId, loadData]);

    const threadedComments = useMemo(() => {
        const root: CommentV4[] = [];
        const map = new Map<string, CommentV4>();

        // Deep copy and init
        const copies = rawComments.map(c => ({ ...c, replies: [] }));
        copies.forEach(c => map.set(c.id, c));

        copies.forEach(c => {
            if (c.parent_id && map.has(c.parent_id)) {
                map.get(c.parent_id)!.replies!.push(c);
            } else {
                root.push(c);
            }
        });
        return root;
    }, [rawComments]);

    const handleSubmit = async (content: string, parentId?: string, mentionedIds?: string[]) => {
        await createComment(postId, content, parentId, mentionedIds);
        setReplyingTo(null);
        await loadData();
    };

    const handleEdit = async (content: string) => {
        if (!editingComment) return;
        await editComment(editingComment.id, content);
        setEditingComment(null);
        await loadData();
    };

    const handleLike = async (commentId: string, isLiked: boolean) => {
        // Optimistic UI update
        setRawComments(prev => prev.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    liked_by_me: !isLiked,
                    likes_count: c.likes_count + (isLiked ? -1 : 1)
                };
            }
            return c;
        }));
        try {
            await toggleCommentLike(commentId);
        } catch (error) {
            console.error(error);
            loadData(); // revert
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            await loadData();
        } catch (error: any) {
            alert(error.message || 'Silinemedi');
        }
    };

    const handleReport = async (commentId: string) => {
        alert('Yorum bildirildi. Teşekkürler.');
        // Can add supabase.rpc('report_comment', ...) logic here
    };

    return (
        <Screen withSafeTop withSafeBottom backgroundColor="background" style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tartışma</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.container}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
                ) : (
                    <FlatList
                        data={threadedComments}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <CommentItem 
                                comment={item}
                                onReply={setReplyingTo}
                                onLike={handleLike}
                                onEdit={setEditingComment}
                                onDelete={handleDelete}
                                onReport={handleReport}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={() => (
                            <CommentEmptyState onPress={() => {}} /> // Auto focus handled by input
                        )}
                    />
                )}
            </View>

            <CommentInput 
                onSubmit={handleSubmit}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                editingComment={editingComment}
                onSubmitEdit={handleEdit}
                onCancelEdit={() => setEditingComment(null)}
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 0 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.borderHighlight,
        backgroundColor: colors.surface
    },
    backBtn: { padding: spacing.xs },
    headerTitle: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.textPrimary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: spacing.md, paddingBottom: spacing.xxxl },
});
