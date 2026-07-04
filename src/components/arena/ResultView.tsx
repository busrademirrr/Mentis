import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Card } from '../ui';
import { ArenaMatch } from '../../types/database.types';
import { CURRENT_USER_ID } from '../../services/arenaService';

interface ResultViewProps {
    match: ArenaMatch;
    result: {
        playerScore: number;
        opponentScore: number;
        correctAnswers: number;
        speedBonus: number;
    };
    onReturnHome: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ match, result, onReturnHome }) => {
    const { playerScore, opponentScore, correctAnswers, speedBonus } = result;
    const isPlayer1 = match.player1_id === CURRENT_USER_ID;
    const oppProfile = isPlayer1 ? match.player2 : match.player1;
    const oppName = oppProfile?.full_name || oppProfile?.username || 'Rakip';

    const isWin = match.winner_id === CURRENT_USER_ID;
    const isDraw = match.winner_id === null && match.status === 'finished';

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const getTitle = () => {
        if (isDraw) return 'Berabere!';
        return isWin ? 'Zafer!' : 'Mağlubiyet!';
    };

    const getTitleColor = () => {
        if (isDraw) return 'textPrimary';
        return isWin ? 'success' : 'error';
    };

    const xpEarned = isWin ? 50 : (isDraw ? 10 : 0);
    const totalXp = xpEarned + speedBonus;

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                
                <Text style={styles.emoji}>{isWin ? '🏆' : (isDraw ? '🤝' : '💔')}</Text>
                
                <Text variant="h1" weight="bold" color={getTitleColor()} align="center" style={styles.title}>
                    {getTitle()}
                </Text>

                <View style={styles.scoreRow}>
                    <View style={styles.scoreCol}>
                        <Text variant="caption" color="textSecondary">Sen</Text>
                        <Text variant="h2" weight="bold" color={isWin ? "success" : "textPrimary"}>{playerScore}</Text>
                    </View>
                    <Text variant="h3" color="textSecondary">-</Text>
                    <View style={styles.scoreCol}>
                        <Text variant="caption" color="textSecondary" numberOfLines={1}>{oppName || 'Rakip'}</Text>
                        <Text variant="h2" weight="bold" color={!isWin && !isDraw ? "success" : "textPrimary"}>{opponentScore}</Text>
                    </View>
                </View>

                <Card padding="lg" style={styles.statsCard}>
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Doğru Cevaplar</Text>
                        <Text variant="body" weight="bold" color="textPrimary">{correctAnswers} / 5</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Maç XP</Text>
                        <Text variant="body" weight="bold" color="textPrimary">+{xpEarned}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Hız Bonusu</Text>
                        <Text variant="body" weight="bold" color="textPrimary">+{speedBonus}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.primary, opacity: 0.5 }]} />
                    <View style={styles.statRow}>
                        <Text variant="h3" weight="bold" color="primary">Toplam Kazanılan</Text>
                        <Text variant="h3" weight="bold" color="primary">+{totalXp} XP</Text>
                    </View>
                </Card>

                {isWin && (
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakEmoji}>🔥</Text>
                        <Text variant="label" weight="bold" color="#ea580c">3 Galibiyet Serisi!</Text>
                    </View>
                )}

            </Animated.View>

            <View style={styles.footer}>
                <TouchableOpacity activeOpacity={0.8} style={styles.primaryBtn} onPress={onReturnHome}>
                    <Text variant="label" weight="bold" color="surface">Arenaya Dön</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: spacing.xl,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 72,
        marginBottom: spacing.md,
    },
    title: {
        marginBottom: spacing.xl,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
        marginBottom: spacing.xxl,
    },
    scoreCol: {
        alignItems: 'center',
    },
    statsCard: {
        width: '100%',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xs,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffedd5',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: '#fed7aa',
    },
    streakEmoji: {
        fontSize: 18,
        marginRight: spacing.xs,
    },
    footer: {
        width: '100%',
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        alignItems: 'center',
    }
});
