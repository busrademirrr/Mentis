import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { Avatar } from '../ui/Avatar';
import { Post } from '../../types/database.types';
import { useResponsive } from '../../hooks/useResponsive';
import { useNavigation } from '@react-navigation/native';
import { PostOptionsMenu } from './PostOptionsMenu';

interface ArticleCardProps {
    post: Post;
    onToggleLike?: () => void;
    onToggleSave?: () => void;
    onToggleShare?: () => void;
    onOpenDetail?: () => void;
    onDelete?: () => void;
}

const timeAgo = (dateString?: string) => {
    if (!dateString) return 'Az önce';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} gün önce`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ay önce`;
};

const formatCount = (count?: number | bigint) => {
    if (!count) return '0';
    const num = Number(count);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

const PremiumArticleCard = ({ post, onToggleLike, onToggleSave, onToggleShare, onOpenDetail, onDelete, isMobile }: ArticleCardProps & { isMobile: boolean }) => {
    // Strict Database-Driven UI. No local test counters allowed.
    const styles = useStyles();
    const likesCount = Number(post.likes_count) || 0;
    const isLiked = !!post.user_has_liked;
    const savesCount = Number(post.saves_count) || 0;
    const isSaved = !!post.user_has_saved;
    const commentsCount = Number(post.comments_count) || 0;
    const sharesCount = Number((post as any).shares_count) || 0;
    
    // Premium styling requires extracting tags and views.
    const tags = Array.isArray((post as any).tags) ? (post as any).tags : [];
    const viewsCount = (post as any).views_count || 0;
    
    // Using a beautiful default hero image for the AI/Technology aesthetic if not provided
    const heroImage = post.image_url || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop';
    const isVerified = (post.user?.level || 1) >= 5 || post.user?.username === 'ahmet.yilmaz'; // Simulated logic for screenshot aesthetic

    const contentText = post.content || '';
    const isLongContent = contentText.length > 180;
    
    const navigation = useNavigation<any>();
    const postAny = post as any;

    const handleAuthorPress = () => {
        const authorId = postAny.author_id || postAny.user?.id || post.author_id;
        if (authorId) {
            navigation.navigate('Profile', { userId: authorId });
        }
    };

    return (
        <View style={[styles.card, isMobile && styles.cardMobile]}>
            {/* Header: Author & Context */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.authorRow} onPress={handleAuthorPress}>
                    <Avatar 
                        url={postAny.author?.avatar_value || postAny.author?.avatar_url || postAny.user?.avatar_url} 
                        name={postAny.author?.full_name || postAny.author?.username || postAny.user?.full_name || postAny.user?.username || 'Mentis Yazarı'} 
                        size={28} 
                    />
                    <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                        <Text variant="body" weight="medium" color="textPrimary" numberOfLines={1}>
                            {postAny.author?.full_name || postAny.author?.username || postAny.user?.full_name || postAny.user?.username || 'Mentis Yazarı'}
                        </Text>
                        <Text variant="caption" color="textTertiary">
                            {post.category || 'Bilgi Kartı'} • {timeAgo(post.created_at)}
                        </Text>
                    </View>
                </TouchableOpacity>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>Bilgi Kartı</Text>
                    </View>
                    <View style={styles.moreBtn}>
                        <PostOptionsMenu post={post} onDelete={onDelete} />
                    </View>
                </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
                <Text variant="h1" weight="bold" color="textPrimary" style={styles.title}>
                    {post.title}
                </Text>
                
                {post.short_description && (
                    <Text variant="body" color="textSecondary" style={styles.subtitle}>
                        {post.short_description}
                    </Text>
                )}

                {/* Hero Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
                </View>

                {/* Tags */}
                {tags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {tags.map((tag: string, index: number) => (
                            <View key={index} style={styles.tagPill}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Text Preview */}
                <Text variant="body" color="textSecondary" style={styles.bodyText} numberOfLines={isMobile ? 3 : 5}>
                    {contentText}
                </Text>

                {isLongContent && (
                    <TouchableOpacity style={styles.readMoreBtn} onPress={onOpenDetail}>
                        <Text style={styles.readMoreText}>Devamını oku</Text>
                        <Icon name="chevron-down" size={16} color={colors.textPrimary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Footer: Interactions */}
            <View style={styles.footer}>
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={onToggleLike} activeOpacity={0.6}>
                        <Icon name="heart" size={22} color={isLiked ? '#ef4444' : colors.textSecondary} />
                        <Text style={[styles.actionCount, isLiked && { color: '#ef4444' }]}>
                            {formatCount(likesCount)}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={onOpenDetail} activeOpacity={0.6}>
                        <Icon name="message-circle" size={22} color={colors.textSecondary} />
                        <Text style={styles.actionCount}>{formatCount(commentsCount)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={onToggleSave} activeOpacity={0.6}>
                        <Icon name="bookmark" size={22} color={isSaved ? colors.primary : colors.textSecondary} />
                        <Text style={[styles.actionCount, isSaved && { color: colors.primary }]}>
                            {formatCount(savesCount)}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionBtn} onPress={onToggleShare} activeOpacity={0.6}>
                        <Icon name="share-2" size={22} color={colors.textSecondary} />
                        <Text style={styles.actionCount}>{formatCount(sharesCount)}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.viewsContainer}>
                    <Text style={styles.viewsText}>{formatCount(viewsCount)} görüntüleme</Text>
                </View>
            </View>
        </View>
    );
};

export const ArticleCard = (props: ArticleCardProps) => {
    const { isMobile } = useResponsive();
    return <PremiumArticleCard {...props} isMobile={isMobile} />;
};

function useStyles() { return StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
        elevation: 3,
        ...(Platform.OS === 'web' && { transition: 'box-shadow 0.2s ease' } as any),
    },
    cardMobile: {
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorMeta: {
        marginLeft: spacing.md,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: colors.primaryLight,
        borderRadius: 4,
        marginRight: spacing.sm,
    },
    categoryBadgeText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    moreBtn: {
        padding: 4,
    },
    contentSection: {
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 24,
        lineHeight: 30,
        marginBottom: spacing.sm,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: spacing.md,
    },
    imageContainer: {
        width: '100%',
        height: 240,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.surfaceHover,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: colors.primaryLight,
        borderRadius: 16,
    },
    tagText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    bodyText: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: spacing.sm,
    },
    readMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    readMoreText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.background,
        paddingTop: spacing.md,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xl,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    actionCount: {
        marginLeft: 6,
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    viewsContainer: {
        justifyContent: 'center',
    },
    viewsText: {
        fontSize: 13,
        color: colors.textTertiary,
        fontWeight: '500',
    }
}); }
