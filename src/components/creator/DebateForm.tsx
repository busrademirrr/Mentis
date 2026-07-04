import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

export const DebateForm = () => {
    const [question, setQuestion] = useState('');
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Felsefe');

    const categories = ['Felsefe', 'Tarih', 'Bilim', 'Teknoloji', 'Sanat'];

    return (
        <View style={styles.container}>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tartışma Konusu (Soru)</Text>
                <TextInput
                    style={[styles.input, styles.questionInput]}
                    placeholder="Örn: Yapay zeka insanlığın sonu mu, kurtuluşu mu?"
                    placeholderTextColor={colors.textSecondary}
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                />
            </View>

            {/* VS Section */}
            <View style={styles.vsContainer}>
                <View style={styles.optionWrapper}>
                    <Text style={[styles.inputLabel, { color: '#ef4444' }]}>A Tarafı</Text>
                    <TextInput
                        style={[styles.input, styles.optionAInput]}
                        placeholder="Örn: Sonu"
                        placeholderTextColor="rgba(239, 68, 68, 0.5)"
                        value={optionA}
                        onChangeText={setOptionA}
                    />
                </View>

                <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.optionWrapper}>
                    <Text style={[styles.inputLabel, { color: '#3b82f6', textAlign: 'right' }]}>B Tarafı</Text>
                    <TextInput
                        style={[styles.input, styles.optionBInput]}
                        placeholder="Örn: Kurtuluşu"
                        placeholderTextColor="rgba(59, 130, 246, 0.5)"
                        value={optionB}
                        onChangeText={setOptionB}
                        textAlign="right"
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Detaylı Açıklama</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tarafların argümanlarını veya tartışmanın bağlamını açıkla..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
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
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        position: 'relative',
    },
    optionWrapper: {
        flex: 1,
    },
    optionAInput: {
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        color: '#ef4444',
        fontWeight: '600',
    },
    optionBInput: {
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        color: '#3b82f6',
        fontWeight: '600',
    },
    vsBadge: {
        position: 'absolute',
        left: '50%',
        marginLeft: -20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        borderWidth: 2,
        borderColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    vsText: {
        fontWeight: '900',
        fontStyle: 'italic',
        color: colors.textSecondary,
    },
    textArea: {
        height: 120,
    },
    categoryScroll: {
        flexDirection: 'row',
    },
    categoryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    categoryChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: 'white',
    },
});
