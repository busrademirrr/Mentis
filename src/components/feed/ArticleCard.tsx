import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { colors, spacing, radius, typography } from '../../theme';
import { Text, Icon } from '../ui';
import { Post } from '../../types/database.types';
import { useResponsive } from '../../hooks/useResponsive';

interface ArticleCardProps {
    post: Post;
    onToggleLike?: () => void;
    onToggleSave?: () => void;
}

export const ArticleCard = ({ post, onToggleLike, onToggleSave }: ArticleCardProps) => {
    const navigation = useNavigation<any>();
    const { payload } = post;
    const { isMobile } = useResponsive();
    
    const [isHovered, setIsHovered] = useState(false);
    const [isLikeHovered, setIsLikeHovered] = useState(false);
    const [isCommentHovered, setIsCommentHovered] = useState(false);
    const [isSaveHovered, setIsSaveHovered] = useState(false);
    const [isShareHovered, setIsShareHovered] = useState(false);

    const likesCount = typeof post.likes === 'number' ? post.likes : 0;
    const commentsCount = typeof post.comments === 'number' ? post.comments : 0;
    
    const imageUrl = payload?.image_url || post.image_url;
    const formatNumber = (num: number) => num > 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString();

    const handleShare = async (e: any) => {
        e.stopPropagation();
        if (Platform.OS === 'web' && navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.short_description || '',
                    url: `${window.location.origin}/post/${post.id}`
                });
            } catch (err) {
                Toast.show({ type: 'info', text1: 'Bağlantı kopyalandı!' });
            }
        } else {
            Toast.show({ type: 'info', text1: 'Bağlantı kopyalandı!' });
        }
    };

    return (
        <View 
            // @ts-ignore
            onHoverIn={() => setIsHovered(true)} onHoverOut={() => setIsHovered(false)}
            style={[styles.container, isHovered && styles.containerHovered]}
        >
            <Pressable onPress={() => navigation.navigate('Comments', { postId: post.id })}>
                <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
                    
                    {/* Left: Image Box */}
                    {imageUrl && (
                        <View style={[styles.imageWrapper, isMobile && styles.imageWrapperMobile]}>
                            <Image source={{ uri: imageUrl }} style={styles.image} />
                            {post.category && (
                                <View style={styles.categoryBadge}>
                                    <Text variant="caption" weight="bold" color="surface" style={{ fontSize: 10 }}>{post.category}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Right: Text Content */}
                    <View style={styles.textContent}>
                        <View style={styles.headerRow}>
                            <Text variant="h2" weight="bold" color="textPrimary" style={styles.title} numberOfLines={2}>
                                {post.title}
                            </Text>
                            <Icon name="more-horizontal" size={16} color="textTertiary" />
                        </View>
                        
                        {(post.short_description || payload?.description) ? (
                            <Text variant="body" color="textSecondary" style={styles.subtitle} numberOfLines={1}>
                                {post.short_description || payload?.description}
                            </Text>
                        ) : null}

                        <Text variant="body" color="textPrimary" style={styles.previewText} numberOfLines={2}>
                            {post.content || "Stoacılık, kontrol edebildiğimiz şeylere odaklanmamız gerektiğini söyler. Modern dünyada stres, belirsizlik ve bilgi kirliliği içinde kaybolurken Stoacı düşünce..."}
                        </Text>
                        
                        <Text variant="label" weight="bold" color="primary" style={styles.readMore}>
                            Devamını oku
                        </Text>
                    </View>
                </View>

                {/* Bottom Action Bar */}
                <View style={styles.actionBar}>
                    <View style={styles.actionLeft}>
                        <Pressable 
                            // @ts-ignore
                            onHoverIn={() => setIsLikeHovered(true)} onHoverOut={() => setIsLikeHovered(false)}
                            style={[styles.actionBtn, isLikeHovered && styles.actionBtnHover]} 
                            onPress={(e) => { e.stopPropagation(); onToggleLike && onToggleLike(); }}
                        >
                            <Icon name="heart" size={18} color={post.user_has_liked ? "#ef4444" : (isLikeHovered ? "#ef4444" : colors.textSecondary)} />
                            <Text variant="label" weight="medium" color={post.user_has_liked ? "#ef4444" : (isLikeHovered ? "#ef4444" : "textSecondary")} style={styles.actionText}>
                                {formatNumber(likesCount)}
                            </Text>
                        </Pressable>

                        <Pressable 
                            // @ts-ignore
                            onHoverIn={() => setIsCommentHovered(true)} onHoverOut={() => setIsCommentHovered(false)}
                            style={[styles.actionBtn, isCommentHovered && styles.actionBtnHover]} 
                            onPress={(e) => { e.stopPropagation(); navigation.navigate('Comments', { postId: post.id }); }}
                        >
                            <Icon name="message-circle" size={18} color={isCommentHovered ? colors.primary : colors.textSecondary} />
                            <Text variant="label" weight="medium" color={isCommentHovered ? "primary" : "textSecondary"} style={styles.actionText}>
                                {formatNumber(commentsCount)}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.actionRight}>
                        <Pressable 
                            // @ts-ignore
                            onHoverIn={() => setIsSaveHovered(true)} onHoverOut={() => setIsSaveHovered(false)}
                            style={[styles.actionBtn, isSaveHovered && styles.actionBtnHover]} 
                            onPress={(e) => { e.stopPropagation(); onToggleSave && onToggleSave(); }}
                        >
                            <Icon name="bookmark" size={18} color={post.user_has_saved ? "#8b5cf6" : (isSaveHovered ? "#8b5cf6" : colors.textSecondary)} />
                            <Text variant="label" weight="medium" color={post.user_has_saved ? "#8b5cf6" : (isSaveHovered ? "#8b5cf6" : "textSecondary")} style={styles.actionText}>
                                Kaydet
                            </Text>
                        </Pressable>

                        <Pressable 
                            // @ts-ignore
                            onHoverIn={() => setIsShareHovered(true)} onHoverOut={() => setIsShareHovered(false)}
                            style={[styles.actionBtn, isShareHovered && styles.actionBtnHover]} 
                            onPress={handleShare}
                        >
                            <Icon name="share-2" size={18} color={isShareHovered ? colors.textPrimary : colors.textSecondary} />
                            <Text variant="label" weight="medium" color={isShareHovered ? "textPrimary" : "textSecondary"} style={styles.actionText}>
                                Paylaş
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        marginBottom: spacing.xl,
        padding: spacing.lg,
        maxWidth: 820,
        width: '100%',
        ...Platform.select({
            web: { transition: 'box-shadow 0.2s ease, border-color 0.2s ease' } as any,
        }),
    },
    containerHovered: {
        borderColor: 'rgba(139, 92, 246, 0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    } as any,
    mainContent: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    mainContentMobile: {
        flexDirection: 'column',
    },
    imageWrapper: {
        width: 220,
        height: 140,
        borderRadius: radius.md,
        overflow: 'hidden',
        marginRight: spacing.lg,
        backgroundColor: colors.background,
    },
    imageWrapperMobile: {
        width: '100%',
        height: 180,
        marginRight: 0,
        marginBottom: spacing.md,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    categoryBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.sm,
    },
    textContent: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    title: {
        fontSize: typography.sizes.lg,
        lineHeight: 24,
        flex: 1,
        paddingRight: spacing.sm,
    },
    subtitle: {
        fontSize: typography.sizes.sm,
        color: '#6b7280',
        marginBottom: spacing.sm,
    },
    previewText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4b5563',
        marginBottom: 4,
    },
    readMore: {
        fontSize: 14,
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    actionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: radius.md,
        backgroundColor: 'transparent',
        ...Platform.select({ web: { transition: 'background-color 0.2s ease', cursor: 'pointer' } as any }),
    },
    actionBtnHover: {
        backgroundColor: colors.background,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
    }
});
