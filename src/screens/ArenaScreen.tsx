import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, spacing } from '../theme';
import { useResponsive } from '../hooks/useResponsive';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';

import { ArenaHome } from '../components/arena/ArenaHome';
import { MatchmakingView } from '../components/arena/MatchmakingView';
import { VSView } from '../components/arena/VSView';
import { QuizView } from '../components/arena/QuizView';
import { ResultView } from '../components/arena/ResultView';
import { forfeitMatch, CURRENT_USER_ID } from '../services/arenaService';
import { ArenaMatch } from '../types/database.types';

type ArenaPhase = 'idle' | 'searching' | 'matched' | 'playing' | 'finished';

export const ArenaScreen = () => {
    const [phase, setPhase] = useState<ArenaPhase>('idle');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [match, setMatch] = useState<ArenaMatch | null>(null);
    const [matchResult, setMatchResult] = useState<any>(null);
    const { isDesktop } = useResponsive();

    const handleSelectCategory = useCallback((category: string) => {
        setSelectedCategory(category);
        setPhase('searching');
    }, []);

    const handleMatchFound = useCallback((newMatch: ArenaMatch) => {
        setMatch(newMatch);
        if (newMatch.status === 'matched' || newMatch.status === 'playing') {
            setPhase('matched');
        }
    }, []);

    const handleCountdownComplete = useCallback(() => {
        setPhase('playing');
    }, []);

    const handleQuizFinish = useCallback((result: { playerScore: number, opponentScore: number, correctAnswers: number, speedBonus: number }) => {
        setMatchResult(result);
        setPhase('finished');
    }, []);

    const handleReturnHome = useCallback(async () => {
        if (phase === 'searching' && match) {
            // Cancel match logic is now mostly queue logic, 
            // but we rely on leaveQueue in the component itself when cancelling.
        } else if ((phase === 'matched' || phase === 'playing') && match) {
            await forfeitMatch(match.id);
        }
        
        setSelectedCategory(null);
        setMatch(null);
        setMatchResult(null);
        setPhase('idle');
    }, [phase, match]);

    // Render back button if not in idle or finished
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
                            Bilgini test et, lig atla.
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Screen padding="md" backgroundColor="background" withSafeTop={false}>
            {renderHeader()}

            <View style={[styles.content, isDesktop && styles.contentDesktop]}>
                {phase === 'idle' && <ArenaHome onSelectCategory={handleSelectCategory} />}
                
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
                    />
                )}
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
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
});
