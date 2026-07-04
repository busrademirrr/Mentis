import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../../theme';
import { Text } from '../ui';
import { ArenaMatch } from '../../types/database.types';
import { CURRENT_USER_ID } from '../../services/arenaService';

interface VSViewProps {
    match: ArenaMatch;
    onCountdownComplete: () => void;
}

export const VSView: React.FC<VSViewProps> = ({ match, onCountdownComplete }) => {
    const [countdown, setCountdown] = useState(3);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    
    // Determine opponent and self based on current user
    const isPlayer1 = match.player1_id === CURRENT_USER_ID;
    const myProfile = isPlayer1 ? match.player1 : match.player2;
    const oppProfile = isPlayer1 ? match.player2 : match.player1;

    const myName = myProfile?.full_name || myProfile?.username || 'Sen';
    const oppName = oppProfile?.full_name || oppProfile?.username || 'Rakip';
    const myLevel = myProfile?.level || 1;
    const oppLevel = oppProfile?.level || 1;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
        }).start();

        const timer = setInterval(() => {
            setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // FIX: Execute onCountdownComplete outside of the render cycle
    useEffect(() => {
        if (countdown === 0) {
            onCountdownComplete();
        }
    }, [countdown, onCountdownComplete]);

    return (
        <View style={styles.container}>
            <View style={styles.playerSection}>
                <View style={[styles.avatar, { backgroundColor: '#a78bfa' }]}>
                    <Text style={styles.avatarText}>{myName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text variant="h3" weight="bold" color="textPrimary">{myName}</Text>
                <Text variant="caption" color="textSecondary">Seviye {myLevel}</Text>
            </View>

            <View style={styles.vsCenter}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Text variant="h1" weight="bold" color="primary" style={styles.vsText}>VS</Text>
                </Animated.View>
                <Text variant="h2" weight="bold" color="textPrimary" style={styles.countdown}>
                    {countdown > 0 ? countdown : 'BAŞLA!'}
                </Text>
            </View>

            <View style={styles.playerSection}>
                <View style={[styles.avatar, { backgroundColor: '#f87171' }]}>
                    <Text style={styles.avatarText}>{oppName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text variant="h3" weight="bold" color="textPrimary">{oppName}</Text>
                <Text variant="caption" color="textSecondary">Seviye {oppLevel}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    playerSection: {
        alignItems: 'center',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
        borderWidth: 4,
        borderColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    vsCenter: {
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    vsText: {
        fontSize: 64,
        fontStyle: 'italic',
        textShadowColor: 'rgba(167, 139, 250, 0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    countdown: {
        marginTop: spacing.md,
        fontSize: 48,
    }
});
