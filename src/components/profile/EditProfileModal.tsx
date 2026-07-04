import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { Text, Icon } from '../ui';
import Toast from 'react-native-toast-message';

export interface EditProfileData {
    bio: string;
    location: string;
}

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: EditProfileData) => Promise<void>;
    initialData: Partial<EditProfileData>;
    saving: boolean;
}

const TURKISH_CITIES = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 
    'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 
    'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 
    'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 
    'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir', 
    'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat', 
    'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 
    'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
    'Yurtdışı', 'Belirtmek İstemiyorum'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, onSave, initialData, saving }) => {
    const [formData, setFormData] = useState<EditProfileData>({
        bio: initialData.bio || '',
        location: initialData.location || '',
    });

    const [locationSearch, setLocationSearch] = useState(initialData.location || '');
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const [errors, setErrors] = useState<Partial<EditProfileData>>({});

    const filteredCities = useMemo(() => {
        if (!locationSearch) return TURKISH_CITIES;
        const lowerSearch = locationSearch.toLowerCase('tr-TR');
        return TURKISH_CITIES.filter(c => c.toLowerCase('tr-TR').includes(lowerSearch));
    }, [locationSearch]);

    const handleChange = (field: keyof EditProfileData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSelectLocation = (city: string) => {
        const finalCity = city === 'Belirtmek İstemiyorum' ? '' : city;
        handleChange('location', finalCity);
        setLocationSearch(city);
        setShowLocationSuggestions(false);
    };

    const validate = () => {
        const newErrors: Partial<EditProfileData> = {};
        if (formData.bio && formData.bio.length > 250) {
            newErrors.bio = 'Biyografi en fazla 250 karakter olabilir.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen formu kontrol edin.' });
            return;
        }
        await onSave(formData);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView 
                    style={[styles.modalContent, Platform.OS === 'web' && styles.modalContentWeb]} 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    enabled={Platform.OS !== 'web'}
                >
                    <View style={styles.header}>
                        <Text variant="h3" weight="bold">Profili Düzenle</Text>
                        <TouchableOpacity onPress={onClose} disabled={saving} style={styles.closeBtn}>
                            <Icon name="X" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {/* Biyografi */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text variant="label" color="textSecondary" style={styles.inputLabel}>Biyografi</Text>
                                <Text variant="caption" color={formData.bio.length > 250 ? "error" : "textSecondary"}>
                                    {formData.bio.length}/250
                                </Text>
                            </View>
                            <TextInput 
                                style={[styles.input, styles.textArea, errors.bio && styles.inputError]}
                                value={formData.bio}
                                onChangeText={(text) => handleChange('bio', text)}
                                placeholder="Kendinizden bahsedin..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                editable={!saving}
                            />
                            {errors.bio && <Text variant="caption" color="error" style={styles.errorText}>{errors.bio}</Text>}
                        </View>

                        {/* Konum (Autocomplete) */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text variant="label" color="textSecondary" style={styles.inputLabel}>Konum (Şehir)</Text>
                            </View>
                            <View>
                                <TextInput 
                                    style={styles.input}
                                    value={locationSearch}
                                    onChangeText={(text) => {
                                        setLocationSearch(text);
                                        handleChange('location', text);
                                        setShowLocationSuggestions(true);
                                    }}
                                    onFocus={() => setShowLocationSuggestions(true)}
                                    placeholder="Şehir arayın..."
                                    placeholderTextColor={colors.textSecondary}
                                    editable={!saving}
                                />
                                
                                {showLocationSuggestions && (
                                    <View style={styles.suggestionsContainer}>
                                        <ScrollView style={styles.suggestionsScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                                            {filteredCities.map((city, index) => (
                                                <TouchableOpacity 
                                                    key={city} 
                                                    style={[styles.suggestionItem, index < filteredCities.length - 1 && styles.suggestionBorder]}
                                                    onPress={() => handleSelectLocation(city)}
                                                >
                                                    <Text variant="body" color={city === 'Belirtmek İstemiyorum' ? 'error' : 'textPrimary'}>{city}</Text>
                                                </TouchableOpacity>
                                            ))}
                                            {filteredCities.length === 0 && (
                                                <View style={styles.suggestionItem}>
                                                    <Text variant="body" color="textSecondary">Sonuç bulunamadı</Text>
                                                </View>
                                            )}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
                            onPress={handleSave} 
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <ActivityIndicator color={colors.surface} size="small" />
                                    <Text variant="label" weight="bold" color="surface" style={{ marginLeft: spacing.sm }}>Kaydediliyor...</Text>
                                </>
                            ) : (
                                <Text variant="label" weight="bold" color="surface">Değişiklikleri Kaydet</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.background,
        width: '100%',
        height: Platform.OS === 'web' ? 'auto' : '90%',
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        overflow: 'hidden',
    },
    modalContentWeb: {
        maxWidth: 500,
        height: 'auto',
        maxHeight: '85%',
        borderRadius: radius.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    closeBtn: {
        padding: spacing.xs,
    },
    scrollContent: {
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacing.xs,
    },
    inputLabel: {
        marginLeft: spacing.xs,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: Platform.OS === 'web' ? spacing.md : spacing.sm,
        color: colors.textPrimary,
        minHeight: 48,
        fontSize: 16,
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        marginTop: 4,
        marginLeft: 4,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: spacing.md,
    },
    suggestionsContainer: {
        marginTop: 4,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        ...shadows.md,
    },
    suggestionsScroll: {
        maxHeight: 200,
    },
    suggestionItem: {
        padding: spacing.md,
    },
    suggestionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    footer: {
        padding: spacing.xl,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        backgroundColor: colors.background,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.glow,
    },
    saveBtnDisabled: {
        opacity: 0.7,
    }
});
