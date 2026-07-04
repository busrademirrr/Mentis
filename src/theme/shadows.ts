import { colors } from './colors';

/**
 * Mentis AAA Premium Design System - Shadows
 * Soft, elegant, glassmorphism-inspired shadows.
 */
export const shadows = {
    // Subtle layered depth for cards
    base: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    // Hover elevation
    hover: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
        elevation: 6,
    },
    // Floating UI elements (command palette, dropdowns)
    floating: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.12,
        shadowRadius: 48,
        elevation: 10,
    },
    // Soft primary glow (buttons, active states)
    glow: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    }
};
