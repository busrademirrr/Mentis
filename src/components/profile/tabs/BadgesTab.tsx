import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius, shadows } from '../../../theme';
import { LinearGradient } from 'expo-linear-gradient';

interface BadgesTabProps {
    badges: any[];
}

const getRarityColors = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
        case 'legendary': return ['#fbbf24', '#f59e0b']; // Gold
        case 'epic': return ['#a78bfa', '#8b5cf6']; // Purple
        case 'rare': return ['#60a5fa', '#3b82f6']; // Blue
        case 'common':
        default: return ['#9ca3af', '#6b7280']; // Gray
    }
};

export const BadgesTab: React.FC<BadgesTabProps> = ({ badges }) => {
    if (!badges || badges.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                    <Icon name="Award" size={32} color={colors.primary} />
                </View>
                <Text variant="h2" weight="bold" color="textPrimary" style={styles.emptyTitle}>
                    Başarımların Kilidini Aç
                </Text>
                <Text variant="body" color="textSecondary" style={styles.emptyDesc}>
                    Topluluğa değer kat, bilgi kartları oluştur ve yeni rozetlerin kilidini açarak entelektüel ligde yüksel.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text variant="h3" weight="bold" color="textPrimary" style={styles.sectionTitle}>
                Kazanılan Rozetler
            </Text>
            
            <View style={styles.grid}>
                {badges.map((userBadge) => {
                    const badge = userBadge.badge;
                    const isUnlocked = userBadge.progress >= (badge?.condition_value || 1);
                    const gradientColors = badge?.gradient_start ? [badge.gradient_start, badge.gradient_end || badge.gradient_start] : getRarityColors(badge?.rarity);

                    return (
                        <View key={userBadge.id} style={[styles.badgeCard, !isUnlocked && styles.lockedCard]}>
                            <View style={styles.badgeIconWrapper}>
                                <LinearGradient
                                    colors={isUnlocked ? gradientColors : ['#e5e7eb', '#d1d5db']}
                                    style={styles.badgeIconBg}
                                >
                                    {/* Icon is rotated -45deg to counter the 45deg rotation of the diamond */}
                                    <View style={{ transform: [{ rotate: '-45deg' }] }}>
                                        <Icon name={badge?.icon || 'Award'} size={24} color={isUnlocked ? 'white' : colors.textTertiary} />
                                    </View>
                                </LinearGradient>
                                {userBadge.is_featured && (
                                    <View style={styles.featuredBadge}>
                                        <Icon name="Star" size={10} color="white" />
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.badgeInfo}>
                                <View style={styles.badgeHeader}>
                                    <Text variant="label" weight="bold" color={isUnlocked ? 'textPrimary' : 'textSecondary'}>
                                        {badge?.name}
                                    </Text>
                                    <Text variant="caption" weight="bold" style={{ color: gradientColors[1] }}>
                                        {badge?.rarity?.toUpperCase()}
                                    </Text>
                                </View>
                                
                                <Text variant="caption" color="textSecondary" style={styles.description}>
                                    {badge?.unlock_condition || badge?.description}
                                </Text>
                                
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBarBg}>
                                        <LinearGradient 
                                            colors={isUnlocked ? gradientColors : ['#d1d5db', '#e5e7eb']}
                                            style={[
                                                styles.progressBarFill, 
                                                { width: `${Math.min(100, ((userBadge.progress || 0) / (badge?.condition_value || 1)) * 100)}%` }
                                            ]} 
                                        />
                                    </View>
                                    <Text variant="caption" color="textTertiary" style={styles.progressText}>
                                        {userBadge.progress} / {badge?.condition_value}
                                    </Text>
                                </View>
                                
                                {badge?.xp_reward && (
                                    <Text variant="caption" color="warning" weight="bold" style={styles.rewardText}>
                                        +{badge.xp_reward} XP
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        padding: spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderStyle: 'dashed',
        marginTop: spacing.md,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: radius.circle,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyDesc: {
        textAlign: 'center',
        maxWidth: 400,
        marginBottom: spacing.xxl,
        lineHeight: 24,
    },
    sectionTitle: {
        marginBottom: spacing.xl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xl,
    },
    badgeCard: {
        width: Platform.OS === 'web' ? 'calc(50% - 12px)' : '100%',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.base,
        ...(Platform.OS === 'web' && { transition: 'border-color 0.2s, box-shadow 0.2s' } as any),
    },
    lockedCard: {
        opacity: 0.6,
        borderColor: colors.border,
        elevation: 0,
        shadowOpacity: 0,
    },
    badgeIconWrapper: {
        marginRight: spacing.xxl,
        position: 'relative',
    },
    badgeIconBg: {
        width: 60,
        height: 60,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '45deg' }], // Diamond shape
    },
    featuredBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.warning,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    badgeInfo: {
        flex: 1,
    },
    badgeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    description: {
        marginBottom: spacing.md,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: colors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
    },
    progressText: {
        minWidth: 40,
        textAlign: 'right',
    },
    rewardText: {
        marginTop: spacing.xs,
    }
});
