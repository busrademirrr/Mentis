/**
 * Mentis AAA Premium Design System - Typography
 * Editorial, Notion-inspired typography system.
 */
export const typography = {
    fonts: {
        heading: 'System', // Inter, Geist, or SF Pro Display injected via OS
        body: 'System',
    },
    sizes: {
        xs: 12,   // Captions
        sm: 13,   // Secondary Text
        md: 15,   // Body (Dense but legible)
        lg: 18,   // Subtitles
        xl: 22,   // H3
        xxl: 28,  // H2
        xxxl: 36, // H1
    },
    webSizes: {
        xs: 12,
        sm: 14,
        md: 16,   // Web base
        lg: 20,
        xl: 26,
        xxl: 36,
        xxxl: 48, // H1 desktop
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
        md: 24, // 1.5 ratio for readability
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
