import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Card, Icon } from '../ui';
import { ArenaMatch, ArenaQuestion } from '../../types/database.types';
import { arenaService } from '../../services/arenaService';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface QuizViewProps {
    match: ArenaMatch;
    onFinish: (result: { playerScore: number, opponentScore: number, correctAnswers: number, wrongAnswers: number, speedBonus: number }) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ match, onFinish }) => {
    const styles = useStyles();
    const [questions, setQuestions] = useState<ArenaQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const [playerScore, setPlayerScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [speedBonus, setSpeedBonus] = useState(0); // This is tracking local playerScore additions
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [wrongAnswers, setWrongAnswers] = useState(0);
    const [blankAnswers, setBlankAnswers] = useState(0);
    const [totalTimeMs, setTotalTimeMs] = useState(0);

    // Use a ref to keep track of synchronous accurate stats, preventing stale closures on the last question
    const statsRef = useRef({
        score: 0,
        correct: 0,
        wrong: 0,
        blank: 0,
        timeMs: 0
    });
    
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    const questionStartMs = useRef(Date.now());
    const timerAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let isMounted = true;
        arenaService.getCurrentUserId().then(id => {
            if (isMounted) setCurrentUserId(id);
        });
        return () => { isMounted = false; };
    }, []);

    const isPlayer1 = match.player1_id === currentUserId;
    
    const oppProfile = isPlayer1 ? match.player2 : match.player1;
    const oppName = oppProfile?.full_name || oppProfile?.username || 'Rakip';

    // Fetch Questions
    useEffect(() => {
        let isMounted = true;

        const loadQuestions = async () => {
            try {
                console.log(`[QuizView] Loading questions for category: ${match.category}`);
                setDebugInfo(`Fetching... category=${match.category}`);
                const data = await arenaService.fetchArenaQuestions(match.category, 10);
                if (isMounted) {
                    if (data && data.length === 10) {
                        setQuestions(data);
                    } else {
                        console.error('[QuizView] Not enough questions loaded from DB.');
                        setDebugInfo(`Failed: fetched ${data ? data.length : 0} questions for ${match.category}`);
                    }
                }
            } catch (err: any) {
                console.error('[QuizView] loadQuestions error:', err);
                setDebugInfo(`Catch Error: ${err?.message || String(err)}`);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        loadQuestions();
        
        return () => { 
            isMounted = false; 
        };
    }, [match.category]);

    // Realtime Match Scores Subscription
    useEffect(() => {
        const channel = supabase.channel(`matches:${match.id}_${Date.now()}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arena_matches', filter: `id=eq.${match.id}` }, (payload) => {
                const updatedMatch = payload.new as ArenaMatch;
                
                if (isPlayer1) {
                    setPlayerScore(updatedMatch.player1_score || 0);
                    setOpponentScore(updatedMatch.player2_score || 0);
                } else {
                    setPlayerScore(updatedMatch.player2_score || 0);
                    setOpponentScore(updatedMatch.player1_score || 0);
                }

                // If opponent forfeited, end match
                if (updatedMatch.status === 'forfeit') {
                    onFinish({ playerScore, opponentScore, correctAnswers, speedBonus });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [match.id, isPlayer1, playerScore, opponentScore, correctAnswers, speedBonus]);

    // Timer Logic
    useEffect(() => {
        if (loading || currentIndex >= questions.length || isAnswered) return;

        questionStartMs.current = Date.now();
        timerAnim.setValue(1);
        
        Animated.timing(timerAnim, {
            toValue: 0,
            duration: 10000,
            useNativeDriver: false,
        }).start(({ finished }) => {
            if (finished && !isAnswered) {
                handleTimeOut();
            }
        });
        
        return () => timerAnim.stopAnimation();
    }, [currentIndex, loading]); // Exclude isAnswered to avoid re-triggering timer on answer

    const handleTimeOut = async () => {
        if (isAnswered) return; // double check
        handleSelectOption(-1);
    };

    const handleSelectOption = async (index: number) => {
        if (isAnswered) return;
        
        setIsAnswered(true);
        setSelectedOption(index);
        timerAnim.stopAnimation();

        const currentQuestion = questions[currentIndex];
        
        // Use Date.now() for accurate, crash-free time calculation
        const timeTakenMs = index === -1 ? 10000 : Math.min(10000, Date.now() - questionStartMs.current);
        const timeTakenSec = timeTakenMs / 1000;
        
        statsRef.current.timeMs += timeTakenMs;

        let points = 0;
        let isCorrect = false;

        if (index === -1) {
            // Blank
            statsRef.current.blank += 1;
            points = 0;
        } else if (index === currentQuestion.correct_answer) {
            // Correct
            isCorrect = true;
            points = 10; // Base points
            if (timeTakenSec <= 3) points += 5;
            else if (timeTakenSec <= 6) points += 3;
            else if (timeTakenSec <= 10) points += 1;
            
            statsRef.current.correct += 1;
        } else {
            // Wrong
            points = -5; // Penalize wrong answers
            statsRef.current.wrong += 1;
        }

        statsRef.current.score += points;

        // Update local state for the immediate UI feedback
        setSpeedBonus(statsRef.current.score);
        setTotalTimeMs(statsRef.current.timeMs);
        setCorrectAnswers(statsRef.current.correct);
        setWrongAnswers(statsRef.current.wrong);
        setBlankAnswers(statsRef.current.blank);

        // Background submit, do not await to prevent UI freeze
        submitAnswer(match.id, currentQuestion.id, index, isCorrect, timeTakenMs, points).catch(e => console.error(e));

        setTimeout(() => {
            nextQuestion();
        }, 1000);
    };

    const nextQuestion = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            // End of match
            const finalStats = statsRef.current;
            await arenaService.finishMatch(match.id, finalStats.score, opponentScore);
            onFinish({ 
                playerScore: finalStats.score, 
                opponentScore, 
                correctAnswers: finalStats.correct,
                wrongAnswers: finalStats.wrong, 
                speedBonus: finalStats.timeMs // Passing the exact total time to result screen
            });
        }
    };

    const handleExit = () => {
        setShowExitConfirm(true);
    };

    const confirmExit = async () => {
        try {
            await arenaService.forfeitMatch(match.id);
            const finalStats = statsRef.current;
            onFinish({ playerScore: finalStats.score, opponentScore, correctAnswers: finalStats.correct, wrongAnswers: finalStats.wrong, speedBonus: finalStats.timeMs });
        } catch (error) {
            console.error(error);
        }
    };

    const getOptionStyle = (index: number, currentQuestion: ArenaQuestion) => {
        if (!isAnswered) return styles.optionDefault;
        
        if (index === currentQuestion.correct_answer) {
            return styles.optionCorrect;
        }
        
        if (index === selectedOption) {
            return styles.optionWrong;
        }
        
        return styles.optionDefault;
    };

    async function submitAnswer(matchId: string, questionId: string, selectedIdx: number, isCorrect: boolean, timeSpent: number, points: number) {
        try {
            await arenaService.submitAnswer(
                matchId,
                questionId,
                selectedIdx,
                isCorrect,
                timeSpent,
                points
            );
        } catch (error) {
            console.error(error);
        }
    }

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: spacing.md }}>Sorular Yükleniyor...</Text>
            </View>
        );
    }

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
                <Icon name="alert-circle" size={48} color={colors.error} />
                <Text variant="h3" weight="bold" color="textPrimary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
                    Kategori soruları yüklenemedi
                </Text>
                <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                    Veritabanında bu kategoriye ait yeterli soru yok veya bir bağlantı hatası oluştu.
                </Text>
                <Text variant="caption" color="error" style={{ marginTop: spacing.md, textAlign: 'center' }}>
                    DEBUG BİLGİSİ: {debugInfo}
                </Text>
                <TouchableOpacity style={[styles.exitButton, { marginTop: spacing.xl, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md }]} onPress={handleExit}>
                    <Text variant="body" weight="bold" color="error">Maçtan Çık</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const timerWidth = timerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.container}>
            {/* Header / Scoreboard */}
            <View style={styles.header}>
                <View style={styles.scoreBox}>
                    <Text variant="caption" color="textSecondary">Sen</Text>
                    <Text variant="h3" weight="bold" color="primary">{playerScore}</Text>
                </View>
                
                <View style={styles.progressText}>
                    <Text variant="label" weight="bold" color="textPrimary">
                        Soru {currentIndex + 1}/10
                    </Text>
                </View>
                
                <View style={[styles.scoreBox, { alignItems: 'flex-end' }]}>
                    <Text variant="caption" color="textSecondary" numberOfLines={1}>{oppName}</Text>
                    <Text variant="h3" weight="bold" color="error">{opponentScore}</Text>
                </View>
            </View>

            {/* Exit Match Button */}
            <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                <Icon name="log-out" size={16} color={colors.error} />
                <Text variant="caption" color="error" style={{ marginLeft: spacing.xs }}>Çık</Text>
            </TouchableOpacity>

            {/* Timer Bar */}
            <View style={styles.timerContainer}>
                <Animated.View style={[styles.timerBar, { width: timerWidth }]} />
            </View>

            {/* Content wrapped in ScrollView with proper flex */}
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Question */}
                <View style={styles.questionContainer}>
                    <Card padding="xl" style={styles.questionCard}>
                        <Text weight="bold" color="textPrimary" align="center" style={styles.questionText}>
                            {currentQuestion.question}
                        </Text>
                    </Card>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.8}
                            style={[styles.optionBtn, getOptionStyle(index, currentQuestion)]}
                            onPress={() => handleSelectOption(index)}
                            disabled={isAnswered}
                        >
                                <Text 
                                    weight="bold" 
                                    color={isAnswered && (index === currentQuestion.correct_answer || index === selectedOption) ? "surface" : "textPrimary"}
                                    style={styles.optionText}
                                >
                                    {option}
                                </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Exit Confirmation Modal */}
            <Modal visible={showExitConfirm} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text variant="h3" weight="bold" color="textPrimary" style={{ marginBottom: spacing.md }}>Maçtan Çık</Text>
                        <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
                            Maçtan çıkarsanız hükmen mağlup sayılırsınız. Çıkmak istediğinize emin misiniz?
                        </Text>
                        <View style={{ flexDirection: 'row', gap: spacing.md }}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} onPress={() => setShowExitConfirm(false)}>
                                <Text variant="body" weight="bold" color="textPrimary">İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.error }]} onPress={confirmExit}>
                                <Text variant="body" weight="bold" color="surface">Çık</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

function useStyles() { return StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    scoreBox: {
        width: 80,
    },
    progressText: {
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
    },
    exitButton: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        padding: spacing.xs,
    },
    timerContainer: {
        height: 6,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    timerBar: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xxl * 2, // Safe area
    },
    questionContainer: {
        marginBottom: spacing.xxl,
    },
    questionCard: {
        minHeight: 160,
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.xl,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    questionText: {
        fontSize: 22, // Strict 22px as requested
        lineHeight: 32,
    },
    optionsContainer: {
        gap: spacing.md,
    },
    optionBtn: {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.lg,
        borderWidth: 2,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16, // Strict 16px for options
    },
    optionDefault: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    optionCorrect: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    optionWrong: {
        backgroundColor: colors.error,
        borderColor: colors.error,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: radius.md,
    }
}); }
