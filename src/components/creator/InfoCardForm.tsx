import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '../../theme';
import { Icon, Text } from '../ui';
import { useResponsive } from '../../hooks/useResponsive';
import { Platform } from 'react-native';

export const InfoCardForm = () => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [content, setContent] = useState('');
    const [fact, setFact] = useState('');
    const [category, setCategory] = useState('Felsefe');
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);

    const categories = ['Felsefe', 'Tarih', 'Bilim', 'Sanat'];

    const renderFormFields = () => (
        <>
            <View style={styles.inputGroup}>
                <Text variant="label" weight="bold" color="textPrimary" style={styles.inputLabel}>Başlık</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="Örn: Van Gogh kulağını neden kesti?"
                    placeholderTextColor={colors.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={80}
                />
                <Text variant="caption" color="textTertiary" style={styles.charCount}>{title.length}/80</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text variant="label" weight="bold" color="textPrimary" style={styles.inputLabel}>Kısa Açıklama</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="Özetleyici ve dikkat çekici bir cümle..."
                    placeholderTextColor={colors.textSecondary}
                    value={desc}
                    onChangeText={setDesc}
                    maxLength={140}
                />
                <Text variant="caption" color="textTertiary" style={styles.charCount}>{desc.length}/140</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text variant="label" weight="bold" color="textPrimary" style={styles.inputLabel}>Ana İçerik</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]}
                    placeholder="Detayları buraya yaz..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    value={content}
                    onChangeText={setContent}
                    maxLength={5000}
                />
                <Text variant="caption" color="textTertiary" style={styles.charCount}>{content.length}/5000</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text variant="label" weight="bold" color="textPrimary" style={styles.inputLabel}>Biliyor muydunuz? (Opsiyonel)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="İlginç bir gerçek ekle..."
                    placeholderTextColor={colors.textSecondary}
                    value={fact}
                    onChangeText={setFact}
                    maxLength={200}
                />
                <Text variant="caption" color="textTertiary" style={styles.charCount}>{fact.length}/200</Text>
            </View>
        </>
    );

    const renderRightColumn = () => (
        <>
            {/* Image Upload Box */}
            <View style={styles.inputGroup}>
                <Text variant="label" weight="bold" color="textPrimary" style={styles.inputLabel}>Görsel</Text>
                <TouchableOpacity style={styles.imageUploadBtn} activeOpacity={0.7}>
                    <Icon name="image" size={32} color={colors.primary} style={{ marginBottom: spacing.sm }} />
                    <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>Görsel yükleyin veya sürükleyip bırakın</Text>
                    <Text variant="caption" color="textTertiary" style={{ textAlign: 'center', marginTop: 4 }}>PNG, JPG, WEBP (max. 5MB)</Text>
                    <View style={styles.imageUploadActionBtn}>
                        <Text variant="caption" weight="bold" color="surface">Görsel Seç</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.inputGroup}>
                <Text variant="label" weight="bold" color="textPrimary" style={styles.inputLabel}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map(cat => (
                        <TouchableOpacity 
                            key={cat} 
                            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text variant="body" style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Tags (Mock Input) */}
            <View style={styles.inputGroup}>
                <Text variant="label" weight="bold" color="textPrimary" style={styles.inputLabel}>Etiketler (Opsiyonel)</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="Etiket ekle ve Enter'a bas..."
                    placeholderTextColor={colors.textSecondary}
                />
                <Text variant="caption" color="textTertiary" style={{ marginTop: spacing.xs }}>Max 5 etiket ekleyebilirsiniz.</Text>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            {isWebDesktop ? (
                <View style={styles.desktopGrid}>
                    <View style={styles.desktopLeft}>
                        {renderFormFields()}
                    </View>
                    <View style={styles.desktopRight}>
                        {renderRightColumn()}
                    </View>
                </View>
            ) : (
                <>
                    {renderFormFields()}
                    {renderRightColumn()}
                </>
            )}
        </View>
    );
};

// Needed import for ScrollView
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
    container: {
        paddingTop: spacing.md,
    },
    sectionLabel: {
        fontSize: typography.sizes.sm,
        fontWeight: 'bold',
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    previewContainer: {
        marginBottom: spacing.lg,
    },
    previewCard: {
        height: 200,
        width: '100%',
        justifyContent: 'flex-end',
        borderRadius: radius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    previewGradient: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: spacing.md,
        borderRadius: radius.lg,
    },
    previewBadge: {
        backgroundColor: '#10b981',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
        marginBottom: spacing.sm,
    },
    previewBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    previewTitle: {
        color: 'white',
        fontSize: typography.sizes.lg,
        fontWeight: 'bold',
        marginBottom: spacing.xs,
    },
    previewDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: typography.sizes.sm,
    },
    imageUploadBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.primaryLight || 'rgba(124, 58, 237, 0.05)',
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        borderRadius: radius.lg,
    },
    imageUploadActionBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        marginTop: spacing.md,
    },
    categoryScroll: {
        flexDirection: 'row',
    },
    categoryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        marginRight: spacing.sm,
    },
    categoryChipActive: {
        backgroundColor: colors.surface,
        borderColor: colors.primary,
    },
    categoryText: {
        color: colors.textSecondary,
    },
    categoryTextActive: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: spacing.xl,
        position: 'relative',
    },
    inputLabel: {
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        fontSize: typography.sizes.md,
        color: colors.textPrimary,
    },
    textArea: {
        height: 160,
    },
    charCount: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    desktopGrid: {
        flexDirection: 'row',
        gap: spacing.xl,
    },
    desktopLeft: {
        flex: 3,
    },
    desktopRight: {
        flex: 2,
    }
});
