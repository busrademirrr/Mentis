import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius } from '../theme';
import { useUserActivity } from '../hooks/useUserActivity';

export const ActivityScreen = () => {
    const { activities, loading } = useUserActivity();

    return (
        <Screen backgroundColor="background" withSafeTop>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text variant="h1" weight="bold" color="textPrimary">Son Etkinlikler</Text>
                    <Text variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                        Mentis üzerindeki tüm geçmiş etkileşimlerin.
                    </Text>
                </View>

                {loading ? (
                    <Text>Yükleniyor...</Text>
                ) : activities.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="activity" size={48} color={colors.textTertiary} />
                        <Text variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
                            Henüz bir etkinlik bulunmuyor.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        {activities.map((act) => (
                            <View key={act.id} style={styles.activityItem}>
                                <View style={styles.iconBox}>
                                    <Icon 
                                        name={
                                            act.type === 'save' ? 'bookmark' :
                                            act.type === 'arena_win' ? 'award' :
                                            act.type === 'badge_earn' ? 'shield' : 'file-text'
                                        } 
                                        size={18} 
                                        color={colors.primary} 
                                    />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text variant="body" color="textPrimary">
                                        {act.type === 'save' ? 'Bir içeriği kaydettin.' :
                                         act.type === 'arena_win' ? 'Arena maçını kazandın!' :
                                         act.type === 'badge_earn' ? 'Yeni bir rozet kazandın!' : 'Yeni bir içerik paylaştın.'}
                                    </Text>
                                    <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                                        {new Date(act.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.xl,
        maxWidth: 800,
        marginHorizontal: 'auto',
        width: '100%',
    },
    header: {
        marginBottom: spacing.xl,
    },
    timeline: {
        gap: spacing.md,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight || 'rgba(139, 92, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    activityContent: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    }
});
