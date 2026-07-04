import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text } from '../ui';
import { findOrCreateMatch, leaveQueue, CURRENT_USER_ID, getMatchDetails } from '../../services/arenaService';
import { supabase } from '../../lib/supabase';
import { ArenaMatch } from '../../types/database.types';

interface MatchmakingViewProps {
    category: string;
    onMatchFound: (match: ArenaMatch) => void;
    onCancel: () => void;
}

export const MatchmakingView: React.FC<MatchmakingViewProps> = ({ category, onMatchFound, onCancel }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [statusText, setStatusText] = useState('Aranıyor...');
    // We use a ref to prevent onMatchFound from causing unnecessary effect re-runs
    const onMatchFoundRef = useRef(onMatchFound);

    useEffect(() => {
        onMatchFoundRef.current = onMatchFound;
    }, [onMatchFound]);

    useEffect(() => {
        // Pulsing animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
            ])
        ).start();

        let isMounted = true;
        let queueChannel: any = null;

        const processMatchFound = async (matchId: string) => {
            if (!isMounted) return;
            setStatusText('Eşleşme Bulundu!');
            const matchDetails = await getMatchDetails(matchId);
            if (isMounted && matchDetails) {
                // Ensure we clean up the queue since we have a match
                await leaveQueue();
                onMatchFoundRef.current(matchDetails);
            }
        };

        const startMatchmaking = async () => {
            try {
                // 1. Enter queue or find match immediately via RPC
                const matchId = await findOrCreateMatch(category);
                
                if (matchId) {
                    // Match found immediately!
                    await processMatchFound(matchId);
                } else {
                    // 2. Added to queue. Subscribe to match_queue for updates
                    queueChannel = supabase.channel(`match_queue:${CURRENT_USER_ID}`)
                        .on('postgres_changes', { 
                            event: 'UPDATE', 
                            schema: 'public', 
                            table: 'match_queue', 
                            filter: `user_id=eq.${CURRENT_USER_ID}` 
                        }, async (payload) => {
                            const newQueue = payload.new;
                            if (newQueue.status === 'matched') {
                                // We got matched! But we don't have the match ID here directly.
                                // We can fetch the latest match for this user
                                const { data } = await supabase
                                    .from('matches')
                                    .select('id')
                                    .or(`player1_id.eq.${CURRENT_USER_ID},player2_id.eq.${CURRENT_USER_ID}`)
                                    .order('created_at', { ascending: false })
                                    .limit(1)
                                    .single();
                                    
                                if (data && data.id) {
                                    await processMatchFound(data.id);
                                }
                            }
                        })
                        .subscribe();
                }

            } catch (e) {
                console.error("Matchmaking error:", e);
                if (isMounted) setStatusText('Bağlantı hatası!');
            }
        };

        startMatchmaking();

        return () => {
            isMounted = false;
            if (queueChannel) supabase.removeChannel(queueChannel);
        };
    }, [category]); // Removed onMatchFound from dependencies to prevent loop

    const handleCancel = async () => {
        setStatusText('İptal ediliyor...');
        await leaveQueue();
        onCancel();
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.avatar}>
                <Text style={styles.emoji}>🔍</Text>
            </View>
            <Text variant="h2" weight="bold" color="textPrimary" style={styles.title}>
                {statusText}
            </Text>
            <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.xxl }}>
                Liginize uygun bir oyuncu bulunuyor
            </Text>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text variant="label" weight="bold" color="surface">İptal Et</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    pulseCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: colors.primary,
        opacity: 0.2,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
        marginBottom: spacing.xl,
    },
    emoji: {
        fontSize: 40,
    },
    title: {
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    cancelButton: {
        marginTop: spacing.xxl,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        backgroundColor: colors.error,
        borderRadius: radius.pill,
    }
});
