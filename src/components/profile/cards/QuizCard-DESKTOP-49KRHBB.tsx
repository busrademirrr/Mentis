import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius } from '../../../theme';

interface QuizCardProps {
    post: any;
    onStart?: () => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ post, onStart }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const xpReward = post?.payload?.xp_reward || 150;
    const difficulty = post?.difficulty || 'Orta Seviye';
    const completionCount = post?.completion_count || 0;

    return (
        <View 
            style={[styles.container, isHovered && styles.containerHover]}
            {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false)
            } : {})}
        >
            <View style={styles.contentRow}>
                <View style={styles.iconContainer}>
                    <Icon name="help-circle" size={24} color={colors.warning} />
                </View>
                <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                        <Text variant="caption" weight="bold" color="warning" style={styles.category}>MİNİ QUİZ</Text>
                        <View style={styles.xpBadge}>
                            <Icon name="star" size={12} color={colors.warning} />
                            <Text variant="caption" weight="bold" color="warning" style={{ marginLeft: 4 }}>+{xpReward} XP</Text>
                        </View>
                    </View>
                    <Text variant="label" weight="bold" color="textPrimary" style={styles.title}>
                        {post?.title || 'Felsefe Tarihi Testi'}
                    </Text>
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Icon name="bar-chart-2" size={14} color={colors.textSecondary} />
                            <Text variant="caption" color="textSecondary" style={styles.statText}>{difficulty}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="check-circle" size={14} color={colors.textSecondary} />
                            <Text variant="caption" color="textSecondary" style={styles.statText}>{completionCount} çözüm</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="clock" size={14} color={colors.textSecondary} />
                            <Text variant="caption" color="textSecondary" style={styles.statText}>2 dk</Text>
                        </View>
                    </View>
                </View>
                
                <TouchableOpacity style={styles.playButton} activeOpacity={0.8} onPress={onStart}>
                    <Icon name="play" size={20} color={colors.surface} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...(Platform.OS === 'web' && { transition: 'border-color 0.2s, box-shadow 0.2s' } as any),
    },
    containerHover: {
        borderColor: colors.borderFocus,
        ...(Platform.OS === 'web' && { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } as any),
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: radius.md,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
        marginRight: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    category: {
        letterSpacing: 1,
        marginRight: spacing.sm,
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    title: {
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 4,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
