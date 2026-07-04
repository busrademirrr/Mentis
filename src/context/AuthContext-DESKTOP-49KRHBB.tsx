import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Icon, MentisLogo } from '../components/ui';
import { colors, spacing, radius } from '../theme';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    session: Session | null;
    user: User | null;
    profile: any | null;
    isOffline: boolean;
    isPasswordRecovery: boolean;
}

interface AuthContextType extends AuthState {
    setLoading: (loading: boolean) => void;
    refreshSession: () => Promise<void>;
    signOut: () => Promise<void>;
    clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    session: null,
    user: null,
    profile: null,
    isOffline: false,
    isPasswordRecovery: false,
    setLoading: () => {},
    refreshSession: async () => {},
    signOut: async () => {},
    clearPasswordRecovery: () => {},
});

const TIMEOUT_MS = 10000; // 10 seconds failsafe

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        session: null,
        user: null,
        profile: null,
        isOffline: false,
        isPasswordRecovery: false,
    });
    const [timeoutTriggered, setTimeoutTriggered] = useState(false);

    const handleSessionUpdate = useCallback(async (session: Session | null) => {
        if (session?.user) {
            try {
                // 1. Fetch from user_profiles
                let { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .single();

                // 2. Fetch from users
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // 3. Fallback Creation Logic for OAuth (Google)
                // If profile or users record is missing, we create it.
                if ((profileError && profileError.code === 'PGRST116') || (usersError && usersError.code === 'PGRST116')) {
                    console.log('User record missing in DB. Auto-creating for OAuth session...');
                    const meta = session.user.user_metadata || {};
                    const emailPrefix = session.user.email ? session.user.email.split('@')[0] : 'user';
                    const fallbackUsername = `${emailPrefix}_${Math.floor(Math.random()*10000)}`;
                    
                    const username = meta.user_name || meta.name || fallbackUsername;
                    const fullName = meta.full_name || meta.name || '';
                    const avatarUrl = meta.avatar_url || '';

                    // Insert into users if missing
                    if (usersError && usersError.code === 'PGRST116') {
                        await supabase.from('users').insert({
                            id: session.user.id,
                            username: username,
                            full_name: fullName,
                            avatar_url: avatarUrl,
                            avatar_value: avatarUrl || 'bottts',
                            avatar_type: 'upload',
                            level: 1,
                            xp: 0,
                            is_premium: false
                            // Note: Do not insert email if it doesn't exist in the schema
                        });
                    }

                    // Insert into user_profiles if missing
                    if (profileError && profileError.code === 'PGRST116') {
                        const { data: newProfile } = await supabase.from('user_profiles').insert({
                            user_id: session.user.id,
                            username: username,
                            full_name: fullName,
                            avatar_url: avatarUrl,
                        }).select('*').single();
                        
                        if (newProfile) profile = newProfile;
                    }
                }

                if (profileError && profileError.code !== 'PGRST116') {
                    // Profile fetch failed for a real reason, might be offline
                    if (profileError.message.includes('fetch failed') || profileError.message.includes('Network request failed')) {
                        console.warn('Offline mode activated: Profile fetch failed');
                        setState(prev => ({
                            ...prev,
                            isAuthenticated: true,
                            isLoading: false,
                            session,
                            user: session.user,
                            isOffline: true,
                        }));
                        return;
                    }
                    console.error('Error fetching user profile:', profileError.message);
                }

                setState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    isLoading: false,
                    session,
                    user: session.user,
                    profile: profile || null,
                    isOffline: false,
                }));
            } catch (err) {
                console.error('Profile fetch exception:', err);
                // Fallback to offline mode
                setState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    isLoading: false,
                    session,
                    user: session.user,
                    isOffline: true,
                }));
            }
        } else {
            setState({
                isAuthenticated: false,
                isLoading: false,
                session: null,
                user: null,
                profile: null,
                isOffline: false,
            });
        }
    }, []);

    const initAuth = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        setTimeoutTriggered(false);

        const timeoutId = setTimeout(() => {
            setState(prev => {
                if (prev.isLoading) {
                    setTimeoutTriggered(true);
                }
                return prev;
            });
        }, TIMEOUT_MS);

        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            await handleSessionUpdate(session);
        } catch (e) {
            console.warn('Auth init failed, offline mode:', e);
            setState(prev => ({ ...prev, isLoading: false, isOffline: true }));
        } finally {
            clearTimeout(timeoutId);
        }
    }, [handleSessionUpdate]);

    useEffect(() => {
        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setState(prev => ({ ...prev, isPasswordRecovery: true }));
            }
            // Wait, we don't want to re-trigger timeout loader on every token refresh, just update state.
            handleSessionUpdate(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [initAuth, handleSessionUpdate]);

    const refreshSession = async () => {
        await initAuth();
    };

    const signOut = async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        await supabase.auth.signOut();
        setState({
            isAuthenticated: false,
            isLoading: false,
            session: null,
            user: null,
            profile: null,
            isOffline: false,
            isPasswordRecovery: false,
        });
    };

    const setLoading = (loading: boolean) => {
        setState(prev => ({ ...prev, isLoading: loading }));
    };

    const clearPasswordRecovery = () => {
        setState(prev => ({ ...prev, isPasswordRecovery: false }));
    };

    // Rendering Failsafe Recovery Screen if stuck loading for > 10s
    if (state.isLoading && timeoutTriggered) {
        return (
            <View style={styles.failsafeContainer}>
                <MentisLogo size={64} variant="primary" />
                <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
                    Bağlantı Zaman Aşımı
                </Text>
                <Text variant="body" color="textSecondary" align="center" style={{ marginBottom: spacing.xxl, maxWidth: 300 }}>
                    Sunucuya bağlanırken bir sorun oluştu. İnternet bağlantınızı kontrol edip tekrar deneyebilirsiniz.
                </Text>
                
                <View style={styles.failsafeActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={refreshSession}>
                        <Icon name="refresh-cw" size={18} color="surface" />
                        <Text variant="label" weight="bold" color="surface" style={{ marginLeft: spacing.sm }}>Tekrar Dene</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={signOut}>
                        <Icon name="log-out" size={18} color="textPrimary" />
                        <Text variant="label" weight="bold" color="textPrimary" style={{ marginLeft: spacing.sm }}>Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ ...state, setLoading, refreshSession, signOut, clearPasswordRecovery }}>
            {children}
            {state.isOffline && state.isAuthenticated && !state.isLoading && (
                <View style={styles.offlineBanner}>
                    <ActivityIndicator size="small" color="#f59e0b" style={{ marginRight: spacing.sm }} />
                    <Text variant="caption" weight="bold" color="#b45309">Bağlantı bekleniyor (Çevrimdışı Mod)</Text>
                </View>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

const styles = StyleSheet.create({
    failsafeContainer: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    failsafeActions: {
        width: '100%',
        maxWidth: 300,
        gap: spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
    },
    actionBtnOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    offlineBanner: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fef3c7',
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 1,
        borderTopColor: '#fde68a',
        zIndex: 9999,
    }
});
