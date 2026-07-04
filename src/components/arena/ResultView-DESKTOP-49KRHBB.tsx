import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Card, Icon } from '../ui';
import { ArenaMatch } from '../../types/database.types';
import { CURRENT_USER_ID } from '../../services/arenaService';

interface ResultViewProps {
    match: ArenaMatch;
    result: {
        playerScore: number;
        opponentScore: number;
        correctAnswers: number;
        wrongAnswers: number;
        speedBonus: number; // Actually holds totalTimeMs now
    };
    onReturnHome: () => void;
    onPlayAgain?: () => void; // Added for V3.2
}

export const ResultView: React.FC<ResultViewProps> = ({ match, result, onReturnHome, onPlayAgain }) => {
    const styles = useStyles();
    const { playerScore, opponentScore, correctAnswers, wrongAnswers, speedBonus: totalTimeMs } = result;
    const isPlayer1 = match.player1_id === CURRENT_USER_ID;
    const oppProfile = isPlayer1 ? match.player2 : match.player1;
    const oppName = oppProfile?.full_name || oppProfile?.username || 'Rakip';

    const isWin = playerScore > opponentScore || (match.winner_id === CURRENT_USER_ID);
    const isDraw = playerScore === opponentScore && match.status === 'finished';

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

    const avgResponseTime = (totalTimeMs / 1000 / 10).toFixed(1);
    const totalDuration = (totalTimeMs / 1000).toFixed(1);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                
                <View style={styles.iconContainer}>
                    <Icon name={isWin ? 'award' : (isDraw ? 'minus' : 'x-circle')} size={64} color={isWin ? colors.success : (isDraw ? colors.textPrimary : colors.error)} />
                </View>
                
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
                        <Text variant="body" color="textSecondary">Toplam Skor</Text>
                        <Text variant="h3" weight="bold" color="primary">{playerScore}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Doğru Sayısı</Text>
                        <Text variant="body" weight="bold" color="success">{correctAnswers}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Yanlış Sayısı</Text>
                        <Text variant="body" weight="bold" color="error">{wrongAnswers}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Ortalama Tepki Süresi</Text>
                        <Text variant="body" weight="bold" color="textPrimary">{avgResponseTime} sn</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text variant="body" color="textSecondary">Toplam Süre</Text>
                        <Text variant="body" weight="bold" color="textPrimary">{totalDuration} sn</Text>
                    </View>
                </Card>

            </Animated.View>

            <View style={styles.footer}>
                {onPlayAgain && (
                    <TouchableOpacity activeOpacity={0.8} style={styles.secondaryBtn} onPress={onPlayAgain}>
                        <Icon name="refresh-cw" size={20} color={colors.primary} />
                        <Text variant="label" weight="bold" color="primary" style={{ marginLeft: spacing.sm }}>Tekrar Oyna</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity activeOpacity={0.8} style={styles.primaryBtn} onPress={onReturnHome}>
                    <Text variant="label" weight="bold" color="surface">Arenaya Dön</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

function useStyles() { return StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingTop: spacing.xl,
        paddingBottom: 120, // ensure we clear the bottom navbar
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
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
    footer: {
        width: '100%',
        gap: spacing.md,
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        alignItems: 'center',
    },
    secondaryBtn: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    }
}); }
