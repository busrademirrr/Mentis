import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Image, LayoutAnimation, UIManager } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { Text, Icon } from '../ui';
import { Post } from '../../types/database.types';
import { submitQuizAnswer } from '../../services/feedService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface QuizCardProps {
    post: Post;
    onAnswer: (answerData: any) => void;
}

export const QuizCard = ({ post, onAnswer }: QuizCardProps) => {
    const { payload } = post;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasAnswered = !!post.user_quiz_answer;
    const userAnswerIndex = post.user_quiz_answer?.selected_answer;
    const isCorrect = post.user_quiz_answer?.is_correct;
    
    const correctOption = payload?.correct_option ?? 2; // Default to 2 for Floransa in demo
    const explanation = payload?.explanation || "Floransa, Rönesans'ın doğduğu merkezdir. Özellikle Medici ailesinin sanata ve bilime verdiği destek bu dönemi başlatmıştır.";

    const handleOptionSelect = async (index: number) => {
        if (hasAnswered || isSubmitting) return;

        setIsSubmitting(true);
        const userIsCorrect = index === correctOption;
        
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        try {
            await submitQuizAnswer(post.id, index, userIsCorrect);
            onAnswer({ selected_answer: index, is_correct: userIsCorrect });
        } catch (error) {
            console.error('Error submitting quiz answer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={styles.headerRow}>
                <View style={styles.xpBadge}>
                    <Text variant="caption" weight="bold" color="textPrimary">+20 XP</Text>
                </View>
                
                <View style={styles.titleBadge}>
                    <Text style={{ fontSize: 14 }}>🧠</Text>
                    <Text variant="caption" weight="bold" color="primary" style={{ marginLeft: 4 }}>HIZLI QUIZ</Text>
                </View>
                
                <View style={styles.timerBadge}>
                    <Icon name="clock" size={14} color="#ef4444" />
                    <Text variant="caption" weight="bold" color="#ef4444" style={{ marginLeft: 4 }}>00:12</Text>
                </View>
            </View>

            {/* Question */}
            <Text variant="h1" weight="bold" color="textPrimary" style={styles.question}>
                {payload?.questions?.[0] || post.title || "Rönesans nerede başladı?"}
            </Text>

            {/* Grid of Options */}
            <View style={styles.optionsGrid}>
                {['Roma', 'Venedik', 'Floransa', 'Milano'].map((opt, index) => {
                    const isSelected = hasAnswered && index === userAnswerIndex;
                    const isCorrectOption = hasAnswered && index === correctOption;
                    const isWrongSelection = isSelected && !isCorrectOption;

                    let btnStyle: any[] = [styles.optionBtn];
                    let textStyle: any = { color: colors.textPrimary };
                    let iconNode = null;

                    if (hasAnswered) {
                        if (isCorrectOption) {
                            btnStyle.push(styles.optionCorrect);
                            textStyle.color = '#15803d'; // Green text
                            iconNode = <View style={styles.checkIconWrapper}><Icon name="check" size={12} color="surface" /></View>;
                        } else if (isWrongSelection) {
                            btnStyle.push(styles.optionWrong);
                            textStyle.color = '#ef4444';
                        } else {
                            btnStyle.push(styles.optionDisabled);
                            textStyle.color = colors.textSecondary;
                        }
                    }

                    return (
                        <TouchableOpacity 
                            key={index} 
                            style={btnStyle}
                            onPress={() => handleOptionSelect(index)}
                            disabled={hasAnswered || isSubmitting}
                            activeOpacity={0.7}
                        >
                            <Text variant="body" weight="medium" style={textStyle}>{opt}</Text>
                            {iconNode}
                        </TouchableOpacity>
                    );
                })}
            </View>
            
            {/* Feedback / Explanation Box */}
            {hasAnswered && (
                <View style={[styles.feedbackBox, isCorrect ? styles.feedbackBoxCorrect : styles.feedbackBoxWrong]}>
                    <View style={styles.feedbackIconWrap}>
                        <Icon name={isCorrect ? "check-circle" : "x-circle"} size={20} color={isCorrect ? "#15803d" : "#ef4444"} />
                    </View>
                    <Text style={styles.feedbackText}>
                        <Text weight="bold" color={isCorrect ? "#15803d" : "#ef4444"}>
                            {isCorrect ? "Doğru cevap! " : "Yanlış cevap. "}
                        </Text>
                        <Text color="textSecondary">{explanation}</Text>
                    </Text>
                    {isCorrect && (
                        <Text variant="label" weight="bold" color="#f59e0b" style={{ marginLeft: spacing.sm }}>
                            +20 XP
                        </Text>
                    )}
                </View>
            )}

            {/* Bottom Interaction Area */}
            <View style={styles.bottomBar}>
                <View style={styles.avatarGroup}>
                    <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=Luna' }} style={[styles.avatar, { zIndex: 4 }]} />
                    <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=Mark' }} style={[styles.avatar, styles.avatarOverlap, { zIndex: 3 }]} />
                    <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=Mia' }} style={[styles.avatar, styles.avatarOverlap, { zIndex: 2 }]} />
                    <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=Alex' }} style={[styles.avatar, styles.avatarOverlap, { zIndex: 1 }]} />
                    <Text variant="caption" color="textSecondary" style={styles.avatarText}>+18 arkadaşın doğru bildi</Text>
                </View>

                <TouchableOpacity style={styles.reportBtn}>
                    <Icon name="flag" size={14} color={colors.textSecondary} />
                    <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>Soruyu Bildir</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        maxWidth: 820,
        width: '100%',
        ...Platform.select({
            web: { transition: 'box-shadow 0.2s ease, transform 0.2s ease' } as any,
        }),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    xpBadge: {
        backgroundColor: '#fef08a', // Yellow
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    titleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -40 }], // Center roughly
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    question: {
        fontSize: 26,
        lineHeight: 32,
        marginBottom: spacing.xl,
        letterSpacing: -0.5,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: spacing.md,
    },
    optionBtn: {
        width: '48%',
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: { transition: 'all 0.2s ease', cursor: 'pointer' } as any,
        }),
    },
    optionCorrect: {
        borderColor: '#15803d',
        backgroundColor: 'rgba(21, 128, 61, 0.05)',
    },
    optionWrong: {
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    optionDisabled: {
        opacity: 0.6,
        backgroundColor: '#f9fafb',
    },
    checkIconWrapper: {
        position: 'absolute',
        right: spacing.md,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#15803d',
        alignItems: 'center',
        justifyContent: 'center',
    },
    feedbackBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xl,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
    },
    feedbackBoxCorrect: {
        backgroundColor: 'rgba(21, 128, 61, 0.05)',
        borderColor: 'rgba(21, 128, 61, 0.15)',
    },
    feedbackBoxWrong: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderColor: 'rgba(239, 68, 68, 0.15)',
    },
    feedbackIconWrap: {
        marginRight: spacing.md,
    },
    feedbackText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
    },
    avatarGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.surface,
        backgroundColor: '#e5e7eb',
    },
    avatarOverlap: {
        marginLeft: -8,
    },
    avatarText: {
        marginLeft: spacing.sm,
        fontSize: 13,
    },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        ...Platform.select({ web: { cursor: 'pointer' } as any }),
    }
});
