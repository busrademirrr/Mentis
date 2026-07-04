import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Card, Icon } from '../ui';
import { UserActivity } from '../../types/database.types';

interface ProfileActivityGridProps {
    activities: UserActivity[];
}

export const ProfileActivityGrid: React.FC<ProfileActivityGridProps> = ({ activities }) => {
    
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'post': return { name: 'edit-3', color: '#3b82f6', bg: '#eff6ff' };
            case 'debate': return { name: 'message-circle', color: '#f43f5e', bg: '#fff1f2' };
            case 'arena': return { name: 'crosshair', color: '#f59e0b', bg: '#fffbeb' };
            case 'badge': return { name: 'award', color: '#8b5cf6', bg: '#f3e8ff' };
            case 'level_up': return { name: 'arrow-up-circle', color: '#10b981', bg: '#ecfdf5' };
            default: return { name: 'activity', color: '#64748b', bg: '#f8fafc' };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    };

    return (
        <View style={styles.container}>
            <Text variant="h3" weight="bold" color="textPrimary" style={styles.sectionTitle}>
                Son Etkinlikler
            </Text>
            
            <View style={styles.activityList}>
                {activities.length > 0 ? (
                    activities.map(activity => {
                        const iconData = getActivityIcon(activity.type);
                        return (
                            <View key={activity.id} style={styles.activityItem}>
                                <View style={[styles.iconBg, { backgroundColor: iconData.bg }]}>
                                    <Icon name={iconData.name as any} size={18} color={iconData.color} />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text variant="body" color="textPrimary" numberOfLines={2}>
                                        {activity.metadata?.title || 'Bilinmeyen Etkinlik'}
                                    </Text>
                                    <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                                        {formatDate(activity.created_at)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Card padding="lg" style={{ alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 32, marginBottom: spacing.md }}>📭</Text>
                        <Text variant="body" color="textSecondary">Henüz bir etkinlik yok.</Text>
                    </Card>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    activityList: {
        gap: spacing.md,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: radius.circle,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    activityContent: {
        flex: 1,
    }
});
