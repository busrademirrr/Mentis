import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius, shadows } from '../../../theme';

interface StatsTabProps {
    stats: any;
    reputation?: any;
}

const getReputationLevel = (score: number) => {
    if (score >= 1000) return { title: 'Master Mind', color: '#8b5cf6', icon: 'Award' };
    if (score >= 600) return { title: 'Researcher', color: '#3b82f6', icon: 'Microscope' };
    if (score >= 300) return { title: 'Scholar', color: '#10b981', icon: 'BookOpen' };
    if (score >= 100) return { title: 'Thinker', color: '#f59e0b', icon: 'Lightbulb' };
    return { title: 'Explorer', color: '#6b7280', icon: 'Compass' };
};

export const StatsTab: React.FC<StatsTabProps> = ({ stats }) => {
    const hasData = stats && (stats.follower_count > 0 || stats.arena_matches > 0 || stats.posts_count > 0 || stats.likes_received > 0);
    
    if (!hasData) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrapper}>
                    <Icon name="BarChart2" size={48} color={colors.textTertiary} />
                </View>
                <Text variant="h3" weight="bold" color="textSecondary" style={{ marginTop: spacing.lg }}>Henüz yeterli veri bulunmuyor</Text>
                <Text variant="body" color="textTertiary" style={{ marginTop: spacing.sm, textAlign: 'center', maxWidth: 300 }}>
                    Arena maçları oynadıkça ve içerik ürettikçe istatistikleriniz burada belirmeye başlayacaktır.
                </Text>
            </View>
        );
    }

    const rep = getReputationLevel(stats.reputation_score || 0);
    const winRate = stats.arena_matches > 0 ? Math.round((stats.arena_wins / stats.arena_matches) * 100) : 0;

    return (
        <View style={styles.container}>
            
            {/* Reputation Level Banner */}
            <View style={[styles.repBanner, { borderColor: rep.color + '40', backgroundColor: rep.color + '10' }]}>
                <View style={[styles.repIconBox, { backgroundColor: rep.color }]}>
                    <Icon name={rep.icon} size={24} color="#fff" />
                </View>
                <View style={styles.repText}>
                    <Text variant="caption" weight="bold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>İtibar Seviyesi</Text>
                    <Text variant="h2" weight="bold" color="textPrimary" style={{ color: rep.color }}>{rep.title}</Text>
                </View>
                <View style={styles.repScore}>
                    <Text variant="h3" weight="bold" color="textPrimary">{stats.reputation_score || 0}</Text>
                    <Text variant="caption" color="textSecondary">Puan</Text>
                </View>
            </View>

            <View style={styles.grid}>
                
                {/* Arena Stats */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="Swords" size={20} color={colors.primary} />
                        <Text variant="h3" weight="bold" style={{ marginLeft: spacing.sm }}>Arena İstatistikleri</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Toplam Düello</Text>
                        <Text variant="h3" weight="bold">{stats.arena_matches || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Kazanılan Düello</Text>
                        <Text variant="h3" weight="bold" color="success">{stats.arena_wins || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Kazanma Oranı</Text>
                        <Text variant="h3" weight="bold">%{winRate}</Text>
                    </View>
                </View>

                {/* Content Stats */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="PenTool" size={20} color="#f59e0b" />
                        <Text variant="h3" weight="bold" style={{ marginLeft: spacing.sm }}>İçerik İstatistikleri</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Paylaşılan Gönderi</Text>
                        <Text variant="h3" weight="bold">{stats.posts_count || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Yapılan Yorum</Text>
                        <Text variant="h3" weight="bold">{stats.comments_count || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Alınan Beğeni</Text>
                        <Text variant="h3" weight="bold" color="error">{stats.likes_received || 0}</Text>
                    </View>
                </View>

                {/* Community Stats */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Icon name="Users" size={20} color="#10b981" />
                        <Text variant="h3" weight="bold" style={{ marginLeft: spacing.sm }}>Topluluk</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Takipçi</Text>
                        <Text variant="h3" weight="bold">{stats.follower_count || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Takip Edilen</Text>
                        <Text variant="h3" weight="bold">{stats.following_count || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">İçerik Kaydedilmeleri</Text>
                        <Text variant="h3" weight="bold">{stats.saves_received || 0}</Text>
                    </View>
                </View>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: spacing.xxxl,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    repBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xl,
        borderRadius: radius.xl,
        borderWidth: 1,
        marginBottom: spacing.xxl,
    },
    repIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.lg,
    },
    repText: {
        flex: 1,
    },
    repScore: {
        alignItems: 'flex-end',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xl,
    },
    card: {
        flex: 1,
        minWidth: Platform.OS === 'web' ? 'calc(50% - 24px)' : '100%',
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...shadows.base,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    }
});
