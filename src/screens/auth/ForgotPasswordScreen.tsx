import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon, MentisLogo } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';

const translateAuthError = (errorMsg: string) => {
    if (errorMsg.includes('User not found')) return 'Bu e-posta adresine ait kullanıcı bulunamadı.';
    if (errorMsg.includes('rate limit')) return 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.';
    return errorMsg;
};

export const ForgotPasswordScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Toast.show({ type: 'error', text1: 'Eksik Bilgi', text2: 'Lütfen e-posta adresinizi girin.' });
            return;
        }

        setLoading(true);
        const redirectUrl = Platform.OS === 'web' 
            ? `${window.location.origin}/reset-password` 
            : Linking.createURL('/reset-password');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });

        setLoading(false);

        if (error) {
            Toast.show({ type: 'error', text1: 'İşlem Başarısız', text2: translateAuthError(error.message) });
        } else {
            setIsSent(true);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.contentWrapper}>
                
                {/* Auth Card */}
                <View style={styles.authCard}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.formContainer}>
                        <View style={styles.header}>
                            <MentisLogo size={48} variant="primary" />
                            <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.lg }}>
                                {isSent ? 'E-posta Gönderildi' : 'Şifreni Sıfırla'}
                            </Text>
                            <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                                {isSent 
                                    ? 'Şifreni sıfırlamak için gereken bağlantıyı e-posta adresine gönderdik. Lütfen gelen kutunu kontrol et.' 
                                    : 'Hesabına kayıtlı e-posta adresini gir, sana şifreni sıfırlaman için bir bağlantı gönderelim.'}
                            </Text>
                        </View>

                        {!isSent ? (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text variant="label" color="textSecondary" style={styles.label}>E-posta</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ornek@mentis.app"
                                        placeholderTextColor={colors.textTertiary}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        editable={!loading}
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} 
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color={colors.surface} /> : <Text variant="body" weight="bold" color="surface">Sıfırlama Bağlantısı Gönder</Text>}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
                                <Text variant="body" weight="bold" color="textPrimary">Giriş Ekranına Dön</Text>
                            </TouchableOpacity>
                        )}

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
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    }
});
