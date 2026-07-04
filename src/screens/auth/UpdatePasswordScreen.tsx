import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon, MentisLogo } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const UpdatePasswordScreen = ({ navigation }: any) => {
    const { clearPasswordRecovery } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleUpdatePassword = async () => {
        if (!password || password.length < 6) {
            Toast.show({ type: 'error', text1: 'Geçersiz Şifre', text2: 'Şifreniz en az 6 karakter olmalıdır.' });
            return;
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            Toast.show({ type: 'error', text1: 'Zayıf Şifre', text2: 'Şifreniz en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.' });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Şifreler Eşleşmiyor', text2: 'Lütfen iki şifreyi de aynı girin.' });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        setLoading(false);

        if (error) {
            Toast.show({ type: 'error', text1: 'İşlem Başarısız', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Şifre Güncellendi', text2: 'Yeni şifreniz başarıyla kaydedildi. Uygulamaya yönlendiriliyorsunuz.' });
            clearPasswordRecovery();
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.contentWrapper}>
                
                {/* Auth Card */}
                <View style={styles.authCard}>
                    <TouchableOpacity onPress={clearPasswordRecovery} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.formContainer}>
                        <View style={styles.header}>
                            <MentisLogo size={48} variant="primary" />
                            <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.lg }}>
                                Yeni Şifre Belirle
                            </Text>
                            <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                                Lütfen hesabınız için yeni bir şifre girin.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text variant="label" color="textSecondary" style={styles.label}>Yeni Şifre</Text>
                            <View style={styles.passwordInputWrapper}>
                                <TextInput
                                    style={[styles.input, { flex: 1, borderWidth: 0, padding: 0 }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textTertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                    <Icon name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text variant="label" color="textSecondary" style={styles.label}>Yeni Şifre (Tekrar)</Text>
                            <View style={styles.passwordInputWrapper}>
                                <TextInput
                                    style={[styles.input, { flex: 1, borderWidth: 0, padding: 0 }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textTertiary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                                    <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} 
                            onPress={handleUpdatePassword}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text variant="body" weight="bold" color="surface">Şifremi Güncelle</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.secondaryBtn, { marginTop: spacing.md }]} 
                            onPress={clearPasswordRecovery}
                            disabled={loading}
                        >
                            <Text variant="body" weight="bold" color="textPrimary">İptal Et ve Uygulamaya Dön</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    authCard: {
        width: '100%',
        maxWidth: 460,
        alignSelf: 'center',
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.04,
        shadowRadius: 32,
        elevation: 8,
    },
    backBtn: {
        position: 'absolute',
        top: spacing.xl,
        left: spacing.xl,
        zIndex: 10,
        padding: spacing.xs,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    formContainer: {
        padding: spacing.xxl,
        paddingTop: 80, // space for back btn
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    inputGroup: {
        marginBottom: spacing.xl,
    },
    label: {
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: 15,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
    },
    eyeBtn: {
        padding: spacing.sm,
        marginLeft: spacing.sm,
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'background-color 0.2s ease' } as any),
    },
    primaryBtnDisabled: {
        backgroundColor: colors.textTertiary,
        ...(Platform.OS === 'web' && { cursor: 'not-allowed' } as any),
    },
    secondaryBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'background-color 0.2s ease' } as any),
    }
});
