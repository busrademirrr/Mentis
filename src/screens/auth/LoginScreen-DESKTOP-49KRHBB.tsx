import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { AntDesign } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon, MentisLogo } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';

// Helper for translating Supabase errors
const translateAuthError = (errorMsg: string) => {
    if (errorMsg.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.';
    if (errorMsg.includes('Email not confirmed')) return 'E-posta adresiniz henüz onaylanmamış.';
    if (errorMsg.includes('User not found')) return 'Bu e-posta adresine ait kullanıcı bulunamadı.';
    if (errorMsg.includes('rate limit')) return 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.';
    return errorMsg;
};

export const LoginScreen = ({ navigation }: any) => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (val: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(val);
    };

    const handleLogin = async () => {
        setEmailError('');
        setPasswordError('');

        let isValid = true;
        if (!email || !validateEmail(email)) {
            setEmailError('Lütfen geçerli bir e-posta adresi girin.');
            isValid = false;
        }
        if (!password || password.length < 6) {
            setPasswordError('Şifre en az 6 karakter olmalıdır.');
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Toast.show({
                type: 'error',
                text1: 'Giriş Başarısız',
                text2: translateAuthError(error.message),
            });
            setLoading(false);
        } else {
            // Note: The AuthContext listener will pick up the session and transition to AppFlow
            Toast.show({
                type: 'success',
                text1: 'Hoş Geldiniz',
                text2: 'Mentis ağına başarıyla bağlandınız.',
            });
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            const redirectUrl = Platform.OS === 'web' 
                ? window.location.origin 
                : Linking.createURL('/');
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        prompt: 'select_account'
                    }
                }
            });
            
            if (error) throw error;
        } catch (error: any) {
            console.error('Google Auth Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Bağlantı Hatası',
                text2: error.message ? translateAuthError(error.message) : 'Google ile giriş yapılırken bir hata oluştu.',
            });
            setGoogleLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
                
                {/* Desktop Left Side - Brand Story */}
                {isDesktop && (
                    <View style={styles.brandingPanel}>
                        <MentisLogo size={80} variant="primary" />
                        <Text variant="h1" color="textPrimary" weight="bold" style={styles.brandTitle}>
                            Mentis
                        </Text>
                        <Text variant="body" color="textSecondary" style={styles.brandSubtitle}>
                            Düşüncelerin bağlantı kurduğu yer. Felsefe, teknoloji ve sanatı bir araya getiren premium entelektüel işletim sistemi.
                        </Text>
                        
                        <View style={styles.featureList}>
                            {[
                                'Fikirlerini evrensel ağa kat',
                                'Modern akademik tartışmalara katıl',
                                'Kendi entelektüel kimliğini inşa et'
                            ].map((f, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <Icon name="check-circle" size={16} color={colors.primary} />
                                    <Text variant="body" color="textSecondary" style={{ marginLeft: spacing.sm }}>{f}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Right Side - Auth Card */}
                <View style={[styles.authCard, isDesktop && styles.authCardDesktop]}>
                    <View style={styles.formContainer}>
                        
                        {/* Mobile Header */}
                        {!isDesktop && (
                            <View style={styles.mobileHeader}>
                                <MentisLogo size={48} variant="primary" />
                                <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.md }}>Mentis</Text>
                                <Text variant="caption" color="textSecondary" style={{ marginTop: spacing.xs }}>Düşüncelerin bağlantı kurduğu yer.</Text>
                            </View>
                        )}
                        
                        {isDesktop && (
                            <Text variant="h2" weight="bold" color="textPrimary" style={{ marginBottom: spacing.xl }}>Giriş Yap</Text>
                        )}

                        <View style={styles.inputGroup}>
                            <Text variant="label" color={emailError ? "error" : "textSecondary"} style={styles.label}>E-posta</Text>
                            <TextInput
                                style={[styles.input, emailError ? { borderColor: colors.error } : {}]}
                                placeholder="ornek@mentis.app"
                                placeholderTextColor={colors.textTertiary}
                                value={email}
                                onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading && !googleLoading}
                            />
                            {!!emailError && <Text variant="caption" color="error" style={{marginTop: 4}}>{emailError}</Text>}
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.passwordHeader}>
                                <Text variant="label" color={passwordError ? "error" : "textSecondary"} style={styles.label}>Şifre</Text>
                                <TouchableOpacity onPress={() => !loading && navigation.navigate('ForgotPassword')}>
                                    <Text variant="label" color="primary" weight="bold" style={styles.label}>Şifremi Unuttum</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.passwordInputWrapper, passwordError ? { borderColor: colors.error } : {}]}>
                                <TextInput
                                    style={[styles.input, { flex: 1, borderWidth: 0, padding: 0 }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textTertiary}
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                                    secureTextEntry={!showPassword}
                                    editable={!loading && !googleLoading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                    <Icon name={showPassword ? "eye-off" : "eye"} size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            {!!passwordError && <Text variant="caption" color="error" style={{marginTop: 4}}>{passwordError}</Text>}
                        </View>

                        <View style={styles.rememberRow}>
                            <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setRememberMe(!rememberMe)}>
                                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                                    {rememberMe && <Icon name="check" size={12} color={colors.surface} />}
                                </View>
                                <Text variant="caption" color="textSecondary" style={{ marginLeft: spacing.sm }}>Beni Hatırla</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} 
                            onPress={handleLogin}
                            disabled={loading || googleLoading}
                        >
                            {loading ? <ActivityIndicator color={colors.surface} /> : <Text variant="body" weight="bold" color="surface">Giriş Yap</Text>}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text variant="caption" color="textTertiary" style={{ paddingHorizontal: spacing.sm }}>VEYA</Text>
                            <View style={styles.divider} />
                        </View>

                        <TouchableOpacity 
                            style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]} 
                            onPress={handleGoogleLogin}
                            disabled={loading || googleLoading}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color={colors.textPrimary} />
                            ) : (
                                <>
                                    <AntDesign name="google" size={20} color={colors.textPrimary} />
                                    <Text variant="body" weight="bold" color="textPrimary" style={{ marginLeft: spacing.md }}>Google ile Devam Et</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text variant="body" color="textSecondary">Hesabın yok mu? </Text>
                            <TouchableOpacity onPress={() => !loading && navigation.navigate('Register')}>
                                <Text variant="body" color="primary" weight="bold">Kayıt Ol</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Light theme background
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    contentWrapperDesktop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
        gap: 80,
    },
    brandingPanel: {
        flex: 1,
        maxWidth: 400,
        justifyContent: 'center',
    },
    brandTitle: {
        marginTop: spacing.xl,
        fontSize: 48,
        letterSpacing: -1,
    },
    brandSubtitle: {
        marginTop: spacing.md,
        fontSize: 18,
        lineHeight: 28,
    },
    featureList: {
        marginTop: spacing.xxl,
        gap: spacing.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authCard: {
        width: '100%',
        maxWidth: 460,
        alignSelf: 'center',
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    authCardDesktop: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.04,
        shadowRadius: 32,
        elevation: 8,
    },
    formContainer: {
        padding: spacing.xxl,
    },
    mobileHeader: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        marginBottom: spacing.sm,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    checkboxWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.borderHighlight,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        padding: spacing.md,
        height: 48,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'background-color 0.2s ease' } as any),
    },
    googleButtonDisabled: {
        opacity: 0.6,
        ...(Platform.OS === 'web' && { cursor: 'not-allowed' } as any),
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    }
});
