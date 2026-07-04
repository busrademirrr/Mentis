import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Pressable } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { Avatar } from '../ui/Avatar';
import { Post } from '../../types/database.types';
import { useResponsive } from '../../hooks/useResponsive';
import { useNavigation } from '@react-navigation/native';
import { PostOptionsMenu } from './PostOptionsMenu';

interface DiscussionCardProps {
    post: Post;
    onVote: (voteData: any) => void;
    onDelete?: () => void;
}

const MobileDiscussionCard = ({ post, onVote, onDelete }: DiscussionCardProps) => {
    const styles = useMobileStyles();
    const { payload } = post;
    const hasVoted = !!post.user_debate_vote;
    const userVote = post.user_debate_vote?.selected_option;
    const navigation = useNavigation<any>();

    const handleAuthorPress = () => {
        const authorId = post.author_id || post.user?.id;
        if (authorId) navigation.navigate('Profile', { userId: authorId });
    };

    const statsA = payload?.votes_A || 0;
    const statsB = payload?.votes_B || 0;
    const actualTotal = statsA + statsB;
    const totalForMath = actualTotal || 1;
    const percentA = Math.round((statsA / totalForMath) * 100);
    const percentB = Math.round((statsB / totalForMath) * 100);

    const titleA = payload?.side_a;
    const titleB = payload?.side_b;

    if (!titleA || !titleB) {
        return (
            <View style={[styles.card, { alignItems: 'center', justifyContent: 'center', padding: spacing.xl }]}>
                <Icon name="alert-circle" size={24} color={colors.textTertiary} />
                <Text variant="caption" color="textTertiary" style={{ marginTop: spacing.sm }}>İçerik yüklenemedi</Text>
            </View>
        );
    }

    return (
        <TouchableOpacity activeOpacity={0.9} style={styles.card}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.authorRow} onPress={handleAuthorPress}>
                    <Avatar url={post.user?.avatar_url} name={post.user?.full_name || post.user?.username || 'K'} size={24} />
                    <Text variant="caption" weight="medium" color="textPrimary" style={{ marginLeft: spacing.sm }}>
                        {post.user?.full_name || post.user?.username || 'Kullanıcı'}
                    </Text>
                    <Text variant="caption" color="textTertiary" style={{ marginHorizontal: 4 }}>•</Text>
                    <Text variant="caption" color="textTertiary">{post.category || 'Tartışma'}</Text>
                </TouchableOpacity>
                <PostOptionsMenu post={post} onDelete={onDelete} />
            </View>

            <View style={styles.content}>
                <Text variant="h2" weight="bold" color="textPrimary" style={styles.title} numberOfLines={2}>
                    {post.title || "İçerik yüklenemedi"}
                </Text>
            </View>

            <View style={styles.vsBox}>
                <Pressable 
                    onPress={() => !hasVoted && onVote({ selected_option: 'A' })}
                    style={[styles.vsSide, styles.vsSideA, hasVoted && userVote === 'A' && styles.vsSelectedA]}
                >
                    <Text variant="body" weight="bold" color={hasVoted && userVote === 'A' ? '#ef4444' : "textPrimary"}>
                        {hasVoted ? `${percentA}%` : titleA}
                    </Text>
                </Pressable>
                <View style={styles.vsBadge}>
                    <Text variant="caption" weight="bold" color="textSecondary" style={{fontSize: 10}}>VS</Text>
                </View>
                <Pressable 
                    onPress={() => !hasVoted && onVote({ selected_option: 'B' })}
                    style={[styles.vsSide, styles.vsSideB, hasVoted && userVote === 'B' && styles.vsSelectedB]}
                >
                    <Text variant="body" weight="bold" color={hasVoted && userVote === 'B' ? '#3b82f6' : "textPrimary"}>
                        {hasVoted ? `${percentB}%` : titleB}
                    </Text>
                </Pressable>
            </View>

            <View style={styles.footer}>
                <View style={styles.statsRow}>
                    <View style={styles.actionBtn}>
                        <Icon name="users" size={16} color={colors.textSecondary} />
                        <Text variant="caption" color="textSecondary" style={styles.actionText}>
                            {actualTotal} Oy
                        </Text>
                    </View>
                </View>
            </View>

        </TouchableOpacity>
    );
};

const DesktopDiscussionCard = ({ post, onVote, onDelete }: DiscussionCardProps) => {
    const styles = useDesktopStyles();
    const { payload } = post;
    const [isHoveredA, setIsHoveredA] = useState(false);
    const [isHoveredB, setIsHoveredB] = useState(false);
    const navigation = useNavigation<any>();

    const hasVoted = !!post.user_debate_vote;
    const userVote = post.user_debate_vote?.selected_option;

    const handleAuthorPress = () => {
        const authorId = post.author_id || post.user?.id;
        if (authorId) navigation.navigate('Profile', { userId: authorId });
    };

    const statsA = payload?.votes_A || 0;
    const statsB = payload?.votes_B || 0;
    const actualTotal = statsA + statsB;
    const totalForMath = actualTotal || 1;
    const percentA = Math.round((statsA / totalForMath) * 100);
    const percentB = Math.round((statsB / totalForMath) * 100);

    const titleA = payload?.side_a;
    const titleB = payload?.side_b;

    if (!titleA || !titleB) {
        return (
            <View style={[styles.card, { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl }]}>
                <Icon name="alert-circle" size={32} color={colors.textTertiary} />
                <Text variant="body" color="textTertiary" style={{ marginTop: spacing.sm }}>İçerik yüklenemedi</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.userInfo} onPress={handleAuthorPress}>
                    <Avatar url={post.user?.avatar_url} name={post.user?.full_name || post.user?.username || 'K'} size={40} />
                    <View style={{ marginLeft: spacing.md }}>
                        <Text variant="caption" weight="bold" color="textPrimary">
                            {post.user?.full_name || post.user?.username || 'Kullanıcı'}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text variant="caption" color="textTertiary">{post.category || 'Tartışma'}</Text>
                            <Text variant="caption" color="textTertiary" style={{ marginHorizontal: 4 }}>•</Text>
                            <Text variant="caption" color="textTertiary">4 saat önce</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <View style={styles.moreBtn}>
                    <PostOptionsMenu post={post} onDelete={onDelete} />
                </View>
            </View>

            <View style={styles.content}>
                <Text variant="h2" weight="bold" color="textPrimary" style={styles.title}>
                    {post.title || "İçerik yüklenemedi"}
                </Text>
                <Text variant="body" color="textSecondary" style={styles.description} numberOfLines={2}>
                    {post.content || ""}
                </Text>
            </View>

            <View style={styles.vsContainer}>
                <View style={styles.vsBox}>
                    <View style={styles.vsTopTitle}>
                        <Text variant="body" weight="bold" color="textPrimary">{titleA} vs {titleB}</Text>
                    </View>
                    
                    <View style={styles.vsRow}>
                        <Pressable 
                            // @ts-ignore
                            onHoverIn={() => setIsHoveredA(true)} onHoverOut={() => setIsHoveredA(false)}
                            onPress={() => !hasVoted && onVote({ selected_option: 'A' })}
                            style={[styles.vsSide, styles.vsSideA, isHoveredA && !hasVoted && styles.vsHoverA, hasVoted && userVote === 'A' && styles.vsSelectedA]}
                        >
                            <Text variant="h3" weight="bold" color={hasVoted && userVote === 'A' ? '#ef4444' : "textPrimary"}>
                                {hasVoted ? `${percentA}%` : titleA}
                            </Text>
                            {hasVoted && <Text variant="caption" color="textSecondary">{titleA}</Text>}
                        </Pressable>
                        <View style={styles.vsBadgeWrapper}>
                            <Text variant="label" weight="bold" color="textSecondary">VS</Text>
                        </View>
                        <Pressable 
                            // @ts-ignore
                            onHoverIn={() => setIsHoveredB(true)} onHoverOut={() => setIsHoveredB(false)}
                            onPress={() => !hasVoted && onVote({ selected_option: 'B' })}
                            style={[styles.vsSide, styles.vsSideB, isHoveredB && !hasVoted && styles.vsHoverB, hasVoted && userVote === 'B' && styles.vsSelectedB]}
                        >
                            <Text variant="h3" weight="bold" color={hasVoted && userVote === 'B' ? '#3b82f6' : "textPrimary"}>
                                {hasVoted ? `${percentB}%` : titleB}
                            </Text>
                            {hasVoted && <Text variant="caption" color="textSecondary">{titleB}</Text>}
                        </Pressable>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <View style={styles.actionBtn}>
                    <Icon name="users" size={16} color={colors.textSecondary} />
                    <Text variant="caption" color="textSecondary" style={styles.actionText}>
                        {actualTotal} Oy
                    </Text>
                </View>
            </View>

        </View>
    );
};

export const DiscussionCard = (props: DiscussionCardProps) => {
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);

    if (!props.post) return null;

    if (isWebDesktop) {
        return <DesktopDiscussionCard {...props} />;
    }
    return <MobileDiscussionCard {...props} />;
};

function useMobileStyles() { return StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        maxHeight: 260,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: 18,
        lineHeight: 22,
        letterSpacing: -0.2,
    },
    vsBox: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.sm,
        overflow: 'hidden',
        alignItems: 'center',
        position: 'relative',
        marginBottom: spacing.sm,
    },
    vsSide: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    vsSideA: {
        borderRightWidth: 1,
        borderRightColor: colors.borderHighlight,
    },
    vsSideB: {},
    vsSelectedA: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    vsSelectedB: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    vsBadge: {
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -10 }],
        backgroundColor: colors.background,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        zIndex: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBtn: {
        padding: spacing.xs,
    },
    actionText: {
        marginLeft: 4,
    }
}); }

function useDesktopStyles() { return StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        ...(Platform.OS === 'web' && { transition: 'box-shadow 0.2s ease, transform 0.2s ease' } as any),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    moreBtn: {
        padding: spacing.sm,
    },
    content: {
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        lineHeight: 28,
        marginBottom: spacing.sm,
        letterSpacing: -0.3,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
    },
    vsContainer: {
        marginBottom: spacing.xl,
    },
    vsBox: {
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    vsTopTitle: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        backgroundColor: colors.background,
    },
    vsRow: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
    },
    vsSide: {
        flex: 1,
        paddingVertical: spacing.xl,
        alignItems: 'center',
        backgroundColor: colors.surface,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'background-color 0.2s ease' } as any),
    },
    vsSideA: {
        borderRightWidth: 1,
        borderRightColor: colors.borderHighlight,
    },
    vsSideB: {},
    vsHoverA: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    vsHoverB: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
    },
    vsSelectedA: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    vsSelectedB: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    vsBadgeWrapper: {
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -14 }],
        backgroundColor: colors.background,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        zIndex: 2,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        paddingTop: spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        marginRight: spacing.sm,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    actionText: {
        marginLeft: 6,
    }
}); }
