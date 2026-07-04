import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { lightColors, darkColors, Colors } from './colors';
import { Platform } from 'react-native';

interface ThemeContextType {
    colors: Colors;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    colors: lightColors, // Default, will be overridden
    isDark: false
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const { preferences } = usePreferences();
    const isDark = preferences.theme === 'dark';

    // On Web, the theme is already handled via CSS variables set in index.html/index.css
    // But we still pass the correct JS colors just in case some components need it directly.
    const colors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);

    // For web, inject CSS variables dynamically based on theme preference
    useEffect(() => {
        if (Platform.OS === 'web') {
            const root = document.documentElement;
            if (isDark) {
                root.classList.add('dark');
                root.style.setProperty('--color-background', darkColors.background);
                root.style.setProperty('--color-surface', darkColors.surface);
                root.style.setProperty('--color-surface-hover', darkColors.surfaceHover);
                root.style.setProperty('--color-surface-glass', darkColors.surfaceGlass);
                root.style.setProperty('--color-text-primary', darkColors.textPrimary);
                root.style.setProperty('--color-text-secondary', darkColors.textSecondary);
                root.style.setProperty('--color-text-tertiary', darkColors.textTertiary);
                root.style.setProperty('--color-border', darkColors.border);
                root.style.setProperty('--color-border-highlight', darkColors.borderHighlight);
                root.classList.add('dark');
                root.style.setProperty('--color-background', darkColors.background);
                root.style.setProperty('--color-surface', darkColors.surface);
                root.style.setProperty('--color-surface-hover', darkColors.surfaceHover);
                root.style.setProperty('--color-surface-glass', darkColors.surfaceGlass);
                root.style.setProperty('--color-text-primary', darkColors.textPrimary);
                root.style.setProperty('--color-text-secondary', darkColors.textSecondary);
                root.style.setProperty('--color-text-tertiary', darkColors.textTertiary);
                root.style.setProperty('--color-border', darkColors.border);
                root.style.setProperty('--color-border-highlight', darkColors.borderHighlight);
            }
        }
    }, [isDark, colors]);

    return (
        <ThemeContext.Provider value={{ colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
