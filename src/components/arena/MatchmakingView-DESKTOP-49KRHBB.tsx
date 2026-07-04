import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text } from '../ui';
import { arenaService } from '../../services/arenaService';
import { ArenaMatch } from '../../types/database.types';
import { Radar } from 'lucide-react-native';

interface MatchmakingViewProps {
    category: string;
    onMatchFound: (match: ArenaMatch) => void;
    onCancel: () => void;
}

export const MatchmakingView: React.FC<MatchmakingViewProps> = ({ category, onMatchFound, onCancel }) => {
    const styles = useStyles();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [statusText, setStatusText] = useState('Rakip Aranıyor...');
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        // Pulsing animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
        ).start();

        const timer = setInterval(() => {
            setTimeElapsed(prev => {
                const next = prev + 1;
                if (next > 15) setStatusText('Uygun Rakip Aranıyor...');
                return next;
            });
        }, 1000);

        let isMounted = true;

        const startMatchmaking = async () => {
            try {
                // Call the edge function which blocks for up to 20s
                const result = await arenaService.joinQueue(category);
                
                if (isMounted && result && result.match) {
                    setStatusText('Rakip Bulundu!');
                    // Fetch full match details including opponent profile
                    const matchDetails = await arenaService.getMatchDetails(result.match.id);
                    if (matchDetails && isMounted) {
                        onMatchFound(matchDetails as any);
                    }
                }
            } catch (e: any) {
                console.error("Matchmaking error:", e);
                if (isMounted) {
                    // Show the exact error message
                    setStatusText(e.message || 'Connection error');
                    setTimeout(() => onCancel(), 4000);
                }
            }
        };

        startMatchmaking();

        return () => {
            isMounted = false;
            clearInterval(timer);
        };
    }, [category, onMatchFound, onCancel]);

    const handleCancel = async () => {
        setStatusText('Cancelling...');
        await arenaService.leaveQueue();
        onCancel();
    };

    return (
        <View style={styles.container}>
            <View style={styles.radarContainer}>
                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.avatar}>
                    <Radar size={48} color={colors.primary} />
                </View>
            </View>
            
            <Text variant="h2" weight="bold" color="textPrimary" style={styles.title}>
                {statusText}
            </Text>
            
            <Text variant="body" color="textSecondary" style={styles.subtitle}>
                {category}
            </Text>

            <View style={styles.timerContainer}>
                <Text variant="label" weight="bold" color="primary">{timeElapsed}s</Text>
            </View>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text variant="label" weight="bold" color="textPrimary">Ayrıl</Text>
            </TouchableOpacity>
        </View>
    );
};

function useStyles() { return StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.background,
    },
    radarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xxl,
        position: 'relative',
        width: 200,
        height: 200,
    },
    pulseCircle: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: colors.primary,
        opacity: 0.15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        zIndex: 2,
    },
    title: {
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        marginBottom: spacing.xl,
    },
    timerContainer: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xxl,
    },
    cancelButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    }
}); }
