import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, typography } from '../../theme';
import { CATEGORY_LABELS } from '../../constants/categories';
import { DiscussionCard } from '../feed/DiscussionCard';
import { Post } from '../../types/database.types';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

interface DebateFormProps {
    onChange?: (data: any, isValid: boolean) => void;
}

const DRAFT_KEY = '@mentis_debate_draft_v2';

export const DebateForm: React.FC<DebateFormProps> = ({ onChange }) => {
    const { user } = useAuth();
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);

    const [question, setQuestion] = useState('');
    const [sideA, setSideA] = useState('');
    const [sideB, setSideB] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Felsefe');

    const [isLoaded, setIsLoaded] = useState(false);

    const categories = CATEGORY_LABELS;

    // Load Draft
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const draft = await AsyncStorage.getItem(DRAFT_KEY);
                if (draft) {
                    const parsed = JSON.parse(draft);
                    if (parsed.question) setQuestion(parsed.question);
                    if (parsed.side_a) setSideA(parsed.side_a);
                    if (parsed.side_b) setSideB(parsed.side_b);
                    if (parsed.description) setDescription(parsed.description);
                    if (parsed.category) setCategory(parsed.category);
                }
            } catch (e) {
                console.error('Failed to load draft:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadDraft();
    }, []);

    // Save Draft & Validation
    useEffect(() => {
        if (!isLoaded) return;

        const qLen = question.trim().length;
        const aLen = sideA.trim().length;
        const bLen = sideB.trim().length;

        const qValid = qLen >= 10 && qLen <= 150;
        const aValid = aLen >= 2 && aLen <= 40;
        const bValid = bLen >= 2 && bLen <= 40;
        const isValid = qValid && aValid && bValid && category.length > 0;

        const data = {
            title: question.trim(),
            side_a: sideA.trim(),
            side_b: sideB.trim(),
            content: description.trim(),
            category
        };

        // Notify parent
        if (onChange) {
            onChange(data, isValid);
        }

        // Auto save
        const saveDraft = async () => {
            try {
                await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ question, side_a: sideA, side_b: sideB, description, category }));
            } catch (e) {
                console.error('Failed to save draft:', e);
            }
        };
        const timeoutId = setTimeout(saveDraft, 1000);
        return () => clearTimeout(timeoutId);
    }, [question, sideA, sideB, description, category, isLoaded]);

    const qLen = question.trim().length;
    const qError = qLen > 0 && (qLen < 10 || qLen > 150) ? 'Soru 10 ile 150 karakter arasında olmalıdır.' : '';

    const aLen = sideA.trim().length;
    const aError = aLen > 0 && (aLen < 2 || aLen > 40) ? 'A Tarafı 2 ile 40 karakter arasında olmalıdır.' : '';

    const bLen = sideB.trim().length;
    const bError = bLen > 0 && (bLen < 2 || bLen > 40) ? 'B Tarafı 2 ile 40 karakter arasında olmalıdır.' : '';

    const mockPost: Post = {
        id: 'preview-id',
        type: 'discussion',
        title: question || 'Soru başlığı...',
        content: description || 'Tartışmanın detayı...',
        category: category,
        author_id: user?.id || 'temp',
        created_at: new Date().toISOString(),
        is_published: false,
        payload: {
            side_a: sideA || 'Taraf A',
            side_b: sideB || 'Taraf B',
            votes_A: 0,
            votes_B: 0
        },
        comment_count: 0,
        user: {
            id: user?.id || 'temp',
            username: user?.user_metadata?.username || 'Kullanıcı',
            full_name: user?.user_metadata?.full_name || '',
            avatar_url: user?.user_metadata?.avatar_url
        }
    };

    const renderFormInputs = () => (
        <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tartışma Konusu (Soru)</Text>
                <TextInput
                    style={[styles.input, styles.questionInput, qError ? styles.inputError : null]}
                    placeholder="Örn: Yapay zeka insanlığın sonu mu, kurtuluşu mu?"
                    placeholderTextColor={colors.textTertiary}
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                />
                <View style={styles.validationRow}>
                    <Text style={styles.errorText}>{qError}</Text>
                    <Text style={[styles.charCount, (qLen < 10 || qLen > 150) && qLen > 0 ? {color: colors.error} : null]}>
                        {qLen}/150
                    </Text>
                </View>
            </View>

            <View style={styles.vsContainer}>
                <View style={styles.optionWrapper}>
                    <Text style={[styles.inputLabel, { color: '#ef4444' }]}>A Tarafı</Text>
                    <TextInput
                        style={[styles.input, styles.optionAInput, aError ? styles.inputError : null]}
                        placeholder="Örn: Sonu"
                        placeholderTextColor="rgba(239, 68, 68, 0.4)"
                        value={sideA}
                        onChangeText={setSideA}
                    />
                    <View style={styles.validationRow}>
                        <Text style={styles.errorText}>{aError}</Text>
                        <Text style={[styles.charCount, (aLen < 2 || aLen > 40) && aLen > 0 ? {color: colors.error} : null]}>
                            {aLen}/40
                        </Text>
                    </View>
                </View>

                <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.optionWrapper}>
                    <Text style={[styles.inputLabel, { color: '#3b82f6', textAlign: 'right' }]}>B Tarafı</Text>
                    <TextInput
                        style={[styles.input, styles.optionBInput, bError ? styles.inputError : null]}
                        placeholder="Örn: Kurtuluşu"
                        placeholderTextColor="rgba(59, 130, 246, 0.4)"
                        value={sideB}
                        onChangeText={setSideB}
                        textAlign="right"
                    />
                    <View style={styles.validationRow}>
                        <Text style={[styles.charCount, (bLen < 2 || bLen > 40) && bLen > 0 ? {color: colors.error} : null]}>
                            {bLen}/40
                        </Text>
                        <Text style={styles.errorText}>{bError}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Detaylı Açıklama (Opsiyonel)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tarafların argümanlarını veya tartışmanın bağlamını açıkla..."
                    placeholderTextColor={colors.textTertiary}
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

    const renderPreview = () => (
        <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Canlı Önizleme</Text>
            <View style={styles.previewCardWrapper}>
                <DiscussionCard post={mockPost} onVote={() => {}} />
            </View>
        </View>
    );

    if (isWebDesktop) {
        return (
            <View style={styles.desktopLayout}>
                <View style={styles.desktopLeft}>
                    {renderFormInputs()}
                </View>
                <View style={styles.desktopRight}>
                    {renderPreview()}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderFormInputs()}
            <View style={styles.mobilePreviewDivider} />
            {renderPreview()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: spacing.md,
        paddingBottom: spacing.xxl,
    },
    desktopLayout: {
        flexDirection: 'row',
        gap: spacing.xl,
        paddingTop: spacing.md,
    },
    desktopLeft: {
        flex: 1.2,
    },
    desktopRight: {
        flex: 1,
        position: 'sticky',
        top: spacing.lg,
    } as any,
    formContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        fontSize: typography.sizes.sm,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: typography.sizes.md,
        color: colors.textPrimary,
    },
    inputError: {
        borderColor: colors.error,
    },
    questionInput: {
        fontSize: typography.sizes.lg,
        fontWeight: 'bold',
        minHeight: 80,
    },
    validationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    errorText: {
        fontSize: 12,
        color: colors.error,
        flex: 1,
    },
    charCount: {
        fontSize: 12,
        color: colors.textTertiary,
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        position: 'relative',
    },
    optionWrapper: {
        flex: 1,
    },
    optionAInput: {
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.03)',
        color: '#ef4444',
        fontWeight: '700',
    },
    optionBInput: {
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.03)',
        color: '#3b82f6',
        fontWeight: '700',
    },
    vsBadge: {
        position: 'absolute',
        left: '50%',
        top: 25,
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
        borderWidth: 1.5,
        borderColor: colors.borderHighlight,
        marginRight: spacing.sm,
    },
    categoryChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        color: colors.textSecondary,
        fontWeight: '700',
    },
    categoryTextActive: {
        color: colors.surface,
    },
    mobilePreviewDivider: {
        height: 1,
        backgroundColor: colors.borderHighlight,
        marginVertical: spacing.xl,
    },
    previewContainer: {
        backgroundColor: 'rgba(124, 58, 237, 0.03)',
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
    },
    previewTitle: {
        fontSize: typography.sizes.sm,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    previewCardWrapper: {
        pointerEvents: 'none', // Disable interactions in preview
    }
});
