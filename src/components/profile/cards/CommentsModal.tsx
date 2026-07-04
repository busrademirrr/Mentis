import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius } from '../../../theme';
import { getCommentsForPost, postComment } from '../../../services/commentsService';

interface CommentsModalProps {
    visible: boolean;
    postId: string;
    onClose: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ visible, postId, onClose }) => {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        if (visible && postId) {
            loadComments();
        }
    }, [visible, postId]);

    const loadComments = async () => {
        setLoading(true);
        const data = await getCommentsForPost(postId);
        setComments(data);
        setLoading(false);
    };

    const handlePost = async () => {
        if (!newComment.trim()) return;
        setPosting(true);
        const comment = await postComment(postId, newComment);
        if (comment) {
            setComments([...comments, comment]);
            setNewComment('');
        }
        setPosting(false);
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="h3" weight="bold" color="textPrimary">Tartışma</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="x" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Comments List */}
                    <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.xl }} />
                        ) : comments.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text variant="body" color="textSecondary">İlk argümanı sen sun.</Text>
                            </View>
                        ) : (
                            comments.map(comment => (
                                <View key={comment.id} style={styles.commentItem}>
                                    <View style={styles.commentHeader}>
                                        <Text variant="label" weight="bold" color="textPrimary">{comment.user?.name || 'Kullanıcı'}</Text>
                                        <Text variant="caption" color="textTertiary">{new Date(comment.created_at).toLocaleDateString()}</Text>
                                    </View>
                                    <Text variant="body" color="textSecondary" style={styles.commentText}>
                                        {comment.content}
                                    </Text>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Bir argüman veya düşünce paylaş..."
                            placeholderTextColor={colors.textTertiary}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity 
                            style={[styles.postButton, !newComment.trim() && { opacity: 0.5 }]} 
                            onPress={handlePost}
                            disabled={!newComment.trim() || posting}
                        >
                            {posting ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="send" size={18} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        height: '80%',
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    closeButton: {
        padding: spacing.xs,
    },
    commentsList: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: spacing.xxl,
    },
    commentItem: {
        marginBottom: spacing.lg,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    commentText: {
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        maxHeight: 100,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    postButton: {
        backgroundColor: colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
