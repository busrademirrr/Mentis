import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Animated, Share } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius } from '../../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { toggleLikePost, checkPostInteractions } from '../../../services/profileService';
import { toggleSave } from '../../../services/savedService';
import { CommentsModal } from './CommentsModal';

interface KnowledgeCardProps {
    post: any;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ post }) => {
    const [expanded, setExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Strict Database-Driven UI. No local test counters allowed.
    const likeCount = Number(post?.likes_count) || 0;
    const liked = !!post?.user_has_liked;
    const commentCount = Number(post?.comments_count) || 0;
    const saved = !!post?.user_has_saved;
    
    const [isCommentsVisible, setIsCommentsVisible] = useState(false);
    
    // Animation Values
    const saveScale = React.useRef(new Animated.Value(1)).current;
    const likeScale = React.useRef(new Animated.Value(1)).current;

    const animateButton = (animValue: Animated.Value) => {
        Animated.sequence([
            Animated.timing(animValue, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.spring(animValue, { toValue: 1.2, friction: 3, useNativeDriver: true }),
            Animated.timing(animValue, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();
    };

    const handleLike = async () => {
        animateButton(likeScale);
        await toggleLikePost(post?.id);
    };

    const handleSave = async () => {
        animateButton(saveScale);
        await toggleSave(post?.id);
    };

    const handleComment = () => {
        setIsCommentsVisible(true);
    };

    const handleShare = async () => {
        const shareUrl = `https://mentis.app/p/${post?.id}`;
        if (Platform.OS === 'web') {
            try {
                if (navigator && navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl);
                    alert('Bağlantı kopyalandı!');
                }
            } catch (err) {
                console.error('Kopyalama başarısız', err);
            }
        } else {
            try {
                await Share.share({
                    message: `Mentis'te bu bilgi kartını incele: ${post?.title}\n${shareUrl}`,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing', error);
            }
        }
    };

    const previewText = post?.content || post?.short_description || "İçerik bulunamadı.";
    
    return (
        <View 
            style={[styles.container, isHovered && styles.containerHover]}
            {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false)
            } : {})}
        >
            {/* 1. Small cover image (if exists) */}
            {post?.image_url && (
                <Image source={{ uri: post.image_url }} style={styles.coverImage} resizeMode="cover" />
            )}

            {/* 2. Category Tag */}
            <View style={styles.header}>
                <View style={styles.categoryBadge}>
                    <Text variant="caption" weight="bold" style={styles.categoryText}>{post?.category?.toUpperCase() || 'BİLGİ'}</Text>
                </View>
                <Text variant="caption" color="textTertiary">{post?.time || 'Yakın zamanda'}</Text>
            </View>

            <View style={styles.contentContainer}>
                {/* 3. Strong Title */}
                <Text variant="h2" weight="bold" color="textPrimary" style={styles.title}>
                    {post?.title || 'Başlıksız'}
                </Text>

                {/* 4. Intellectual Question (Subtitle) */}
                {post?.subtitle && (
                    <Text variant="h3" color="primary" style={styles.subtitle}>
                        {post.subtitle}
                    </Text>
                )}

                {/* 5. Content Preview */}
                <View style={styles.previewContainer}>
                    <Text 
                        variant="body" 
                        color="textSecondary" 
                        style={styles.previewText}
                        numberOfLines={expanded ? undefined : 6} // Adjusted to 6 for readable density
                    >
                        {previewText}
                    </Text>
                    
                    {!expanded && previewText.length > 300 && (
                        <LinearGradient
                            colors={['rgba(26,26,26,0)', 'rgba(26,26,26,1)']} 
                            style={styles.fadeGradient}
                        />
                    )}
                </View>

                {/* 6. Devamını Oku */}
                {!expanded && previewText.length > 300 && (
                    <TouchableOpacity onPress={() => setExpanded(true)} style={styles.expandButton} activeOpacity={0.7}>
                        <Text variant="label" weight="bold" color="primary">Devamını Oku</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 8. Interaction Bar */}
            <View style={styles.interactionBar}>
                <View style={styles.interactionGroup}>
                    <TouchableOpacity onPress={handleLike} style={styles.actionButton} activeOpacity={0.7}>
                        <Animated.View style={[{ transform: [{ scale: likeScale }] }, styles.iconWrapper]}>
                            <Icon name="heart" size={30} color={liked ? colors.error : colors.textSecondary} />
                            {likeCount > 0 && (
                                <Text style={[styles.innerCountText, { color: liked ? colors.error : colors.textSecondary, top: '42%' }]}>
                                    {likeCount > 99 ? '99+' : likeCount}
                                </Text>
                            )}
                        </Animated.View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={handleComment} style={styles.actionButton} activeOpacity={0.7}>
                        <View style={styles.iconWrapper}>
                            <Icon name="message-circle" size={30} color={colors.textSecondary} />
                            {commentCount > 0 && (
                                <Text style={[styles.innerCountText, { color: colors.textSecondary, top: '45%' }]}>
                                    {commentCount > 99 ? '99+' : commentCount}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.interactionGroup}>
                    <TouchableOpacity onPress={handleSave} style={styles.actionButton} activeOpacity={0.7}>
                        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
                            <Icon name="bookmark" size={26} color={saved ? colors.primary : colors.textSecondary} />
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleShare} style={styles.actionButton} activeOpacity={0.7}>
                        <Icon name="share-2" size={26} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <CommentsModal 
                visible={isCommentsVisible} 
                postId={post?.id} 
                onClose={() => setIsCommentsVisible(false)} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...(Platform.OS === 'web' && { transition: 'border-color 0.2s, box-shadow 0.2s' } as any),
    },
    containerHover: {
        borderColor: colors.primary,
        ...(Platform.OS === 'web' && { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } as any),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    categoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    categoryText: {
        color: colors.textSecondary,
        letterSpacing: 1,
        fontSize: 10,
    },
    coverImage: {
        width: '100%',
        height: 140, // Slightly taller for better impact but still compact
        borderRadius: radius.md,
        marginBottom: spacing.md,
    },
    contentContainer: {
        marginBottom: spacing.md,
    },
    title: {
        marginBottom: spacing.xs,
        lineHeight: 32,
    },
    subtitle: {
        marginBottom: spacing.md,
        fontStyle: 'italic',
        lineHeight: 24,
    },
    previewContainer: {
        position: 'relative',
    },
    previewText: {
        lineHeight: 26, // Increased line height for better readability
        fontSize: 15,
    },
    fadeGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    expandButton: {
        marginTop: spacing.xs,
        paddingVertical: spacing.xs,
    },
    interactionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        paddingTop: spacing.md,
    },
    interactionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xs,
    },
    iconWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        width: 34,
        height: 34,
    },
    innerCountText: {
        position: 'absolute',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%',
    }
});
