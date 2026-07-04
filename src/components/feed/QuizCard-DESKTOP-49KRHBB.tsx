import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Image, LayoutAnimation, UIManager, Pressable } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { Avatar } from '../ui/Avatar';
import { Post } from '../../types/database.types';
import { submitQuizAnswer } from '../../services/feedService';
import { useResponsive } from '../../hooks/useResponsive';
import { supabase } from '../../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { PostOptionsMenu } from './PostOptionsMenu';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface QuizCardProps {
    post: Post;
    onAnswer: (answerData: any) => void;
    onDelete?: () => void;
}

const MobileQuizCard = ({ post, onAnswer, onDelete }: QuizCardProps) => {
    const { payload } = post;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation<any>();
    const styles = useMobileStyles();
    
    const [selectedOption, setSelectedOption] = useState<number | null>(post.user_quiz_answer?.selected_answer ?? null);
    const hasAnswered = !!post.user_quiz_answer || selectedOption !== null;
    const correctOptionIndex = payload?.correct_option ?? 0;
    const options = payload?.options || [];
    const total = 18;

    const handleAuthorPress = () => {
        const authorId = post.author_id || post.author?.id;
        if (authorId) navigation.navigate('Profile', { userId: authorId });
    };

    const handleSelect = async (index: number) => {
        if (hasAnswered || isSubmitting) return;
        setIsSubmitting(true);
        setSelectedOption(index);
        const isCorrect = index === correctOptionIndex;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        try {
            await submitQuizAnswer(post.id, index, isCorrect);
            onAnswer({ selected_answer: index, is_correct: isCorrect });
        } catch (error) {
            setSelectedOption(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!post) {
        return (
            <View style={[styles.card, { alignItems: 'center', padding: spacing.xl }]}>
                <Text color="textSecondary">İçerik yüklenemedi</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.authorRow} onPress={handleAuthorPress}>
                    <Avatar url={post.author?.avatar_value || post.author?.avatar_url} name={post.author?.full_name || post.author?.username || 'K'} size={24} />
                    <Text variant="caption" weight="medium" color="textPrimary" style={{ marginLeft: spacing.sm }}>
                        {post.author?.full_name || post.author?.username || 'Kullanıcı'}
                    </Text>
                    <Text variant="caption" color="textTertiary" style={{ marginHorizontal: 4 }}>•</Text>
                    <Text variant="caption" weight="bold" color="primary">{payload?.difficulty?.toUpperCase() || 'HIZLI QUIZ'}</Text>
                </TouchableOpacity>
                <PostOptionsMenu post={post} onDelete={onDelete} />
            </View>

            <View style={styles.content}>
                <Text variant="h2" weight="bold" color="textPrimary" style={styles.title} numberOfLines={2}>
                    {post.title || "İçerik yüklenemedi"}
                </Text>
            </View>

            <View style={styles.optionsList}>
                {options.map((opt: string, index: number) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = correctOptionIndex === index;
                    const isWrong = isSelected && !isCorrect;

                    return (
                        <Pressable 
                            key={index}
                            onPress={() => handleSelect(index)}
                            style={[
                                styles.optionBtn,
                                isSelected && styles.optionSelected,
                                hasAnswered && isCorrect && styles.optionCorrect,
                                hasAnswered && isWrong && styles.optionWrong,
                            ]}
                        >
                            <Text variant="body" weight="medium" color={hasAnswered ? (isCorrect || isWrong ? "surface" : "textSecondary") : "textPrimary"}>
                                {opt}
                            </Text>
                            {hasAnswered && isCorrect && <Icon name="check-circle" size={20} color={colors.surface} />}
                            {hasAnswered && isWrong && <Icon name="x-circle" size={20} color={colors.surface} />}
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.footer}>
                <View style={styles.statsRow}>
                    <View style={styles.actionBtn}>
                        <Icon name="users" size={16} color={colors.textSecondary} />
                        <Text variant="caption" color="textSecondary" style={styles.actionText}>
                            {total} Çözüm
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const DesktopQuizCard = ({ post, onAnswer, onDelete }: QuizCardProps) => {
    const { payload } = post;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredOption, setHoveredOption] = useState<number | null>(null);
    const navigation = useNavigation<any>();
    const styles = useDesktopStyles();
    
    const [selectedOption, setSelectedOption] = useState<number | null>(post.user_quiz_answer?.selected_answer ?? null);
    const hasAnswered = !!post.user_quiz_answer || selectedOption !== null;
    const correctOptionIndex = payload?.correct_option ?? 0;
    const options = payload?.options || [];
    const total = 18;

    const handleAuthorPress = () => {
        const authorId = post.author_id || post.author?.id;
        if (authorId) navigation.navigate('Profile', { userId: authorId });
    };

    const handleSelect = async (index: number) => {
        if (hasAnswered || isSubmitting) return;
        setIsSubmitting(true);
        setSelectedOption(index);
        const isCorrect = index === correctOptionIndex;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        try {
            await submitQuizAnswer(post.id, index, isCorrect);
            onAnswer({ selected_answer: index, is_correct: isCorrect });
        } catch (error) {
            setSelectedOption(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!post) {
        return (
            <View style={[styles.card, { alignItems: 'center', padding: spacing.xxl }]}>
                <Text color="textSecondary">İçerik yüklenemedi</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.userInfo} onPress={handleAuthorPress}>
                    <Avatar url={post.author?.avatar_value || post.author?.avatar_url} name={post.author?.full_name || post.author?.username || 'K'} size={24} />
                    <View style={{ marginLeft: spacing.sm }}>
                        <Text variant="caption" weight="bold" color="textPrimary">
                            {post.author?.full_name || post.author?.username || 'Kullanıcı'}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text variant="caption" color="textTertiary">{post.category || 'Quiz'}</Text>
                            <Text variant="caption" color="textTertiary" style={{ marginHorizontal: 4 }}>•</Text>
                            <Text variant="caption" color="textTertiary">Bugün</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <View style={styles.moreBtn}>
                    <PostOptionsMenu post={post} onDelete={onDelete} />
                </View>
            </View>

            <View style={styles.content}>
                <Text variant="h2" weight="bold" color="textPrimary" style={styles.title}>
                    {post.title || "İçerik yüklenemedi"}
                </Text>
            </View>

            <View style={styles.optionsList}>
                {options.map((opt: string, index: number) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = correctOptionIndex === index;
                    const isWrong = isSelected && !isCorrect;

                    let btnStyle: any[] = [styles.optionBtn];
                    let textStyle: any = { color: colors.textPrimary };
                    let iconNode = null;

                    if (hasAnswered) {
                        if (isCorrect) {
                            btnStyle.push(styles.optionCorrect);
                            textStyle.color = '#15803d';
                            iconNode = <View style={styles.checkIconWrapper}><Icon name="check" size={12} color="surface" /></View>;
                        } else if (isWrong) {
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
            
            {hasAnswered && (
                <View style={[styles.feedbackBox, isCorrect ? styles.feedbackBoxCorrect : styles.feedbackBoxWrong]}>
                    <View style={styles.feedbackIconWrap}>
                        <Icon name={isCorrect ? "check-circle" : "x-circle"} size={20} color={isCorrect ? "#15803d" : "#ef4444"} />
                    </View>
                    <Text style={styles.feedbackText}>
                        <Text weight="bold" color={isCorrect ? "#15803d" : "#ef4444"}>
                            {isCorrect ? "Doğru cevap! " : "Yanlış cevap. "}
                        </Text>
                    </Text>
                </View>
            )}

            <View style={styles.actions}>
                <View style={styles.actionBtn}>
                    <Icon name="users" size={16} color={colors.textSecondary} />
                    <Text variant="caption" color="textSecondary" style={styles.actionText}>
                        {total} Çözüm
                    </Text>
                </View>
            </View>

        </View>
    );
};

export const QuizCard = (props: QuizCardProps) => {
    const { isDesktop } = useResponsive();
    if (!props.post) return null;
    return isDesktop ? <DesktopQuizCard {...props} /> : <MobileQuizCard {...props} />;
};

function useMobileStyles() { return StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        maxHeight: 260,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    question: {
        fontSize: 18,
        lineHeight: 22,
        marginBottom: spacing.sm,
        letterSpacing: -0.2,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: spacing.sm,
    },
    optionBtn: {
        width: '48%',
        backgroundColor: colors.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: colors.surfaceHover,
    },
    feedbackBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        padding: spacing.sm,
        borderRadius: radius.sm,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    }
}); }

function useDesktopStyles() { return StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        ...(Platform.OS === 'web' && { transition: 'box-shadow 0.2s ease, transform 0.2s ease' } as any),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    xpBadge: {
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    titleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -40 }],
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
        ...(Platform.OS === 'web' && { transition: 'all 0.2s ease', cursor: 'pointer' } as any),
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
        backgroundColor: colors.surfaceHover,
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
        borderWidth: 2,
        borderColor: colors.surface,
        backgroundColor: colors.borderHighlight,
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
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    }
}); }
