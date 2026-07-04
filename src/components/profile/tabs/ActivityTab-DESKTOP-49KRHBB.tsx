import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius } from '../../../theme';

interface ActivityTabProps {
    activities: any[];
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text variant="body" color="textSecondary">Henüz bir etkinlik bulunmuyor.</Text>
            </View>
        );
    }

    const getActivityIcon = (type: string) => {
        switch(type) {
            case 'post': return { name: 'edit-3', color: colors.primary };
            case 'save': return { name: 'bookmark', color: colors.success };
            case 'debate_win': return { name: 'award', color: colors.error };
            case 'debate_join': return { name: 'message-circle', color: colors.warning };
            case 'badge_earn': return { name: 'shield', color: '#8b5cf6' };
            default: return { name: 'activity', color: colors.textSecondary };
        }
    };

    return (
        <View style={styles.container}>
            {activities.map((activity, index) => {
                const iconDef = getActivityIcon(activity.type);
                const isLast = index === activities.length - 1;
                
                return (
                    <View key={activity.id} style={styles.timelineItem}>
                        {/* Vertical Line */}
                        {!isLast && <View style={styles.timelineLine} />}
                        
                        <View style={[styles.iconContainer, { backgroundColor: `${iconDef.color}15` }]}>
                            <Icon name={iconDef.name} size={18} color={iconDef.color} />
                        </View>
                        
                        <View style={styles.contentContainer}>
                            <View style={styles.header}>
                                <Text variant="caption" color="textTertiary">
                                    {new Date(activity.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                                </Text>
                            </View>
                            
                            <View style={styles.card}>
                                <Text variant="body" color="textPrimary" style={styles.actionText}>
                                    <Text variant="label" weight="bold">{activity.metadata?.title || 'Bir içerik'}</Text> {activity.action || 'ile etkileşime geçti.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: spacing.md,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: spacing.xl,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 23, // half of icon container width (48/2 - line width/2)
        top: 48, // start below the icon
        bottom: -spacing.xl, // extend to the next item
        width: 2,
        backgroundColor: colors.borderHighlight,
        zIndex: 0,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.lg,
        zIndex: 1,
    },
    contentContainer: {
        flex: 1,
        paddingTop: 4, // align with icon center
    },
    header: {
        marginBottom: spacing.xs,
    },
    card: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    actionText: {
        lineHeight: 22,
    }
});
