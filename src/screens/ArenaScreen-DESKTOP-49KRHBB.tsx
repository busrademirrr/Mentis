import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { colors, spacing } from '../theme';
import { useResponsive } from '../hooks/useResponsive';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';

import { ArenaHome } from '../components/arena/ArenaHome';
import { MatchmakingView } from '../components/arena/MatchmakingView';
import { VSView } from '../components/arena/VSView';
import { QuizView } from '../components/arena/QuizView';
import { ResultView } from '../components/arena/ResultView';
import { arenaService, ArenaMatch } from '../services/arenaService';
import { supabase } from '../lib/supabase';

class ErrorBoundary extends React.Component<{children: any}, {hasError: boolean, error: any}> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <View style={{ padding: 20, backgroundColor: '#fee2e2', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#991b1b', fontWeight: 'bold', fontSize: 20 }}>ARENA CRASHED:</Text>
                    <Text style={{ color: '#991b1b', marginTop: 10 }}>{String(this.state.error)}</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

type ArenaPhase = 'idle' | 'searching' | 'matched' | 'playing' | 'finished';

export const ArenaScreen = () => {
    const styles = useStyles();
    const [phase, setPhase] = useState<ArenaPhase>('idle');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [match, setMatch] = useState<ArenaMatch | null>(null);
    const [matchResult, setMatchResult] = useState<{ playerScore: number, opponentScore: number, correctAnswers: number, wrongAnswers: number, speedBonus: number } | null>(null);
    const { isDesktop } = useResponsive();

    // User Data States
    const [userId, setUserId] = useState<string | null>(null);
    const [userMetrics, setUserMetrics] = useState({
        totalDuels: 0,
        duelsWon: 0,
        correctRate: null as number | null
    });
    
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
    const [userElo, setUserElo] = useState<number>(1200);
    
    // Category Data States
    const [activePlayers, setActivePlayers] = useState<Record<string, number>>({});

    useEffect(() => {
        let isMounted = true;

        const initializeArena = async () => {
            console.log("[ArenaScreen] Initializing Arena...");
            try {
                // 1. Authenticate
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    console.error("[ArenaScreen] Auth error:", error);
                    Alert.alert("Authentication Required", "Please log in to enter the Arena.");
                    return;
                }
                
                console.log(`[ArenaScreen] Authenticated as User: ${user.id}`);
                if (isMounted) setUserId(user.id);

                // 2. Fetch User Metrics
                const stats = await arenaService.getUserArenaStats(user.id);
                const { data: profileData } = await supabase.from('users').select('arena_elo').eq('id', user.id).single();
                
                if (isMounted) {
                    setUserMetrics({
                        totalDuels: stats.totalDuels,
                        duelsWon: stats.duelsWon,
                        correctRate: stats.correctRate
                    });
                    
                    let currentElo = profileData?.arena_elo || 1200;
                    setUserElo(currentElo);
                }

                // 3. Fetch Active Players per Category
                const { data: queueData } = await supabase
                    .from('arena_queue')
                    .select('category');
                    
                if (queueData && isMounted) {
                    const counts: Record<string, number> = {};
                    queueData.forEach((q) => {
                        counts[q.category] = (counts[q.category] || 0) + 1;
                    });
                    
                    // 4. Fetch Global Leaderboard (excluding mock data)
                    const { data: lbData } = await supabase
                        .from('users')
                        .select('id, username, arena_elo')
                        .not('username', 'in', '("socrates","plato","aristotle","ibn sina","homer","shakespeare","herodotus","leonardo","kant","felsefe_uzmani","bilim_insani","sanat_tarihcisi","kantinkedisi")')
                        .not('username', 'ilike', 'test%')
                        .not('username', 'ilike', 'user_%')
                        .order('arena_elo', { ascending: false })
                        .limit(10);
                        
                    if (lbData && isMounted) {
                        setLeaderboard(lbData);
                    }

                    setActivePlayers(counts);
                    console.log("[ArenaScreen] Active players:", counts);
                }

            } catch (err) {
                console.error("[ArenaScreen] Initialization failed:", err);
            }
        };

        initializeArena();

        return () => { isMounted = false; };
    }, []);

    const handleLeaderboardFilterChange = useCallback(async (timeframe: 'all-time' | 'weekly', category: string | null) => {
        setIsLeaderboardLoading(true);
        const lbData = await arenaService.getArenaLeaderboard(timeframe, category);
        setLeaderboard(lbData);
        setIsLeaderboardLoading(false);
    }, []);

    const handleSelectCategory = useCallback((category: string) => {
        console.log(`[ArenaScreen] -> Transition to SEARCHING for category: ${category}`);
        setSelectedCategory(category);
        setPhase('searching');
    }, []);

    const handleMatchFound = useCallback((newMatch: ArenaMatch) => {
        console.log(`[ArenaScreen] -> Transition to MATCHED. Match ID: ${newMatch.id}`);
        setMatch(newMatch);
        if (newMatch.status === 'matched' || newMatch.status === 'playing') {
            setPhase('matched');
        }
    }, []);

    const handleCountdownComplete = useCallback(() => {
        console.log(`[ArenaScreen] -> Transition to PLAYING. Quiz View starting.`);
        setPhase('playing');
    }, []);

    const handleQuizFinish = useCallback((result: { playerScore: number, opponentScore: number, correctAnswers: number, wrongAnswers: number, speedBonus: number }) => {
        console.log(`[ArenaScreen] -> Transition to FINISHED. Result calculated:`, result);
        setMatchResult(result);
        setPhase('finished');
    }, []);

    const handleReturnHome = useCallback(async () => {
        console.log(`[ArenaScreen] -> Transition to IDLE. Cleaning up match.`);
        if ((phase === 'matched' || phase === 'playing') && match) {
            await arenaService.forfeitMatch(match.id);
        }
        
        // Refresh stats
        if (userId) {
            arenaService.getUserArenaStats(userId).then(stats => {
                setUserMetrics({
                    totalDuels: stats.totalDuels,
                    duelsWon: stats.duelsWon,
                    correctRate: stats.correctRate
                });
            });
            supabase.from('users').select('arena_elo').eq('id', userId).single().then(({ data }) => {
                if (data) setUserElo(data.arena_elo);
            });
        }

        setSelectedCategory(null);
        setMatch(null);
        setMatchResult(null);
        setPhase('idle');
    }, [phase, match, userId]);

    const renderHeader = () => {
        const canGoBack = phase === 'searching' || phase === 'matched' || phase === 'playing';

        return (
            <View style={[styles.header, Platform.OS === 'web' && { paddingTop: spacing.xl }]}>
                {canGoBack && (
                    <TouchableOpacity style={[styles.backBtn, Platform.OS === 'web' && { top: spacing.xl }]} onPress={handleReturnHome}>
                        <Icon name="x" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                )}
                
                <View style={styles.headerTitles}>
                    <Text variant="h2" weight="bold" color="textPrimary" align="center">Mentis Arena</Text>
                    {phase === 'idle' && (
                        <Text variant="body" color="textSecondary" align="center" style={styles.subtitle}>
                            Knowledge Duels
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Screen padding="md" backgroundColor="background" withSafeTop={false}>
            {renderHeader()}

            <ErrorBoundary>
                <View style={[styles.content, isDesktop && styles.contentDesktop]}>
                {phase === 'idle' && (
                    <ArenaHome 
                        onSelectCategory={handleSelectCategory}
                        userElo={userElo}
                        matchesPlayed={userMetrics.totalDuels}
                        duelsWon={userMetrics.duelsWon}
                        avgScore={userMetrics.correctRate || 0}
                        leaderboard={leaderboard}
                    />
                )}
                
                {phase === 'searching' && selectedCategory && (
                    <MatchmakingView 
                        category={selectedCategory} 
                        onMatchFound={handleMatchFound} 
                        onCancel={handleReturnHome}
                    />
                )}

                {phase === 'matched' && match && (
                    <VSView 
                        match={match} 
                        onCountdownComplete={handleCountdownComplete} 
                    />
                )}

                {phase === 'playing' && match && (
                    <QuizView 
                        match={match} 
                        onFinish={handleQuizFinish} 
                    />
                )}

                {phase === 'finished' && matchResult && match && (
                    <ResultView 
                        result={matchResult} 
                        match={match}
                        onReturnHome={handleReturnHome} 
                        onPlayAgain={() => {
                            const cat = match.category;
                            handleReturnHome();
                            setTimeout(() => {
                                handleSelectCategory(cat);
                            }, 50);
                        }}
                    />
                )}
                </View>
            </ErrorBoundary>
        </Screen>
    );
};

function useStyles() { return StyleSheet.create({
    header: {
        paddingTop: 80,
        paddingBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    backBtn: {
        position: 'absolute',
        left: 0,
        top: 80,
        padding: spacing.sm,
        zIndex: 10,
    },
    headerTitles: {
        alignItems: 'center',
    },
    subtitle: {
        marginTop: spacing.xs,
    },
    content: {
        flex: 1,
    },
    contentDesktop: {
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    }
}); }
