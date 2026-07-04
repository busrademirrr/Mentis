import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { Icon } from '../ui';

import { CATEGORY_LABELS } from '../../constants/categories';

interface QuizFormProps {
    onChange?: (data: any) => void;
}

export const QuizForm: React.FC<QuizFormProps> = ({ onChange }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState<number | null>(null);
    const [difficulty, setDifficulty] = useState('Orta');
    const [category, setCategory] = useState('Tarih');

    React.useEffect(() => {
        if (onChange) {
            onChange({ question, options, correct_index: correctIndex, difficulty, category });
        }
    }, [question, options, correctIndex, difficulty, category, onChange]);

    const updateOption = (text: string, index: number) => {
        const newOptions = [...options];
        newOptions[index] = text;
        setOptions(newOptions);
    };

    const difficulties = ['Kolay', 'Orta', 'Zor', 'Uzman'];
    const categories = CATEGORY_LABELS;

    return (
        <View style={styles.container}>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quiz Sorusu</Text>
                <TextInput 
                    style={[styles.input, styles.questionInput]}
                    placeholder="Örn: Roma İmparatorluğu ikiye ne zaman ayrıldı?"
                    placeholderTextColor={colors.textSecondary}
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Seçenekler (Doğru olanı işaretle)</Text>
                {options.map((opt, index) => {
                    const isCorrect = correctIndex === index;
                    return (
                        <View key={index} style={[styles.optionRow, isCorrect && styles.optionRowCorrect]}>
                            <TouchableOpacity 
                                style={[styles.radio, isCorrect && styles.radioActive]}
                                onPress={() => setCorrectIndex(index)}
                                activeOpacity={0.8}
                            >
                                {isCorrect && <Icon name="check" size={14} color={colors.surface} />}
                            </TouchableOpacity>
                            <TextInput 
                                style={styles.optionInput}
                                placeholder={`${index + 1}. Seçenek`}
                                placeholderTextColor={colors.textSecondary}
                                value={opt}
                                onChangeText={(t) => updateOption(t, index)}
                            />
                        </View>
                    );
                })}
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                    <Text style={styles.inputLabel}>Zorluk</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {difficulties.map(diff => (
                            <TouchableOpacity 
                                key={diff} 
                                style={[styles.chip, difficulty === diff && styles.chipActive]}
                                onPress={() => setDifficulty(diff)}
                            >
                                <Text style={[styles.chipText, difficulty === diff && styles.chipTextActive]}>{diff}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map(cat => (
                        <TouchableOpacity 
                            key={cat} 
                            style={[styles.chip, category === cat && styles.chipActive]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    row: {
        flexDirection: 'row',
    },
    inputLabel: {
        fontSize: typography.sizes.sm,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: typography.sizes.md,
        color: colors.textPrimary,
    },
    questionInput: {
        fontSize: typography.sizes.lg,
        fontWeight: 'bold',
        minHeight: 80,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    optionRowCorrect: {
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    radioActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    optionInput: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: typography.sizes.md,
        color: colors.textPrimary,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    chipActive: {
        backgroundColor: '#f59e0b', // amber for quiz
        borderColor: '#f59e0b',
    },
    chipText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    chipTextActive: {
        color: colors.surface,
    },
});
