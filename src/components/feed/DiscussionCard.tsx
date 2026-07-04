import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Pressable, Image, LayoutAnimation, UIManager, Animated } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { Text, Icon } from '../ui';
import { Post } from '../../types/database.types';
import { submitDebateVote } from '../../services/feedService';
import { LinearGradient } from 'expo-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DiscussionCardProps {
    post: Post;
    onVote: (voteData: any) => void;
}

export const DiscussionCard = ({ post, onVote }: DiscussionCardProps) => {
    const { payload } = post;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHoveredA, setIsHoveredA] = useState(false);
    const [isHoveredB, setIsHoveredB] = useState(false);

    const hasVoted = !!post.user_debate_vote;
    const userVote = post.user_debate_vote?.selected_option;

    // Use payload data or fallback to demo data for the screenshot match
    const statsA = payload?.votes_A || 2400;
    const statsB = payload?.votes_B || 841;
    const total = statsA + statsB || 1;
    const percentA = Math.round((statsA / total) * 100);
    const percentB = Math.round((statsB / total) * 100);

    const titleA = payload?.side_a || 'Kazananlar Yazar';
    const descA = payload?.side_a_desc || 'Tarih, güçlü olanların bakış açısıyla yazılır.';
    
    const titleB = payload?.side_b || 'Objektif Yazılabilir';
    const descB = payload?.side_b_desc || 'Gerçekler er ya da geç ortaya çıkar.';

    const formatNumber = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString();

    const handleVote = async (side: 'A' | 'B') => {
        if (hasVoted || isSubmitting) return;

        setIsSubmitting(true);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        try {
            await submitDebateVote(post.id, side);
            onVote({ selected_option: side });
        } catch (error) {
            console.error('Error submitting debate vote:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Top Indicator Row */}
            <View style={styles.topRow}>
                <View style={styles.indicatorsLeft}>
                    <View style={styles.indicatorBadge}>
                        <View style={styles.redDot} />
                        <Text variant="caption" weight="bold" color="textSecondary">{formatNumber(total)} kişi tartışıyor</Text>
                    </View>
                    <View style={styles.indicatorBadge}>
                        <Text style={{ fontSize: 12 }}>🔥</Text>
                        <Text variant="caption" weight="bold" color="textPrimary" style={{ marginLeft: 4 }}>Trend Tartışma</Text>
                    </View>
                    {post.category && (
                        <View style={styles.indicatorBadge}>
                            <Text style={{ fontSize: 12 }}>📚</Text>
                            <Text variant="caption" weight="medium" color="textSecondary" style={{ marginLeft: 4 }}>{post.category}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.moreBtn}>
                    <Icon name="more-horizontal" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
            </View>

            {/* Main Question */}
            <Text variant="h1" weight="bold" color="textPrimary" style={styles.title}>
                {post.title || payload?.title || "Tarihi gerçekten kazananlar mı yazar?"}
            </Text>

            {/* Context Preview */}
            <Text variant="body" color="textSecondary" style={styles.contextText}>
                {post.content || payload?.description || "Bazı tarihçiler resmi tarihin iktidar tarafından şekillendirildiğini savunurken, bazıları tarihsel belgelerin objektif gerçekleri yansıttığını düşünüyor. Sence hangisi daha doğru?"}
            </Text>

            {/* Interactive Voting Cards */}
            <View style={styles.votingSection}>
                {/* Side A */}
                <Pressable 
                    // @ts-ignore
                    onHoverIn={() => setIsHoveredA(true)} onHoverOut={() => setIsHoveredA(false)}
                    style={[
                        styles.voteCard, 
                        styles.voteCardA,
                        isHoveredA && !hasVoted && styles.voteCardHoveredA,
                        hasVoted && userVote === 'A' && styles.voteCardSelectedA,
                        hasVoted && userVote !== 'A' && styles.voteCardUnselected
                    ]}
                    onPress={() => handleVote('A')}
                >
                    <Text variant="h3" weight="bold" color="#ef4444" style={styles.voteTitle}>{titleA}</Text>
                    <Text variant="caption" color="textSecondary" align="center" style={styles.voteDesc}>{descA}</Text>
                    
                    {hasVoted && (
                        <View style={styles.resultsWrapper}>
                            <Text style={styles.percentText}>{percentA}%</Text>
                            <Text variant="caption" color="textSecondary">{formatNumber(statsA)} oy</Text>
                            <View style={styles.progressBarBg}>
                                <Animated.View style={[styles.progressBarFillA, { width: `${percentA}%` }]} />
                            </View>
                        </View>
                    )}
                </Pressable>

                {/* VS Badge */}
                <View style={styles.vsBadgeWrapper}>
                    <View style={styles.vsBadge}>
                        <Text variant="label" weight="bold" color="textSecondary">VS</Text>
                    </View>
                </View>

                {/* Side B */}
                <Pressable 
                    // @ts-ignore
                    onHoverIn={() => setIsHoveredB(true)} onHoverOut={() => setIsHoveredB(false)}
                    style={[
                        styles.voteCard, 
                        styles.voteCardB,
                        isHoveredB && !hasVoted && styles.voteCardHoveredB,
                        hasVoted && userVote === 'B' && styles.voteCardSelectedB,
                        hasVoted && userVote !== 'B' && styles.voteCardUnselected
                    ]}
                    onPress={() => handleVote('B')}
                >
                    <Text variant="h3" weight="bold" color="#3b82f6" style={styles.voteTitle}>{titleB}</Text>
                    <Text variant="caption" color="textSecondary" align="center" style={styles.voteDesc}>{descB}</Text>
                    
                    {hasVoted && (
                        <View style={styles.resultsWrapper}>
                            <Text style={[styles.percentText, { color: '#1d4ed8' }]}>{percentB}%</Text>
                            <Text variant="caption" color="textSecondary">{formatNumber(statsB)} oy</Text>
                            <View style={styles.progressBarBg}>
                                <Animated.View style={[styles.progressBarFillB, { width: `${percentB}%` }]} />
                            </View>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Social Interaction Bar */}
            <View style={styles.bottomSocialBar}>
                <View style={styles.avatarGroup}>
                    <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=Felix' }} style={[styles.avatar, { zIndex: 4 }]} />
                    <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=Aneka' }} style={[styles.avatar, styles.avatarOverlap, { zIndex: 3 }]} />
                    <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=John' }} style={[styles.avatar, styles.avatarOverlap, { zIndex: 2 }]} />
                    <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=Sarah' }} style={[styles.avatar, styles.avatarOverlap, { zIndex: 1 }]} />
                    <Text variant="caption" color="textSecondary" style={styles.avatarText}>+32 arkadaşın oy verdi</Text>
                </View>

                <TouchableOpacity style={styles.joinBtn}>
                    <Icon name="message-circle" size={16} color="#8b5cf6" />
                    <Text variant="label" weight="bold" color="#8b5cf6" style={{ marginLeft: 6 }}>Tartışmaya Katıl</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        maxWidth: 820,
        width: '100%',
        ...Platform.select({
            web: { transition: 'box-shadow 0.2s ease, transform 0.2s ease' } as any,
        }),
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    indicatorsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    indicatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
        backgroundColor: colors.background,
    },
    redDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ef4444',
        marginRight: 6,
    },
    moreBtn: {
        padding: 4,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
        marginBottom: spacing.md,
        letterSpacing: -0.5,
    },
    contextText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4b5563',
        marginBottom: spacing.xl,
    },
    votingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        position: 'relative',
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    voteCard: {
        flex: 1,
        borderRadius: radius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: colors.surface,
        ...Platform.select({ web: { transition: 'all 0.2s ease', cursor: 'pointer' } as any }),
    },
    voteCardA: {
        borderColor: 'rgba(239, 68, 68, 0.1)',
        backgroundColor: 'rgba(239, 68, 68, 0.02)',
    },
    voteCardB: {
        borderColor: 'rgba(59, 130, 246, 0.1)',
        backgroundColor: 'rgba(59, 130, 246, 0.02)',
    },
    voteCardHoveredA: {
        borderColor: 'rgba(239, 68, 68, 0.3)',
        transform: [{ translateY: -2 }],
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
    } as any,
    voteCardHoveredB: {
        borderColor: 'rgba(59, 130, 246, 0.3)',
        transform: [{ translateY: -2 }],
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
    } as any,
    voteCardSelectedA: {
        borderColor: 'rgba(239, 68, 68, 0.4)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    voteCardSelectedB: {
        borderColor: 'rgba(59, 130, 246, 0.4)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
    },
    voteCardUnselected: {
        opacity: 0.4,
        borderColor: 'transparent',
    },
    voteTitle: {
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    voteDesc: {
        fontSize: 13,
        lineHeight: 18,
        minHeight: 36,
    },
    vsBadgeWrapper: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
        zIndex: 10,
    },
    vsBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    resultsWrapper: {
        alignItems: 'center',
        width: '100%',
        marginTop: spacing.md,
    },
    percentText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#991b1b', // Default for A, overridden for B inline
        marginBottom: 2,
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 3,
        marginTop: spacing.sm,
        overflow: 'hidden',
    },
    progressBarFillA: {
        height: '100%',
        backgroundColor: '#ef4444',
        borderRadius: 3,
    },
    progressBarFillB: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 3,
    },
    bottomSocialBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
    },
    avatarGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.surface,
        backgroundColor: '#e5e7eb',
    },
    avatarOverlap: {
        marginLeft: -8,
    },
    avatarText: {
        marginLeft: spacing.sm,
        fontSize: 13,
    },
    joinBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        ...Platform.select({ web: { transition: 'background-color 0.2s ease', cursor: 'pointer' } as any }),
    }
});
