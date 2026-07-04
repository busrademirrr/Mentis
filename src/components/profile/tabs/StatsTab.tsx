import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius, shadows } from '../../../theme';
import { CognitiveTrait, generateCognitiveSummary } from '../../../services/cognitiveService';

interface StatsTabProps {
    stats: any;
    reputation: any;
    cognitiveTraits: CognitiveTrait[];
}

export const StatsTab: React.FC<StatsTabProps> = ({ stats, reputation, cognitiveTraits }) => {
    return (
        <View style={styles.container}>
            {/* Reputation Overview */}
            <Text variant="h3" weight="bold" color="textPrimary" style={styles.sectionTitle}>
                İtibar Profili
            </Text>
            <View style={styles.reputationGrid}>
                <View style={[styles.statBox, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
                    <Icon name="Book" size={24} color="#3b82f6" style={styles.statIcon} />
                    <Text variant="h2" weight="bold" color="textPrimary">{reputation?.knowledge_score || 0}</Text>
                    <Text variant="label" weight="bold" color="textSecondary" style={styles.statLabel}>Bilgi Puanı</Text>
                    <Text variant="caption" color="textTertiary" style={styles.statExplanation}>
                        Kart okumaları, tamamlanan quizler ve kaydedilen içeriklerle artar.
                    </Text>
                </View>
                <View style={[styles.statBox, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                    <Icon name="MessageCircle" size={24} color="#ef4444" style={styles.statIcon} />
                    <Text variant="h2" weight="bold" color="textPrimary">{reputation?.debate_score || 0}</Text>
                    <Text variant="label" weight="bold" color="textSecondary" style={styles.statLabel}>Tartışma Puanı</Text>
                    <Text variant="caption" color="textTertiary" style={styles.statExplanation}>
                        Arena katılımları, kazanılan tartışmalar ve alınan argüman oylarıyla hesaplanır.
                    </Text>
                </View>
                <View style={[styles.statBox, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                    <Icon name="Shield" size={24} color="#10b981" style={styles.statIcon} />
                    <Text variant="h2" weight="bold" color="textPrimary">{reputation?.trust_score || 100}</Text>
                    <Text variant="label" weight="bold" color="textSecondary" style={styles.statLabel}>Güven Skoru</Text>
                    <Text variant="caption" color="textTertiary" style={styles.statExplanation}>
                        Doğrulanmış kaynak kullanımı ve yapıcı etkileşim oranıdır.
                    </Text>
                </View>
                <View style={[styles.statBox, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                    <Icon name="Users" size={24} color="#8b5cf6" style={styles.statIcon} />
                    <Text variant="h2" weight="bold" color="textPrimary">{reputation?.influence_score || 0}</Text>
                    <Text variant="label" weight="bold" color="textSecondary" style={styles.statLabel}>Etki Puanı</Text>
                    <Text variant="caption" color="textTertiary" style={styles.statExplanation}>
                        Takipçi sayısı, paylaşılan içerikler ve alınan yorumlara göre belirlenir.
                    </Text>
                </View>
            </View>

            {/* Cognitive Profile */}
            <View style={styles.cognitiveSection}>
                <Text variant="h3" weight="bold" color="textPrimary" style={styles.sectionTitle}>
                    Bilişsel Profil & Eğilimler
                </Text>
                <View style={styles.cognitiveCard}>
                    <Text variant="body" color="textPrimary" style={{ lineHeight: 26, fontSize: 16 }}>
                        {generateCognitiveSummary(cognitiveTraits)}
                    </Text>
                </View>
            </View>

            {/* Reading & Debate Analytics */}
            <View style={styles.analyticsGrid}>
                <View style={styles.analyticsCard}>
                    <View style={styles.analyticsHeader}>
                        <View style={[styles.analyticsIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <Icon name="BookOpen" size={18} color="#3b82f6" />
                        </View>
                        <Text variant="label" weight="bold" color="textPrimary" style={{ marginLeft: spacing.sm }}>Okuma & Kaydetme</Text>
                    </View>
                    <View style={styles.analyticsContent}>
                        <View style={styles.analyticRow}>
                            <Text variant="body" color="textSecondary">Okunan Kart</Text>
                            <Text variant="label" weight="bold" color="textPrimary">{stats?.content_count || 0}</Text>
                        </View>
                        <View style={styles.analyticRow}>
                            <Text variant="body" color="textSecondary">Seri (Gün)</Text>
                            <Text variant="label" weight="bold" color="primary">{reputation?.streak_count || 0}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.analyticsCard}>
                    <View style={styles.analyticsHeader}>
                        <View style={[styles.analyticsIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                            <Icon name="Zap" size={18} color="#f59e0b" />
                        </View>
                        <Text variant="label" weight="bold" color="textPrimary" style={{ marginLeft: spacing.sm }}>Etkileşim Analizi</Text>
                    </View>
                    <View style={styles.analyticsContent}>
                        <View style={styles.analyticRow}>
                            <Text variant="body" color="textSecondary">Arena Katılımı</Text>
                            <Text variant="label" weight="bold" color="textPrimary">{stats?.arena_wins || 0}</Text>
                        </View>
                        <View style={styles.analyticRow}>
                            <Text variant="body" color="textSecondary">Yazılan Argüman</Text>
                            <Text variant="label" weight="bold" color="textPrimary">{stats?.argument_votes || 0}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sectionTitle: {
        marginBottom: spacing.lg,
    },
    reputationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xl,
        marginBottom: spacing.xxxl,
    },
    statBox: {
        flex: 1,
        minWidth: Platform.OS === 'web' ? 'calc(50% - 24px)' : '100%', 
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
        ...shadows.base,
    },
    statIcon: {
        marginBottom: spacing.md,
    },
    statLabel: {
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
    },
    statExplanation: {
        lineHeight: 20,
    },
    cognitiveSection: {
        marginBottom: spacing.xxxl,
    },
    cognitiveCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        ...shadows.base,
    },
    analyticsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xl,
    },
    analyticsCard: {
        flex: 1,
        minWidth: 280,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...shadows.base,
    },
    analyticsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    analyticsIconBox: {
        width: 32,
        height: 32,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyticsContent: {
        gap: spacing.lg,
    },
    analyticRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
});
