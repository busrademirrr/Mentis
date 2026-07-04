import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Card, Icon } from '../ui';
import { UserStats } from '../../types/database.types';

interface ProfileStatsProps {
    stats: UserStats;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
    // Format large numbers
    const formatNumber = (num: number) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <View style={styles.container}>
            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
                <Card padding="md" style={styles.statBox}>
                    <Text variant="h2" weight="bold" color="textPrimary">{formatNumber(stats.followers_count)}</Text>
                    <Text variant="caption" color="textSecondary" style={styles.statLabel}>TAKİPÇİ</Text>
                </Card>
                <Card padding="md" style={styles.statBox}>
                    <Text variant="h2" weight="bold" color="textPrimary">{formatNumber(stats.following_count)}</Text>
                    <Text variant="caption" color="textSecondary" style={styles.statLabel}>TAKİP EDİLEN</Text>
                </Card>
                <Card padding="md" style={[styles.statBox, styles.statBoxPurple]}>
                    <Text variant="h2" weight="bold" color="#6d28d9">{formatNumber(stats.argument_votes)}</Text>
                    <Text variant="caption" color="#8b5cf6" style={styles.statLabel}>ARGÜMAN OYU</Text>
                </Card>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.xl,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statBoxPurple: {
        backgroundColor: '#f3e8ff',
        borderColor: '#d8b4fe',
    },
    statLabel: {
        marginTop: spacing.xs,
        fontSize: 10,
        letterSpacing: 0.5,
    },
    badgesScroll: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
    },
    badgeIcon: {
        marginRight: spacing.xs,
    }
});
