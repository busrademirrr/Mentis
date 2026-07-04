import React, { useState } from 'react';
import { View, StyleSheet, Image, Platform, Pressable, LayoutAnimation, UIManager, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { colors, spacing, radius, typography } from '../../theme';
import { Text, Icon } from '../ui';
import { Avatar } from '../ui/Avatar';
import { Post } from '../../types/database.types';
import { CATEGORIES } from '../../constants/categories';
import { PostOptionsMenu } from './PostOptionsMenu';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HeroCardProps {
    post: Post;
    onToggleLike: () => void;
    onToggleSave: () => void;
    onDelete?: () => void;
}

export const HeroCard = ({ post, onToggleLike, onToggleSave, onDelete }: HeroCardProps) => {
    const navigation = useNavigation<any>();
    const styles = useStyles();
    
    if (!post) return null;
    
    const { payload } = post;
    const postAny = post as any;
    
    const [isHovered, setIsHovered] = useState(false);
    const [isLikeHovered, setIsLikeHovered] = useState(false);
    const [isCommentHovered, setIsCommentHovered] = useState(false);
    const [isSaveHovered, setIsSaveHovered] = useState(false);
    const [isShareHovered, setIsShareHovered] = useState(false);
    
    const [isExpanded, setIsExpanded] = useState(false);

    // Use correct metrics from get_feed_v4
    const likesCount = typeof postAny.likes_count === 'number' ? postAny.likes_count : (typeof post.likes === 'number' ? post.likes : 0);
    const commentsCount = typeof postAny.comments_count === 'number' ? postAny.comments_count : (typeof post.comments === 'number' ? post.comments : 0);
    const savesCount = typeof postAny.saves_count === 'number' ? postAny.saves_count : 0;
    
    const imageUrl = payload?.image_url || post.image_url;
    const hasImage = !!imageUrl;
    
    // Fact Box must be completely optional
    const infoBoxText = payload?.info_box_text || payload?.did_you_know;
    const hasInfoBox = infoBoxText && infoBoxText.trim().length > 0;

    // Tags
    const tags = postAny.tags || payload?.tags || [];

    // Author Details from get_feed_v4 or fallback to post.user
    const authorName = postAny.author?.full_name || postAny.author?.username || postAny.user?.full_name || postAny.user?.username || 'Mentis Yazarı';
    const authorAvatar = postAny.author?.avatar_value || postAny.author?.avatar_url || postAny.user?.avatar_url;

    // Get Category Color
    const categoryObj = CATEGORIES.find(c => c.label === post.category);
    const categoryColor = categoryObj ? categoryObj.color : colors.primary;

    // Content Display Logic
    const content = post.content || '';
    const shouldTruncate = content.length > 350;

    const formatNumber = (num: number) => num > 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString();

    const toggleExpand = (e: any) => {
        e.stopPropagation();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const handleShare = async (e: any) => {
        e.stopPropagation();
        if (Platform.OS === 'web' && navigator.share) {
            try {
                await navigator.share({
                    title: post.title || '',
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
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={[
                styles.container, 
                isHovered && styles.containerHovered
            ]}
        >
            <Pressable onPress={() => navigation.navigate('Comments', { postId: post.id })}>
                {/* 1. HERO IMAGE */}
                {hasImage && (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: imageUrl }} style={styles.image} />
                    </View>
                )}

                <View style={styles.contentWrapper}>
                    {/* 2. AUTHOR & CATEGORY ROW */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => {
                            const authorId = postAny.author_id || postAny.user?.id || post.author_id;
                            if (authorId) navigation.navigate('Profile', { userId: authorId });
                        }}>
                            <Avatar url={authorAvatar} name={authorName} size={28} />
                            <View style={{ marginLeft: spacing.sm, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                <Text variant="body" weight="medium" color="textPrimary">
                                    {authorName}
                                </Text>
                                {post.category && (
                                    <View style={{ backgroundColor: categoryColor + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1, borderColor: categoryColor + '30' }}>
                                        <Text variant="caption" weight="bold" style={{ color: categoryColor, fontSize: 11 }}>{post.category}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                        <PostOptionsMenu post={post} onDelete={onDelete} />
                    </View>

                    {/* 3. TITLE */}
                    <Text variant="h1" weight="bold" color="textPrimary" style={styles.title} numberOfLines={2}>
                        {post.title}
                    </Text>
                    
                    {/* 4. SUBTITLE */}
                    {(post.short_description || payload?.description) ? (
                        <Text variant="body" color="textSecondary" weight="medium" style={styles.subtitle} numberOfLines={2}>
                            {post.short_description || payload?.description}
                        </Text>
                    ) : null}

                    {/* Discovery Reason */}
                    {postAny.discovery_reason ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                            <Icon name="info" size={14} color={colors.primary} />
                            <Text variant="caption" color="textSecondary" style={{ marginLeft: 6, fontStyle: 'italic' }}>
                                {postAny.discovery_reason}
                            </Text>
                        </View>
                    ) : null}

                    {/* 5. MAIN CONTENT PREVIEW */}
                    {content.length > 0 && (
                        <View style={styles.previewContainer}>
                            <Text 
                                variant="body" 
                                color="textPrimary" 
                                style={styles.contentText} 
                                numberOfLines={!shouldTruncate || isExpanded ? undefined : 6}
                            >
                                {content}
                            </Text>
                            
                            {/* DEVAMINI OKU BUTTON - ONLY IF > 350 CHARS */}
                            {shouldTruncate && (
                                <Pressable onPress={toggleExpand} style={styles.readMoreBtn}>
                                    <Text variant="label" weight="bold" color="primary">
                                        {isExpanded ? "Daha az göster ∧" : "Devamını oku ∨"}
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    )}

                    {/* 6. OPTIONAL FACT BOX */}
                    {hasInfoBox && (
                        <View style={styles.didYouKnowContainer}>
                            <View style={styles.didYouKnowHeader}>
                                <Icon name="zap" size={14} color="#f59e0b" />
                                <Text variant="caption" weight="bold" color="textPrimary" style={styles.didYouKnowTitle}>
                                    Biliyor muydunuz?
                                </Text>
                            </View>
                            <Text variant="caption" color="textSecondary" style={styles.didYouKnowText}>
                                {infoBoxText}
                            </Text>
                        </View>
                    )}

                    {/* 7. TAGS */}
                    {tags && tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {tags.map((tag: string, index: number) => (
                                <View key={index} style={styles.tagChip}>
                                    <Text variant="caption" color="textSecondary">#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 8. MODERN SOCIAL ACTION BAR */}
                    <View style={styles.actionBar}>
                        <View style={styles.actionLeft}>
                            <Pressable 
                                // @ts-ignore
                                onHoverIn={() => setIsLikeHovered(true)} onHoverOut={() => setIsLikeHovered(false)}
                                style={[styles.actionBtn, isLikeHovered && styles.actionBtnHover]} 
                                onPress={(e) => { e.stopPropagation(); onToggleLike(); }}
                            >
                                <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center', width: 32, height: 32 }}>
                                    <Icon name="heart" size={32} color={post.user_has_liked ? "#ef4444" : (isLikeHovered ? "#ef4444" : colors.textSecondary)} />
                                    <Text style={{ position: 'absolute', fontSize: 11, fontWeight: 'bold', color: post.user_has_liked ? "#ef4444" : (isLikeHovered ? "#ef4444" : colors.textSecondary), marginTop: -2 }}>
                                        {formatNumber(likesCount)}
                                    </Text>
                                </View>
                            </Pressable>

                            <Pressable 
                                // @ts-ignore
                                onHoverIn={() => setIsCommentHovered(true)} onHoverOut={() => setIsCommentHovered(false)}
                                style={[styles.actionBtn, isCommentHovered && styles.actionBtnHover]} 
                                onPress={(e) => { e.stopPropagation(); navigation.navigate('Comments', { postId: post.id }); }}
                            >
                                <View style={{ position: 'relative', justifyContent: 'center', alignItems: 'center', width: 32, height: 32 }}>
                                    <Icon name="message-circle" size={32} color={isCommentHovered ? colors.primary : colors.textSecondary} />
                                    <Text style={{ position: 'absolute', fontSize: 11, fontWeight: 'bold', color: isCommentHovered ? colors.primary : colors.textSecondary, marginTop: -4 }}>
                                        {formatNumber(commentsCount)}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>

                        <View style={styles.actionRight}>
                            <Pressable 
                                // @ts-ignore
                                onHoverIn={() => setIsSaveHovered(true)} onHoverOut={() => setIsSaveHovered(false)}
                                style={[styles.actionBtn, isSaveHovered && styles.actionBtnHover]} 
                                onPress={(e) => { 
                                    e.stopPropagation(); 
                                    onToggleSave(); 
                                }}
                            >
                                <Icon name="bookmark" size={20} color={post.user_has_saved ? "#8b5cf6" : (isSaveHovered ? "#8b5cf6" : colors.textSecondary)} />
                                <Text variant="label" weight="medium" color={post.user_has_saved ? "#8b5cf6" : (isSaveHovered ? "#8b5cf6" : "textSecondary")} style={styles.actionText}>
                                    {savesCount > 0 ? formatNumber(savesCount) : 'Kaydet'}
                                </Text>
                            </Pressable>

                            <Pressable 
                                // @ts-ignore
                                onHoverIn={() => setIsShareHovered(true)} onHoverOut={() => setIsShareHovered(false)}
                                style={[styles.actionBtn, isShareHovered && styles.actionBtnHover]} 
                                onPress={handleShare}
                            >
                                <Icon name="share-2" size={20} color={isShareHovered ? colors.textPrimary : colors.textSecondary} />
                                <Text variant="label" weight="medium" color={isShareHovered ? "textPrimary" : "textSecondary"} style={styles.actionText}>
                                    Paylaş
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

function useStyles() { return StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        maxWidth: 820,
        ...Platform.select({
            web: { transition: 'box-shadow 0.2s ease, border-color 0.2s ease' } as any,
        }),
    },
    containerHovered: {
        borderColor: 'rgba(139, 92, 246, 0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    } as any,
    imageContainer: {
        width: '100%',
        height: 180, // Slightly taller for Hero feeling
        position: 'relative',
        backgroundColor: colors.background,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    moreOptionsBadge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 4,
        borderRadius: radius.circle,
    },
    contentWrapper: {
        padding: spacing.xl,
        paddingTop: spacing.lg,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        lineHeight: 24,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    previewContainer: {
        marginBottom: spacing.lg,
    },
    contentText: {
        fontSize: 16,
        lineHeight: 26,
        color: colors.textSecondary,
    },
    readMoreBtn: {
        marginTop: spacing.md,
        alignSelf: 'flex-start',
    },
    didYouKnowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceHover,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    didYouKnowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    didYouKnowTitle: {
        marginLeft: 4,
        fontSize: 13,
    },
    didYouKnowText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    tagChip: {
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.lg,
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
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: radius.md,
        backgroundColor: 'transparent',
        ...Platform.select({ web: { transition: 'background-color 0.2s ease', cursor: 'pointer' } as any }),
    },
    actionBtnHover: {
        backgroundColor: colors.background,
    },
    actionText: {
        marginLeft: 8,
        fontSize: 15,
    }
}); }
