import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Card, Icon } from '../ui';
import { ArenaMatch, ArenaQuestion } from '../../types/database.types';
import { fetchArenaQuestions, submitAnswer, finishMatch, forfeitMatch, CURRENT_USER_ID } from '../../services/arenaService';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface QuizViewProps {
    match: ArenaMatch;
    onFinish: (result: { playerScore: number, opponentScore: number, correctAnswers: number, speedBonus: number }) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ match, onFinish }) => {
    const [questions, setQuestions] = useState<ArenaQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const [playerScore, setPlayerScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [speedBonus, setSpeedBonus] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const timerAnim = useRef(new Animated.Value(1)).current;

    const isPlayer1 = match.player1_id === CURRENT_USER_ID;
    
    const oppProfile = isPlayer1 ? match.player2 : match.player1;
    const oppName = oppProfile?.full_name || oppProfile?.username || 'Rakip';

    // Fetch Questions
    useEffect(() => {
        let isMounted = true;
        const loadQuestions = async () => {
            const data = await fetchArenaQuestions(match.category, 5);
            if (isMounted && data.length > 0) {
                setQuestions(data);
                setLoading(false);
            }
        };
        loadQuestions();
        return () => { isMounted = false; };
    }, [match.category]);

    // Realtime Match Scores Subscription
    useEffect(() => {
        const channel = supabase.channel(`matches:${match.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${match.id}` }, (payload) => {
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
        if (loading || currentIndex >= questions.length) return;

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
    }, [currentIndex, loading]);

    const handleTimeOut = async () => {
        setIsAnswered(true);
        const currentQuestion = questions[currentIndex];
        await submitAnswer(match.id, currentQuestion.id, -1, false, 0, 0);

        setTimeout(() => {
            nextQuestion();
        }, 1500);
    };

    const handleSelectOption = async (index: number) => {
        if (isAnswered) return;
        
        setIsAnswered(true);
        setSelectedOption(index);
        timerAnim.stopAnimation();

        const currentQuestion = questions[currentIndex];
        const isCorrect = index === currentQuestion.correct_answer;
        
        const remainingFraction = (timerAnim as any)._value || 0; 
        const remainingSeconds = Math.max(0, Math.floor(remainingFraction * 10));

        let points = 0;
        if (isCorrect) {
            const bonus = remainingSeconds * 10;
            points = 100 + bonus;
            
            // Only update local state for the immediate UI feedback, 
            // the realtime subscription will sync the actual score.
            setSpeedBonus(prev => prev + bonus);
            setCorrectAnswers(prev => prev + 1);
        }

        // Submit to backend
        await submitAnswer(match.id, currentQuestion.id, index, isCorrect, remainingSeconds, points);

        setTimeout(() => {
            nextQuestion();
        }, 1500);
    };

    const nextQuestion = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            // End of match
            await finishMatch(match.id, playerScore, opponentScore);
            onFinish({ playerScore, opponentScore, correctAnswers, speedBonus });
        }
    };

    const handleExit = () => {
        setShowExitConfirm(true);
    };

    const confirmExit = async () => {
        setShowExitConfirm(false);
        await forfeitMatch(match.id);
        onFinish({ playerScore, opponentScore, correctAnswers, speedBonus });
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

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: spacing.md }}>Sorular Yükleniyor...</Text>
            </View>
        );
    }

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return null;

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
                        Soru {currentIndex + 1}/5
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
                    <Card padding="lg" style={styles.questionCard}>
                        <Text variant="h2" weight="bold" color="textPrimary" align="center" style={styles.questionText}>
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
                                variant="body" 
                                weight="bold" 
                                color={isAnswered && (index === currentQuestion.correct_answer || index === selectedOption) ? "surface" : "textPrimary"}
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

const styles = StyleSheet.create({
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
        minHeight: 180,
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    questionText: {
        lineHeight: 32,
    },
    optionsContainer: {
        gap: spacing.md,
    },
    optionBtn: {
        padding: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 2,
        alignItems: 'center',
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
});
