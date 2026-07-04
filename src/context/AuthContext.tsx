import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    session: Session | null;
    user: User | null;
    profile: any | null;
}

interface AuthContextType extends AuthState {
    setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true, // Start in loading state to prevent flash of login screen
    session: null,
    user: null,
    profile: null,
    setLoading: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        session: null,
        user: null,
        profile: null,
    });

    useEffect(() => {
        let mounted = true;

        const handleSessionUpdate = async (session: Session | null) => {
            if (!mounted) return;

            if (session?.user) {
                // Fetch profile data
                try {
                    const { data: profile, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (!mounted) return;

                    if (error && error.code !== 'PGRST116') {
                        console.error('Error fetching user profile:', error.message);
                    }

                    setState({
                        isAuthenticated: true,
                        isLoading: false,
                        session,
                        user: session.user,
                        profile: profile || null,
                    });
                } catch (err) {
                    console.error('Profile fetch exception:', err);
                    if (!mounted) return;
                    setState({
                        isAuthenticated: true,
                        isLoading: false,
                        session,
                        user: session.user,
                        profile: null,
                    });
                }
            } else {
                if (!mounted) return;
                setState({
                    isAuthenticated: false,
                    isLoading: false,
                    session: null,
                    user: null,
                    profile: null,
                });
            }
        };

        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSessionUpdate(session);
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleSessionUpdate(session);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const setLoading = (loading: boolean) => {
        setState(prev => ({ ...prev, isLoading: loading }));
    };

    return (
        <AuthContext.Provider value={{ ...state, setLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
