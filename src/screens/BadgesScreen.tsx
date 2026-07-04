import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius } from '../theme';
import { useUserBadges } from '../hooks/useUserBadges';

export const BadgesScreen = () => {
    const { allBadges, userBadges, loading } = useUserBadges();

    const isUnlocked = (badgeId: string) => {
        return userBadges.some(ub => ub.badge_id === badgeId);
    };

    return (
        <Screen backgroundColor="background" withSafeTop>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text variant="h1" weight="bold" color="textPrimary">Rozetler</Text>
                    <Text variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                        Kazandığın ve kazanabileceğin tüm Mentis başarımları.
                    </Text>
                </View>

                {loading ? (
                    <Text>Yükleniyor...</Text>
                ) : allBadges.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="shield" size={48} color={colors.textTertiary} />
                        <Text variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
                            Rozet sistemi henüz aktif değil.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {allBadges.map(badge => {
                            const unlocked = isUnlocked(badge.id);
                            return (
                                <View key={badge.id} style={[styles.badgeCard, !unlocked && styles.lockedCard]}>
                                    <View style={[styles.iconWrapper, !unlocked && { backgroundColor: colors.border }]}>
                                        <Icon name={badge.icon as any || 'award'} size={32} color={unlocked ? colors.surface : colors.textTertiary} />
                                    </View>
                                    <Text variant="label" weight="bold" color={unlocked ? 'textPrimary' : 'textSecondary'} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                                        {badge.name}
                                    </Text>
                                    <Text variant="caption" color="textTertiary" style={{ marginTop: 2, textAlign: 'center' }}>
                                        {badge.description}
                                    </Text>
                                    {!unlocked && (
                                        <View style={styles.lockedBadge}>
                                            <Icon name="lock" size={12} color={colors.textSecondary} />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.xl,
        maxWidth: 1000,
        marginHorizontal: 'auto',
        width: '100%',
    },
    header: {
        marginBottom: spacing.xl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.lg,
    },
    badgeCard: {
        width: 160,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: radius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        position: 'relative',
    },
    lockedCard: {
        opacity: 0.7,
        backgroundColor: 'transparent',
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f59e0b', // Default gold
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    lockedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colors.surface,
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    }
});
