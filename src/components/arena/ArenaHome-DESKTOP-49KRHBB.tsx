import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Card } from '../ui';
import { Landmark, BookOpen, Palette, Trophy, Swords, Activity, Users, Shield } from 'lucide-react-native';
import { LeaderboardList } from './LeaderboardList'; // Assuming LeaderboardList was here, I will make a generic UI for it if missing.

interface ArenaHomeProps {
    onSelectCategory: (category: string) => void;
    userElo?: number;
    matchesPlayed?: number;
    duelsWon?: number;
    avgScore?: number;
    leaderboard?: any[];
}

export const ArenaHome: React.FC<ArenaHomeProps> = ({ 
    onSelectCategory, 
    userElo = 1200, 
    matchesPlayed = 0,
    duelsWon = 0,
    avgScore = 0,
    leaderboard = []
}) => {
    const styles = useStyles();
    
    // We must use the exact Turkish category IDs for matchmaking to work
    const CATEGORIES = [
        { id: 'Felsefe Ligi', title: 'Felsefe', color: '#6366f1', icon: <Landmark color={colors.textPrimary} size={28}/> },
        { id: 'Bilim Ligi', title: 'Bilim', color: '#3b82f6', icon: <Activity color={colors.textPrimary} size={28}/> },
        { id: 'Sanat Arenası', title: 'Sanat', color: '#a855f7', icon: <Palette color={colors.textPrimary} size={28}/> },
        { id: 'Tarih Meydanı', title: 'Tarih', color: '#f59e0b', icon: <BookOpen color={colors.textPrimary} size={28}/> }
    ];

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Header: Arena Profile Stats */}
            <Card padding="md" style={styles.profileHeader}>
                <View style={styles.profileTop}>
                    <View>
                        <Text variant="h2" weight="bold" color="textPrimary">Mentis Rating</Text>
                        <Text variant="body" color="textSecondary">Global Knowledge Rank</Text>
                    </View>
                    <View style={styles.eloContainer}>
                        <Trophy size={20} color={colors.primary} />
                        <Text variant="h1" weight="bold" color="primary" style={{ marginLeft: spacing.xs }}>{userElo}</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Activity size={16} color={colors.textSecondary} />
                        <Text variant="caption" color="textSecondary" style={styles.statLabel}>Girilen Düello</Text>
                        <Text variant="label" weight="bold" color="textPrimary">{matchesPlayed}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Swords size={16} color={colors.textSecondary} />
                        <Text variant="caption" color="textSecondary" style={styles.statLabel}>Kazanılan</Text>
                        <Text variant="label" weight="bold" color="textPrimary">{duelsWon}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Shield size={16} color={colors.textSecondary} />
                        <Text variant="caption" color="textSecondary" style={styles.statLabel}>Skor</Text>
                        <Text variant="label" weight="bold" color="textPrimary">%{avgScore}</Text>
                    </View>
                </View>
            </Card>

            {/* Categories */}
            <Text variant="h3" weight="bold" color="textPrimary" style={styles.sectionTitle}>
                Kategorini Seç
            </Text>
            
            <View style={styles.grid}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity 
                        key={cat.id} 
                        style={[styles.cardContainer, { backgroundColor: cat.color }]}
                        onPress={() => onSelectCategory(cat.id)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardContent}>
                            <View style={styles.iconCircle}>
                                {cat.icon}
                            </View>
                            <Text variant="h3" weight="bold" color="textPrimary" style={styles.cardTitle}>{cat.title}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Leaderboard Section */}
            <View style={styles.leaderboardSection}>
                <View style={styles.leaderboardHeader}>
                    <Text variant="h3" weight="bold" color="textPrimary">Arena Leaderboard</Text>
                    <Users size={20} color={colors.textSecondary} />
                </View>
                
                <View style={styles.leaderboardContainer}>
                    {leaderboard && leaderboard.length > 0 ? (
                        leaderboard.map((user, index) => (
                            <View key={user.id} style={styles.leaderboardRow}>
                                <View style={styles.lbLeft}>
                                    <Text variant="body" weight="bold" color={index < 3 ? 'primary' : 'textSecondary'} style={styles.rank}>#{index + 1}</Text>
                                    <View style={styles.lbAvatar} />
                                    <Text variant="body" weight="medium" color="textPrimary">{user.username}</Text>
                                </View>
                                <View style={styles.lbRight}>
                                    <Trophy size={14} color={colors.primary} style={{ marginRight: 4 }} />
                                    <Text variant="label" weight="bold" color="primary">{user.arena_elo}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyLeaderboard}>
                            <Text variant="body" color="textSecondary">Henüz liderlik tablosunda kimse yok.</Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

function useStyles() { return StyleSheet.create({
    scrollContent: {
        paddingBottom: spacing.xxl * 2,
        paddingTop: spacing.md,
    },
    profileHeader: {
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        backgroundColor: colors.surface,
    },
    profileTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
    },
    eloContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.full,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        marginTop: 4,
        marginBottom: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.borderHighlight,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.xxl,
    },
    cardContainer: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: radius.xl,
        marginBottom: spacing.md,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'transform 0.2s',
        } as any)
    },
    cardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    cardTitle: {
        textAlign: 'center',
    },
    leaderboardSection: {
        marginTop: spacing.md,
    },
    leaderboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    leaderboardContainer: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        padding: spacing.md,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    lbLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rank: {
        width: 30,
    },
    lbAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.borderHighlight,
        marginRight: spacing.md,
    },
    lbRight: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    emptyLeaderboard: {
        padding: spacing.xl,
        alignItems: 'center',
    }
}); }
