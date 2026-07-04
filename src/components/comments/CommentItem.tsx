import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius } from '../../theme';
import { CommentV4 } from '../../services/commentsService';
import { useAuth } from '../../context/AuthContext';

interface CommentItemProps {
    comment: CommentV4;
    onReply: (comment: CommentV4) => void;
    onLike: (commentId: string, isLiked: boolean) => void;
    onEdit: (comment: CommentV4) => void;
    onDelete: (commentId: string) => void;
    onReport: (commentId: string) => void;
    isReply?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
    comment, onReply, onLike, onEdit, onDelete, onReport, isReply = false
}) => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [showReplies, setShowReplies] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const isAuthor = user?.id === comment.author_id;
    const isDeleted = comment.is_deleted;
    const isHidden = comment.is_hidden;

    // Relative time formatter
    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes}d`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}s`;
        return `${Math.floor(hours / 24)}g`;
    };

    const handleProfileClick = () => {
        if (!isDeleted && comment.author_id) {
            navigation.navigate('Profile', { userId: comment.author_id });
        }
    };

    if (isHidden) {
        return (
            <View style={[styles.container, isReply && styles.replyContainer]}>
                <Text variant="body" color="textTertiary" style={{ fontStyle: 'italic' }}>
                    Bu yorum moderasyon nedeniyle gizlenmiştir.
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isReply && styles.replyContainer]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.authorRow} onPress={handleProfileClick} disabled={isDeleted}>
                    {isDeleted || !comment.author_avatar_url ? (
                        <View style={styles.avatarPlaceholder}>
                            <Icon name="user" size={16} color={colors.textTertiary} />
                        </View>
                    ) : (
                        <Image source={{ uri: comment.author_avatar_url }} style={styles.avatar} />
                    )}
                    <Text variant="label" weight="bold" color={isDeleted ? 'textTertiary' : 'textPrimary'}>
                        {isDeleted ? '[Silinmiş Kullanıcı]' : (comment.author_full_name || comment.author_username || 'Kullanıcı')}
                    </Text>
                    {comment.author_username && !isDeleted && (
                        <Text variant="caption" color="textTertiary" style={{ marginLeft: 4 }}>
                            @{comment.author_username}
                        </Text>
                    )}
                </TouchableOpacity>
                <View style={styles.metaRow}>
                    <Text variant="caption" color="textTertiary">{getTimeAgo(comment.created_at)}</Text>
                    {!isDeleted && (
                        <TouchableOpacity style={styles.moreBtn} onPress={() => setMenuVisible(!menuVisible)}>
                            <Icon name="more-horizontal" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.contentWrap}>
                <Text variant="body" color={isDeleted ? 'textTertiary' : 'textSecondary'} style={[styles.content, isDeleted && { fontStyle: 'italic' }]}>
                    {comment.content}
                </Text>
                {comment.is_edited && !isDeleted && (
                    <Text variant="caption" color="textTertiary" style={styles.editedBadge}>(Düzenlendi)</Text>
                )}
            </View>

            {!isDeleted && (
                <View style={styles.actionsBar}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(comment.id, comment.liked_by_me)}>
                        <Icon name="heart" size={14} color={comment.liked_by_me ? colors.error : colors.textTertiary} />
                        <Text variant="caption" weight="medium" color={comment.liked_by_me ? 'error' : 'textTertiary'} style={styles.actionText}>
                            {comment.likes_count || 0}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => onReply(comment)}>
                        <Icon name="message-square" size={14} color={colors.textTertiary} />
                        <Text variant="caption" weight="medium" color="textTertiary" style={styles.actionText}>Yanıtla</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Menu Dropdown */}
            {menuVisible && !isDeleted && (
                <View style={styles.menuOverlay}>
                    {isAuthor ? (
                        <>
                            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onEdit(comment); }}>
                                <Icon name="edit-2" size={14} color={colors.textPrimary} />
                                <Text style={styles.menuText}>Düzenle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onDelete(comment.id); }}>
                                <Icon name="trash-2" size={14} color={colors.error} />
                                <Text style={[styles.menuText, { color: colors.error }]}>Sil</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onReport(comment.id); }}>
                            <Icon name="flag" size={14} color={colors.error} />
                            <Text style={[styles.menuText, { color: colors.error }]}>Bildir</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <View style={styles.threadLineContainer}>
                    {!showReplies ? (
                        <TouchableOpacity style={styles.showRepliesBtn} onPress={() => setShowReplies(true)}>
                            <View style={styles.threadLineStub} />
                            <Text variant="caption" weight="bold" color="primary">{comment.replies.length} yanıtı görüntüle</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.repliesList}>
                            <TouchableOpacity style={styles.hideRepliesBtn} onPress={() => setShowReplies(false)}>
                                <View style={styles.threadLineFull} />
                            </TouchableOpacity>
                            <View style={styles.repliesWrapper}>
                                {comment.replies.map(reply => (
                                    <CommentItem 
                                        key={reply.id} 
                                        comment={reply} 
                                        onReply={onReply} 
                                        onLike={onLike}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onReport={onReport}
                                        isReply={true} 
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
        position: 'relative',
    },
    replyContainer: {
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: colors.borderHighlight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.sm,
    },
    avatar: {
        width: 24, height: 24, borderRadius: 12,
        marginRight: spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    moreBtn: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
    },
    contentWrap: {
        paddingLeft: 24 + spacing.sm, // avatar width + margin
        marginBottom: spacing.xs,
    },
    content: {
        lineHeight: 20,
    },
    editedBadge: {
        marginTop: 2,
        fontSize: 11,
    },
    actionsBar: {
        flexDirection: 'row',
        paddingLeft: 24 + spacing.sm,
        gap: spacing.lg,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    actionText: {
        marginLeft: 4,
    },
    threadLineContainer: {
        marginTop: spacing.sm,
        marginLeft: 12, // center of parent avatar (24/2)
    },
    showRepliesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    threadLineStub: {
        width: 24,
        height: 1,
        backgroundColor: colors.borderHighlight,
        marginRight: spacing.sm,
    },
    repliesList: {
        flexDirection: 'row',
    },
    hideRepliesBtn: {
        paddingRight: spacing.md,
        alignItems: 'center',
    },
    threadLineFull: {
        width: 2,
        flex: 1,
        backgroundColor: colors.borderHighlight,
        borderRadius: 1,
    },
    repliesWrapper: {
        flex: 1,
        paddingTop: spacing.xs,
    },
    menuOverlay: {
        position: 'absolute',
        top: 24,
        right: 0,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        zIndex: 10,
        minWidth: 120,
        padding: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        gap: spacing.sm,
    },
    menuText: {
        fontSize: 14,
        color: colors.textPrimary,
    }
});
