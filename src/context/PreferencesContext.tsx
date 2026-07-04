import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface UserPreferences {
    id?: string;
    theme: 'light' | 'dark';
    push_notifications: boolean;
    email_notifications: boolean;
    mention_notifications: boolean;
    is_private: boolean;
    show_online_status: boolean;
}

const defaultPreferences: UserPreferences = {
    theme: 'light',
    push_notifications: true,
    email_notifications: true,
    mention_notifications: true,
    is_private: false,
    show_online_status: true,
};

interface PreferencesContextType {
    preferences: UserPreferences;
    isLoadingPreferences: boolean;
    updatePreference: (key: keyof UserPreferences, value: any) => Promise<boolean>;
}

const PreferencesContext = createContext<PreferencesContextType>({
    preferences: defaultPreferences,
    isLoadingPreferences: true,
    updatePreference: async () => false,
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
    const [isLoadingPreferences, setIsLoading] = useState(true);

    const loadPreferences = useCallback(async () => {
        if (!user) {
            setPreferences(defaultPreferences);
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Not found, create default
                    const { data: newPrefs, error: insertError } = await supabase
                        .from('user_preferences')
                        .insert([{ user_id: user.id, ...defaultPreferences }])
                        .select()
                        .single();
                        
                    if (!insertError && newPrefs) {
                        setPreferences(newPrefs);
                    }
                } else {
                    console.error('Error loading preferences:', error.message);
                }
            } else if (data) {
                setPreferences(data);
                if (Platform.OS !== 'web') {
                    global.mentis_is_dark_mode = data.theme === 'dark';
                }
            }
        } catch (e) {
            console.error('Exception loading preferences:', e);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);

    // Apply global dark mode to Web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const root = document.documentElement;
            if (preferences.theme === 'dark') {
                root.style.setProperty('--color-background', '#0F172A');
                root.style.setProperty('--color-surface', '#1E293B');
                root.style.setProperty('--color-surface-hover', 'rgba(255,255,255,0.05)');
                root.style.setProperty('--color-surface-glass', 'rgba(30, 41, 59, 0.78)');
                root.style.setProperty('--color-border', '#334155');
                root.style.setProperty('--color-border-highlight', '#1E293B');
                root.style.setProperty('--color-text-primary', '#F8FAFC');
                root.style.setProperty('--color-text-secondary', '#94A3B8');
                root.style.setProperty('--color-text-tertiary', '#64748B');
                root.style.setProperty('--color-primary-light', 'rgba(124, 58, 237, 0.15)');
                
                // Keep body background in sync
                document.body.style.backgroundColor = '#0F172A';
            } else {
                root.style.setProperty('--color-background', '#FAFAF7');
                root.style.setProperty('--color-surface', '#FFFFFF');
                root.style.setProperty('--color-surface-hover', 'rgba(0,0,0,0.02)');
                root.style.setProperty('--color-surface-glass', 'rgba(255, 255, 255, 0.78)');
                root.style.setProperty('--color-border', '#E5E7EB');
                root.style.setProperty('--color-border-highlight', '#F3F4F6');
                root.style.setProperty('--color-text-primary', '#111827');
                root.style.setProperty('--color-text-secondary', '#6B7280');
                root.style.setProperty('--color-text-tertiary', '#9CA3AF');
                root.style.setProperty('--color-primary-light', 'rgba(124, 58, 237, 0.08)');
                
                document.body.style.backgroundColor = '#FAFAF7';
            }
        } else {
            // Native logic
            global.mentis_is_dark_mode = preferences.theme === 'dark';
        }
    }, [preferences.theme]);

    const updatePreference = async (key: keyof UserPreferences, value: any): Promise<boolean> => {
        if (!user) return false;
        
        // Optimistic update
        const previousPrefs = { ...preferences };
        setPreferences(prev => ({ ...prev, [key]: value }));

        if (key === 'theme' && Platform.OS !== 'web') {
            global.mentis_is_dark_mode = value === 'dark';
            // Need setTimeout to let setPreferences finish optimistic update
            setTimeout(() => {
                import('react-native').then(({ Alert }) => {
                    Alert.alert(
                        "Tema Değiştirildi",
                        "Yeni temanın tam olarak uygulanması için uygulamayı kapatıp açmanız gerekebilir.",
                        [{ text: "Tamam" }]
                    );
                });
            }, 500);
        }

        try {
            const { error } = await supabase
                .from('user_preferences')
                .update({ [key]: value })
                .eq('user_id', user.id);

            if (error) {
                // Revert
                setPreferences(previousPrefs);
                console.error(`Error updating ${key}:`, error.message);
                return false;
            }
            return true;
        } catch (e) {
            setPreferences(previousPrefs);
            return false;
        }
    };

    return (
        <PreferencesContext.Provider value={{ preferences, isLoadingPreferences, updatePreference }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => useContext(PreferencesContext);
