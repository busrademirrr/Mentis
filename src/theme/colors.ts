/**
 * Mentis AAA Premium Design System - Colors
 */
export const colors = {
    // Backgrounds
    background: '#F6F3EE',          // Warm premium ivory
    surface: '#FFFFFF',             // White surface
    surfaceHover: 'rgba(0,0,0,0.02)',
    surfaceGlass: 'rgba(255, 255, 255, 0.78)', // Glassmorphism backdrop

    // Core Elements
    primary: '#7C3AED',             // Soft intellectual purple
    primaryHover: '#8B5CF6',
    primaryLight: 'rgba(124, 58, 237, 0.08)',
    secondary: '#1F1F24',           // Graphite
    accent: '#8B5CF6',              
    accentLight: '#EDE9FE',         

    // Borders & Dividers
    border: 'rgba(0,0,0,0.06)',              
    borderHighlight: 'rgba(0,0,0,0.08)',

    // Typography
    textPrimary: '#1F1F24',         // Deep graphite
    textSecondary: '#6B7280',       
    textTertiary: '#9CA3AF',

    // Utility
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Category / Subject Accents (Minimalist mapping)
    categories: {
        philosophy: '#6B7280', 
        history: '#9CA3AF',    
        art: '#7C3AED',        
        science: '#3B82F6',    
    },

    // Gradients (Cinematic and soft)
    gradients: {
        premium: ['#1F1F24', '#7C3AED'] as const,     // Graphite to purple
        primaryGlow: ['rgba(124,58,237,0.15)', 'transparent'] as const,
        highlight: ['#FFFFFF', '#F6F3EE'] as const,   
        surfaceGlass: ['rgba(255,255,255,0.9)', 'rgba(246,243,238,1)'] as const,
    }
};

export type Colors = typeof colors;
