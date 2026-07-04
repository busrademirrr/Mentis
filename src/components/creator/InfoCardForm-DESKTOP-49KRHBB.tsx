import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ImageBackground, Image, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '../../theme';
import { Icon, Text } from '../ui';
import { useResponsive } from '../../hooks/useResponsive';
import { Platform } from 'react-native';

import { CATEGORY_LABELS } from '../../constants/categories';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

interface InfoCardFormProps {
    onChange?: (data: any) => void;
}

export const InfoCardForm: React.FC<InfoCardFormProps> = ({ onChange }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [content, setContent] = useState('');
    const [fact, setFact] = useState('');
    const [category, setCategory] = useState('Felsefe');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    // AI Feature States
    const [isAIGenerating, setIsAIGenerating] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [showAIInput, setShowAIInput] = useState(false);
    
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);

    // Notify parent whenever data changes
    React.useEffect(() => {
        if (onChange) {
            let finalTags = [...tags];
            const trimmedInput = tagInput.replace(/[, ]/g, '').replace(/^#+/, '').trim().toLowerCase();
            if (trimmedInput && finalTags.length < 5 && !finalTags.includes(trimmedInput)) {
                finalTags.push(trimmedInput);
            }
            onChange({ title, short_description: desc, content, info_box_text: fact, category, tags: finalTags, image_url: imageUrl });
        }
    }, [title, desc, content, fact, category, tags, tagInput, imageUrl, onChange]);

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                const asset = result.assets[0];
                console.log("STEP 1: Selected file", asset.uri);
                setIsUploading(true);
                
                // Properly extract mimeType. Web provides data URI, native provides file URI.
                let mimeType = asset.mimeType;
                if (!mimeType && asset.uri.startsWith('data:')) {
                    mimeType = asset.uri.split(';')[0].split(':')[1];
                }
                if (!mimeType) {
                    mimeType = 'image/jpeg';
                }
                
                const fileExt = mimeType.split('/')[1] || 'jpg';
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `public/${fileName}`;
                const bucketName = 'post-images';
                
                console.log("STEP 1 Bucket Check");
                const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
                if (bucketError) {
                    console.warn(`Bucket check failed or forbidden (often happens with anon key), assuming bucket exists: ${bucketError.message}`);
                } else {
                    console.log(`Bucket exists: ${bucketData.name}, Public: ${bucketData.public}`);
                }

                console.log("STEP 2 Upload");
                const { data, error } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, decode(asset.base64), {
                        contentType: mimeType,
                        upsert: true
                    });

                if (error) {
                    console.error("Upload failed:", error);
                    throw error;
                }
                console.log("Upload success:", data);

                console.log("STEP 3 Public URL");
                const { data: { publicUrl } } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);

                if (!publicUrl) throw new Error("Public URL generate edilemedi.");
                
                // Reachability check
                try {
                    const reachability = await fetch(publicUrl, { method: 'HEAD' });
                    if (!reachability.ok) {
                        console.warn(`Public URL reachable check returned status: ${reachability.status}`);
                    } else {
                        console.log("Public URL is reachable and generated successfully:", publicUrl);
                    }
                } catch (e) {
                    console.warn("Public URL reachability fetch failed, but URL is:", publicUrl);
                }

                setImageUrl(publicUrl);
            }
        } catch (error: any) {
            console.error('STEP X: Image upload error:', error);
            alert(`Görsel yüklenemedi: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAIGenerate = async () => {
        if (!aiTopic.trim()) {
            alert('Lütfen bir konu girin.');
            return;
        }

        setIsAIGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-content', {
                body: { topic: aiTopic }
            });

            if (error) throw error;
            
            if (data && data.error) {
                throw new Error(data.error);
            }
            
            if (data) {
                if (data.title) setTitle(data.title);
                if (data.short_description) setDesc(data.short_description);
                if (data.content) setContent(data.content);
                if (data.did_you_know) setFact(data.did_you_know);
                if (data.category && CATEGORY_LABELS.includes(data.category)) setCategory(data.category);
                if (data.tags && Array.isArray(data.tags)) setTags(data.tags.slice(0, 5));
                
                setShowAIInput(false);
            }
        } catch (error: any) {
            console.error('AI Generation Error:', error);
            alert(`Yapay zeka içeriği oluşturamadı: ${error.message}`);
        } finally {
            setIsAIGenerating(false);
        }
    };

    const categories = CATEGORY_LABELS;

    const renderFormFields = () => (
        <>
            {/* AI Generator Block */}
            <View style={{ marginBottom: spacing.xl, backgroundColor: 'rgba(124, 58, 237, 0.05)', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary + '30' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: showAIInput ? spacing.md : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="sparkles" size={20} color={colors.primary} />
                        <Text variant="label" weight="bold" color="primary" style={{ marginLeft: spacing.sm }}>AI ile Oluştur</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowAIInput(!showAIInput)}>
                        <Text variant="caption" color="textSecondary">{showAIInput ? 'Vazgeç' : 'Aç'}</Text>
                    </TouchableOpacity>
                </View>
                
                {showAIInput && (
                    <View>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.background, marginBottom: spacing.sm }]}
                            placeholder="Ne hakkında yazmak istersin? (Örn: Kara Delikler)"
                            placeholderTextColor={colors.textSecondary}
                            value={aiTopic}
                            onChangeText={setAiTopic}
                            editable={!isAIGenerating}
                        />
                        <TouchableOpacity 
                            style={{ backgroundColor: colors.primary, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                            onPress={handleAIGenerate}
                            disabled={isAIGenerating}
                        >
                            {isAIGenerating ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                    <Text variant="body" weight="bold" color="surface">Oluşturuluyor...</Text>
                                </>
                            ) : (
                                <>
                                    <Icon name="wand-2" size={16} color="#fff" style={{ marginRight: 8 }} />
                                    <Text variant="body" weight="bold" color="surface">İçerik Üret</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

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
                <TouchableOpacity style={styles.imageUploadBtn} activeOpacity={0.7} onPress={handleImagePick} disabled={isUploading}>
                    {isUploading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 120, borderRadius: radius.md, resizeMode: 'cover' }} />
                    ) : (
                        <>
                            <Icon name="image" size={32} color={colors.primary} style={{ marginBottom: spacing.sm }} />
                            <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>Görsel yükleyin veya sürükleyip bırakın</Text>
                            <Text variant="caption" color="textTertiary" style={{ textAlign: 'center', marginTop: 4 }}>PNG, JPG, WEBP (max. 5MB)</Text>
                            <View style={styles.imageUploadActionBtn}>
                                <Text variant="caption" weight="bold" color="surface">Görsel Seç</Text>
                            </View>
                        </>
                    )}
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

            {/* Tags Input */}
            <View style={styles.inputGroup}>
                <Text variant="label" weight="bold" color="textPrimary" style={styles.inputLabel}>Etiketler (Opsiyonel)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: tags.length > 0 ? 8 : 0 }}>
                    {tags.map((tag, idx) => (
                        <TouchableOpacity 
                            key={idx} 
                            style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => setTags(tags.filter((_, i) => i !== idx))}
                        >
                            <Text variant="caption" color="primary">#{tag}</Text>
                            <Icon name="x" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput 
                    style={styles.input}
                    placeholder={tags.length < 5 ? "Etiket ekle (Boşluk, virgül veya Enter ile)" : "Maksimum 5 etiket eklendi"}
                    placeholderTextColor={colors.textSecondary}
                    value={tagInput}
                    onChangeText={(text) => {
                        if (text.endsWith(' ') || text.endsWith(',')) {
                            const trimmed = text.replace(/[, ]/g, '').replace(/^#+/, '').trim().toLowerCase();
                            if (trimmed && tags.length < 5 && !tags.includes(trimmed)) {
                                setTags([...tags, trimmed]);
                            }
                            setTagInput('');
                        } else {
                            setTagInput(text);
                        }
                    }}
                    editable={tags.length < 5}
                    onSubmitEditing={() => {
                        const trimmed = tagInput.trim().replace(/^#+/, '').toLowerCase();
                        if (trimmed && tags.length < 5 && !tags.includes(trimmed)) {
                            setTags([...tags, trimmed]);
                            setTagInput('');
                        }
                    }}
                />
                <Text variant="caption" color="textTertiary" style={{ marginTop: spacing.xs }}>Max 5 etiket ekleyebilirsiniz. Boşluk veya Enter'a basarak ekleyin.</Text>
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
        color: colors.surface,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    previewTitle: {
        color: colors.textPrimary,
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
