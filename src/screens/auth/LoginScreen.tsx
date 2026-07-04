import React, { useState } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { AntDesign } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';

export const LoginScreen = ({ navigation }: any) => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Eksik Bilgi',
                text2: 'Lütfen e-posta ve şifrenizi girin.',
            });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Toast.show({
                type: 'error',
                text1: 'Giriş Başarısız',
                text2: error.message,
            });
            setLoading(false);
        } else {
            // Success! AuthContext will pick up the session change automatically.
            Toast.show({
                type: 'success',
                text1: 'Hoş geldiniz!',
                text2: 'Giriş işlemi başarılı.',
            });
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
            // Note: For web, this redirects the page, so code after this might not run immediately.
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
            {/* Background Gradient */}
            <LinearGradient
                colors={[colors.background, '#1a1a2e', colors.background]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            
            {/* Animated Orbs for Cinematic Effect removed for stability */}

            <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
                
                {/* Optional Side Branding for Desktop */}
                {isDesktop && (
                    <View style={styles.brandingPanel}>
                        <Icon name="hexagon" size={80} color={colors.primary} />
                        <Text variant="h1" color="textPrimary" weight="bold" style={{ marginTop: spacing.xl, fontSize: 48 }}>
                            Mentis
                        </Text>
                        <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, fontSize: 18 }}>
                            Felsefe, bilim ve sanatı tartışmanın en zarif yolu.
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
                                <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.md }}>Mentis'e Giriş Yap</Text>
                            </View>
                        )}
                        
                        {isDesktop && (
                            <Text variant="h2" weight="bold" color="textPrimary" style={{ marginBottom: spacing.xl }}>Hoş Geldiniz</Text>
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
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text variant="caption" color="textSecondary" weight="medium" style={styles.label}>Şifre</Text>
                                {/* Prepared for forgot password feature */}
                                <Text variant="caption" color="primary" weight="medium" style={styles.label}>Şifremi Unuttum</Text>
                            </View>
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

                        <Button 
                            title={loading ? "Giriş Yapılıyor..." : "Giriş Yap"} 
                            onPress={handleLogin} 
                            style={{ marginTop: spacing.lg }} 
                            disabled={loading}
                        />

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text variant="caption" color="textSecondary" style={{ paddingHorizontal: spacing.sm }}>VEYA</Text>
                            <View style={styles.divider} />
                        </View>

                        <View 
                            style={styles.googleButton} 
                            // @ts-ignore
                            onStartShouldSetResponder={() => true}
                            onResponderRelease={handleGoogleLogin}
                        >
                            <AntDesign name="google" size={20} color={colors.textPrimary} />
                            <Text variant="body" weight="bold" color="textPrimary" style={{ marginLeft: spacing.sm }}>Google ile Devam Et</Text>
                        </View>

                        <View style={styles.footer}>
                            <Text variant="body" color="textSecondary">Hesabın yok mu? </Text>
                            <Text 
                                variant="body" 
                                color="primary" 
                                weight="bold"
                                onPress={() => !loading && navigation.navigate('Register')}
                            >
                                Kayıt Ol
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
        flexDirection: 'row',
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
