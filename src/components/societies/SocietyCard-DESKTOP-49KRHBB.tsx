import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { Text, Icon } from '../ui';
import { Society } from '../../types/database.types';

interface SocietyCardProps {
    society: Society;
}

export const SocietyCard = ({ society }: SocietyCardProps) => {
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.9}>
            <View style={styles.header}>
                <View style={styles.emblemWrap}>
                    <Text variant="h2" weight="bold" color="surface">
                        {society.name.charAt(0)}
                    </Text>
                </View>
                <View style={styles.rightHeader}>
                    {society.prestige_tier === 'elite' && (
                        <View style={styles.prestigeBadge}>
                            <Icon name="award" size={14} color="#8b5cf6" />
                        </View>
                    )}
                    <View style={styles.onlineTag}>
                        <View style={styles.dot} />
                        <Text variant="caption" weight="bold" color="#34d399">{society.onlineCount}</Text>
                    </View>
                </View>
            </View>

            <Text variant="label" weight="bold" color="textSecondary" style={styles.preTitle}>AKADEMİ</Text>
            <Text variant="h2" weight="bold" color="textPrimary" style={styles.title}>{society.name}</Text>
            <Text variant="body" color="textSecondary" style={styles.quote}>"{society.description}"</Text>

            <View style={styles.divider} />

            <View style={styles.currentDebate}>
                <Text variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: 4 }}>Bugünün konusu:</Text>
                <Text variant="body" weight="bold" color="textPrimary" numberOfLines={2}>
                    "{society.currentDebate?.title || 'Genel Tartışma'}"
                </Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <Icon name="users" size={14} color="textSecondary" />
                        <Text variant="caption" color="textPrimary" style={{ marginLeft: 4 }}>
                            {society.memberCount && society.memberCount > 1000 ? `${(society.memberCount/1000).toFixed(1)}K` : society.memberCount}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Icon name="flame" size={14} color="#f97316" />
                        <Text variant="caption" weight="bold" color="#f97316" style={{ marginLeft: 4 }}>
                            Çok aktif
                        </Text>
                    </View>
                </View>
                <View style={styles.joinBtn}>
                    <Text variant="caption" weight="bold" color="surface">KATIL</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    emblemWrap: {
        width: 48,
        height: 48,
        borderRadius: radius.lg,
        backgroundColor: '#a78bfa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    prestigeBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#34d399',
        marginRight: 4,
    },
    preTitle: {
        letterSpacing: 1,
        marginBottom: 4,
    },
    title: {
        marginBottom: spacing.sm,
    },
    quote: {
        fontStyle: 'italic',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginBottom: spacing.md,
    },
    currentDebate: {
        marginBottom: spacing.xl,
        backgroundColor: '#f8fafc',
        padding: spacing.md,
        borderRadius: radius.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    joinBtn: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: spacing.lg,
        paddingVertical: 8,
        borderRadius: radius.pill,
    }
});
