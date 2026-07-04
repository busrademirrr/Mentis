import { Platform } from 'react-native';

/**
 * Mentis AAA Premium Design System - Typography
 * Precise, prestigious, and modern stack.
 */
const getFontFamily = () => {
    if (Platform.OS === 'web') {
        return '"Inter", "SF Pro Display", "Geist", "Söhne", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    }
    return Platform.OS === 'ios' ? 'System' : 'Roboto';
};

export const typography = {
    fonts: {
        heading: getFontFamily(),
        body: getFontFamily(),
    },
    sizes: {
        xs: 12,   
        sm: 14,   
        md: 16, // body   
        lg: 18, // h4
        xl: 20, // h3
        xxl: 24, // h2 
        xxxl: 24, // h1
    },
    webSizes: {
        xs: 12,
        sm: 14,
        md: 16,   
        lg: 20,
        xl: 26,
        xxl: 36,
        xxxl: 48, 
    },
    lineHeights: {
        xs: 16,
        sm: 18,
        md: 22,
        lg: 26,
        xl: 30,
        xxl: 36,
        xxxl: 44,
    },
    webLineHeights: {
        xs: 16,
        sm: 20,
        md: 24, 
        lg: 30,
        xl: 36,
        xxl: 44,
        xxxl: 56,
    },
    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    }
};
