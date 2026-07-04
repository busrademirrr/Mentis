import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius } from '../../../theme';

interface DiscussionCardProps {
    post: any;
    onVote?: (side: 'A' | 'B') => void;
}

export const DiscussionCard: React.FC<DiscussionCardProps> = ({ post, onVote }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    // Using sample data for MVP if payload is missing
    const sideA = post?.payload?.side_a || 'Seçenek A';
    const sideB = post?.payload?.side_b || 'Seçenek B';
    
    const percentageA = post?.vote_percentage_a || 50;
    const percentageB = post?.vote_percentage_b || 50;
    const activeUsers = post?.active_participants || 0;

    return (
        <View 
            style={[styles.container, isHovered && styles.containerHover]}
            {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false)
            } : {})}
        >
            <View style={styles.header}>
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text variant="caption" weight="bold" color="error">CANLI TARTIŞMA</Text>
                </View>
                <View style={styles.activeUsers}>
                    <Icon name="users" size={12} color={colors.textSecondary} />
                    <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>{activeUsers} kişi katılıyor</Text>
                </View>
            </View>

            <Text variant="h3" weight="bold" color="textPrimary" style={styles.title} align="center">
                {post?.title || 'Tartışma Başlığı'}
            </Text>

            <View style={styles.versusContainer}>
                <View style={styles.sideColumn}>
                    <Text variant="label" weight="bold" color="primary" align="center">{sideA}</Text>
                    <Text variant="h2" weight="bold" color="textPrimary" style={styles.percentage}>{percentageA}%</Text>
                </View>
                
                <View style={styles.vsBadge}>
                    <Text variant="caption" weight="bold" color="textTertiary">VS</Text>
                </View>
                
                <View style={styles.sideColumn}>
                    <Text variant="label" weight="bold" color="error" align="center">{sideB}</Text>
                    <Text variant="h2" weight="bold" color="textPrimary" style={styles.percentage}>{percentageB}%</Text>
                </View>
            </View>
            
            {/* Progress Bar visual */}
            <View style={styles.barContainer}>
                <View style={[styles.barA, { width: `${percentageA}%` }]} />
                <View style={[styles.barB, { width: `${percentageB}%` }]} />
            </View>

            <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8} onPress={() => {}}>
                <Text variant="label" weight="bold" color="surface">Fikrini Belirt</Text>
                <Icon name="arrow-right" size={16} color={colors.surface} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...(Platform.OS === 'web' && { transition: 'border-color 0.2s, box-shadow 0.2s' } as any),
    },
    containerHover: {
        borderColor: colors.borderFocus,
        ...(Platform.OS === 'web' && { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } as any),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.error,
        marginRight: 6,
    },
    activeUsers: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        marginBottom: spacing.xl,
        lineHeight: 28,
    },
    versusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        position: 'relative',
    },
    sideColumn: {
        flex: 1,
        alignItems: 'center',
    },
    vsBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    percentage: {
        marginTop: spacing.sm,
    },
    barContainer: {
        height: 8,
        borderRadius: 4,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: spacing.xl,
    },
    barA: {
        backgroundColor: colors.primary,
        height: '100%',
    },
    barB: {
        backgroundColor: colors.error,
        height: '100%',
    },
    ctaButton: {
        backgroundColor: colors.textPrimary,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    }
});
