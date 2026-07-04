import { Platform, Appearance } from 'react-native';

const isWeb = Platform.OS === 'web';

export const lightColors = {
    background: '#FAFAF7',
    surface: '#FFFFFF',
    surfaceHover: 'rgba(0,0,0,0.02)',
    surfaceGlass: 'rgba(255, 255, 255, 0.78)', 

    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryLight: 'rgba(124, 58, 237, 0.08)',
    secondary: '#5B21B6',
    accent: '#A78BFA',
    accentLight: '#EDE9FE',

    border: '#E5E7EB',
    borderHighlight: '#F3F4F6',

    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',

    categories: {
        philosophy: '#6B7280', 
        history: '#9CA3AF',    
        art: '#7C3AED',        
        science: '#3B82F6',    
    },

    gradients: {
        premium: ['#5B21B6', '#7C3AED'] as const,
        primaryGlow: ['rgba(124,58,237,0.15)', 'transparent'] as const,
        highlight: ['#FFFFFF', '#FAFAF7'] as const,   
        surfaceGlass: ['rgba(255,255,255,0.9)', 'rgba(250,250,247,1)'] as const,
    }
};

export const darkColors = {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceHover: 'rgba(255,255,255,0.05)',
    surfaceGlass: 'rgba(30, 41, 59, 0.78)', 

    primary: '#8B5CF6',
    primaryHover: '#A78BFA',
    primaryLight: 'rgba(139, 92, 246, 0.15)',
    secondary: '#7C3AED',
    accent: '#8B5CF6',
    accentLight: 'rgba(139, 92, 246, 0.15)',

    border: '#334155',
    borderHighlight: '#1E293B',

    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',

    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',

    categories: lightColors.categories,

    gradients: {
        premium: ['#7C3AED', '#8B5CF6'] as const,
        primaryGlow: ['rgba(139,92,246,0.15)', 'transparent'] as const,
        highlight: ['#1E293B', '#0F172A'] as const,   
        surfaceGlass: ['rgba(30,41,59,0.9)', 'rgba(15,23,42,1)'] as const,
    }
};

// Global theme override from PreferencesContext
declare global {
    var mentis_is_dark_mode: boolean | undefined;
}

// Fallback for static usage
export const colors = isWeb ? {
    ...darkColors,
    background: 'var(--color-background, #0F172A)',
    surface: 'var(--color-surface, #1E293B)',
    surfaceHover: 'var(--color-surface-hover, rgba(255,255,255,0.05))',
    surfaceGlass: 'var(--color-surface-glass, rgba(30, 41, 59, 0.78))', 
    textPrimary: 'var(--color-text-primary, #F8FAFC)',
    textSecondary: 'var(--color-text-secondary, #94A3B8)',
    textTertiary: 'var(--color-text-tertiary, #64748B)',
    border: 'var(--color-border, #334155)',
    borderHighlight: 'var(--color-border-highlight, #1E293B)',
} : new Proxy({} as any, {
    get: (_, prop) => {
        const isDark = global.mentis_is_dark_mode !== undefined 
            ? global.mentis_is_dark_mode 
            : Appearance.getColorScheme() === 'dark';
        const source = isDark ? darkColors : lightColors;
        return source[prop as keyof typeof darkColors];
    }
});

export type Colors = typeof darkColors;
