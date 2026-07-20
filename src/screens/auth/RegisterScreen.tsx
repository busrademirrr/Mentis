import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions, Animated, Easing, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { AntDesign } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';

export const RegisterScreen = ({ navigation }: any) => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Animations
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const translateYAnim = React.useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Eksik Bilgi',
                text2: 'Lütfen tüm alanları doldurun.',
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Şifreler eşleşmiyor.',
            });
            return;
        }
        
        if (password.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Güçsüz Şifre',
                text2: 'Şifreniz en az 6 karakter olmalıdır.',
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Toast.show({
                type: 'error',
                text1: 'Kayıt Başarısız',
                text2: error.message,
            });
            setLoading(false);
        } else {
            Toast.show({
                type: 'success',
                text1: 'Kayıt Başarılı!',
                text2: 'Lütfen e-postanızı doğrulayın veya giriş yapın.',
            });
            // Depending on Supabase settings, user might be automatically logged in or sent a verification email.
            // If they need to verify email, auth context won't update isAuthenticated until they do.
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: Platform.OS === 'web' ? window.location.origin : 'mentisapp://',
                }
            });
            
            if (error) throw error;
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Google Girişi Başarısız',
                text2: error.message || 'Bir hata oluştu.',
            });
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={[colors.background, '#1a1a2e', colors.background]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            
            {/* Animated Orbs removed for stability */}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
                    
                    {/* Optional Side Branding for Desktop */}
                    {isDesktop && (
                        <View style={styles.brandingPanel}>
                            <Icon name="hexagon" size={80} color={colors.primary} />
                            <Text variant="h1" color="textPrimary" weight="bold" style={{ marginTop: spacing.xl, fontSize: 48 }}>
                                Mentis
                            </Text>
                            <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, fontSize: 18 }}>
                                Yeni bir fikir akımının parçası olun.
                            </Text>
                        </View>
                    )}

                    {/* Auth Card */}
                    <Animated.View 
                        style={[
                            styles.authCard, 
                            isDesktop && styles.authCardDesktop,
                            { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }
                        ]}
                    >
                        <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]} />

                        <View style={styles.formContainer}>
                            {!isDesktop && (
                                <View style={styles.mobileHeader}>
                                    <Icon name="hexagon" size={40} color={colors.primary} />
                                    <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.md }}>Hesap Oluştur</Text>
                                </View>
                            )}
                            
                            {isDesktop && (
                                <Text variant="h2" weight="bold" color="textPrimary" style={{ marginBottom: spacing.xl }}>Hesap Oluştur</Text>
                            )}

                            <View style={styles.inputGroup}>
                                <Text variant="caption" color="textSecondary" weight="medium" style={styles.label}>E-posta</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="ornek@mentis.app"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text variant="caption" color="textSecondary" weight="medium" style={styles.label}>Şifre</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text variant="caption" color="textSecondary" weight="medium" style={styles.label}>Şifre Tekrar</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    editable={!loading}
                                />
                            </View>

                            <Button 
                                title={loading ? "Oluşturuluyor..." : "Kayıt Ol"} 
                                onPress={handleRegister} 
                                style={{ marginTop: spacing.lg }} 
                                disabled={loading}
                            />

                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text variant="caption" color="textSecondary" style={{ paddingHorizontal: spacing.sm }}>VEYA</Text>
                                <View style={styles.divider} />
                            </View>

                            <TouchableOpacity 
                                style={styles.googleButton} 
                                onPress={handleGoogleLogin}
                            >
                                <AntDesign name="google" size={20} color={colors.textPrimary} />
                                <Text variant="body" weight="bold" color="textPrimary" style={{ marginLeft: spacing.sm }}>Google ile Kayıt Ol</Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text variant="body" color="textSecondary">Zaten hesabın var mı? </Text>
                                <Text 
                                    variant="body" 
                                    color="primary" 
                                    weight="bold"
                                    onPress={() => !loading && navigation.navigate('Login')}
                                >
                                    Giriş Yap
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
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
        justifyContent: 'center',
    },
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    contentWrapperDesktop: {
        flexDirection: 'row-reverse', // Branding on the right for register to switch it up slightly, or keep same
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        gap: 60,
    },
    brandingPanel: {
        flex: 1,
        maxWidth: 500,
        padding: spacing.xl,
        justifyContent: 'center',
    },
    authCard: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    authCardDesktop: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 10,
    },
    formContainer: {
        padding: spacing.xl,
        paddingVertical: 40,
    },
    mobileHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: radius.md,
        padding: spacing.md,
        color: colors.textPrimary,
        fontSize: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: radius.md,
        padding: spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    }
});
