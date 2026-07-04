import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { AntDesign } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon, MentisLogo } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';

const translateAuthError = (errorMsg: string) => {
    if (errorMsg.includes('already registered')) return 'Bu e-posta adresi zaten kullanımda.';
    if (errorMsg.includes('Database error')) return 'Kayıt sırasında bir hata oluştu (Kullanıcı adı alınmış olabilir).';
    if (errorMsg.includes('rate limit')) return 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin.';
    return errorMsg;
};

export const RegisterScreen = ({ navigation }: any) => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    
    const [usernameError, setUsernameError] = useState('');

    // Password strength state
    const [hasLength, setHasLength] = useState(false);
    const [hasUpper, setHasUpper] = useState(false);
    const [hasLower, setHasLower] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);

    useEffect(() => {
        setHasLength(password.length >= 8);
        setHasUpper(/[A-Z]/.test(password));
        setHasLower(/[a-z]/.test(password));
        setHasNumber(/[0-9]/.test(password));
    }, [password]);

    const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber;
    const isFormValid = name && username && email && isPasswordValid && password === confirmPassword;

    const handleRegister = async () => {
        setUsernameError('');

        if (!isFormValid) {
            Toast.show({ type: 'error', text1: 'Eksik Bilgi', text2: 'Lütfen tüm alanları kurallara uygun doldurun.' });
            return;
        }

        // Fast frontend check for username uniqueness
        setLoading(true);
        const { count } = await supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }).eq('username', username);
        if (count && count > 0) {
            setUsernameError('Bu kullanıcı adı alınmış.');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    username: username,
                    onboarding_completed: false
                }
            }
        });

        if (error) {
            Toast.show({ type: 'error', text1: 'Kayıt Başarısız', text2: translateAuthError(error.message) });
            setLoading(false);
        } else {
            Toast.show({ type: 'success', text1: 'Kayıt Başarılı', text2: 'Hesabınız oluşturuldu.' });
            setLoading(false);
            if (data.session) {
                // AuthContext will pick up the session and transition to AppFlow (or Onboarding)
            } else {
                Toast.show({ type: 'info', text1: 'Doğrulama Gerekli', text2: 'Lütfen e-postanızı kontrol edin.' });
                navigation.navigate('Login');
            }
        }
    };

    const handleGoogleRegister = async () => {
        try {
            setGoogleLoading(true);
            const redirectUrl = Linking.createURL('/');
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                }
            });
            if (error) throw error;
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Bağlantı Hatası', text2: translateAuthError(error.message) });
            setGoogleLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
                    
                    {/* Desktop Left Side - Brand Story */}
                    {isDesktop && (
                        <View style={styles.brandingPanel}>
                            <MentisLogo size={80} variant="primary" />
                            <Text variant="h1" color="textPrimary" weight="bold" style={styles.brandTitle}>
                                Mentis Ağına Katıl
                            </Text>
                            <Text variant="body" color="textSecondary" style={styles.brandSubtitle}>
                                Gerçek entelektüel kimliğini oluştur ve global zihinlerle bağlantı kur.
                            </Text>
                        </View>
                    )}

                    {/* Right Side - Auth Card */}
                    <View style={[styles.authCard, isDesktop && styles.authCardDesktop]}>
                        <View style={styles.formContainer}>
                            
                            {!isDesktop && (
                                <View style={styles.mobileHeader}>
                                    <MentisLogo size={48} variant="primary" />
                                    <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.md }}>Kayıt Ol</Text>
                                </View>
                            )}
                            
                            {isDesktop && (
                                <Text variant="h2" weight="bold" color="textPrimary" style={{ marginBottom: spacing.xl }}>Hesap Oluştur</Text>
                            )}

                            <View style={styles.inputGroup}>
                                <Text variant="label" color="textSecondary" style={styles.label}>Ad Soyad</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Immanuel Kant"
                                    placeholderTextColor={colors.textTertiary}
                                    value={name}
                                    onChangeText={setName}
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text variant="label" color={usernameError ? "error" : "textSecondary"} style={styles.label}>Kullanıcı Adı</Text>
                                <TextInput
                                    style={[styles.input, usernameError ? { borderColor: colors.error } : {}]}
                                    placeholder="immanuel_k"
                                    placeholderTextColor={colors.textTertiary}
                                    value={username}
                                    onChangeText={(t) => { setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, '')); setUsernameError(''); }}
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                                {!!usernameError && <Text variant="caption" color="error" style={{marginTop: 4}}>{usernameError}</Text>}
                            </View>

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

                            <View style={styles.inputGroup}>
                                <Text variant="label" color="textSecondary" style={styles.label}>Şifre</Text>
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
                                {/* Strength Meter */}
                                {password.length > 0 && (
                                    <View style={styles.strengthMeter}>
                                        <View style={styles.strengthReq}><Icon name={hasLength ? "check-circle" : "x-circle"} size={12} color={hasLength ? colors.primary : colors.error} /><Text variant="caption" color={hasLength ? "textPrimary" : "error"} style={{marginLeft: 4, fontSize: 10}}>Min 8</Text></View>
                                        <View style={styles.strengthReq}><Icon name={hasUpper ? "check-circle" : "x-circle"} size={12} color={hasUpper ? colors.primary : colors.error} /><Text variant="caption" color={hasUpper ? "textPrimary" : "error"} style={{marginLeft: 4, fontSize: 10}}>Büyük Hrf</Text></View>
                                        <View style={styles.strengthReq}><Icon name={hasLower ? "check-circle" : "x-circle"} size={12} color={hasLower ? colors.primary : colors.error} /><Text variant="caption" color={hasLower ? "textPrimary" : "error"} style={{marginLeft: 4, fontSize: 10}}>Küçük Hrf</Text></View>
                                        <View style={styles.strengthReq}><Icon name={hasNumber ? "check-circle" : "x-circle"} size={12} color={hasNumber ? colors.primary : colors.error} /><Text variant="caption" color={hasNumber ? "textPrimary" : "error"} style={{marginLeft: 4, fontSize: 10}}>Rakam</Text></View>
                                    </View>
                                )}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text variant="label" color="textSecondary" style={styles.label}>Şifre Tekrar</Text>
                                <TextInput
                                    style={[styles.input, confirmPassword && password !== confirmPassword ? { borderColor: colors.error } : {}]}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.textTertiary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                />
                            </View>

                            <TouchableOpacity 
                                style={[styles.primaryBtn, (!isFormValid || loading) && styles.primaryBtnDisabled]} 
                                onPress={handleRegister}
                                disabled={!isFormValid || loading || googleLoading}
                            >
                                {loading ? <ActivityIndicator color={colors.surface} /> : <Text variant="body" weight="bold" color="surface">Hesap Oluştur</Text>}
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text variant="caption" color="textTertiary" style={{ paddingHorizontal: spacing.sm }}>VEYA</Text>
                                <View style={styles.divider} />
                            </View>

                            <TouchableOpacity 
                                style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]} 
                                onPress={handleGoogleRegister}
                                disabled={loading || googleLoading}
                            >
                                {googleLoading ? (
                                    <ActivityIndicator color={colors.textPrimary} />
                                ) : (
                                    <>
                                        <AntDesign name="google" size={20} color={colors.textPrimary} />
                                        <Text variant="body" weight="bold" color="textPrimary" style={{ marginLeft: spacing.md }}>Google ile Kayıt Ol</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text variant="body" color="textSecondary">Zaten hesabın var mı? </Text>
                                <TouchableOpacity onPress={() => !loading && navigation.navigate('Login')}>
                                    <Text variant="body" color="primary" weight="bold">Giriş Yap</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
        paddingVertical: spacing.xxxl,
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
    strengthMeter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
        paddingHorizontal: 4,
    },
    strengthReq: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        marginTop: spacing.md,
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
