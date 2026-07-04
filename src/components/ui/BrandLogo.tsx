import React from 'react';
import { View, Platform } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';

interface BrandLogoProps {
    variant?: 'primary' | 'compact' | 'monochrome' | 'dark' | 'app-icon' | 'navbar';
    size?: number;
    color?: string;
}

export const BrandLogo = ({ variant = 'primary', size = 32, color }: BrandLogoProps) => {
    // Determine colors based on variant
    const isDark = variant === 'dark' || variant === 'app-icon';
    const isMono = variant === 'monochrome';
    
    const primaryColor = color || (isMono ? colors.textPrimary : (isDark ? colors.textPrimary : colors.primary));
    const nodeColor = color || (isMono ? colors.textPrimary : (isDark ? colors.textPrimary : colors.secondary));

    // A perfectly symmetrical, monoline geometric construction representing nodes and neural pathways
    // Hexagonal bounds, interconnected 'M' structure inside.
    const renderGeometricSymbol = () => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            {/* Base Hexagon/Network Frame */}
            <Path 
                d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" 
                stroke={primaryColor} 
                strokeWidth="6" 
                strokeLinejoin="round"
                fill="none"
                opacity={0.3}
            />
            {/* The Intellectual 'M' Path / Neural Connection */}
            <Path 
                d="M25 65 L25 35 L50 55 L75 35 L75 65" 
                stroke={primaryColor} 
                strokeWidth="8" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
            />
            {/* Connecting Nodes */}
            <Circle cx="25" cy="35" r="5" fill={nodeColor} />
            <Circle cx="50" cy="55" r="5" fill={nodeColor} />
            <Circle cx="75" cy="35" r="5" fill={nodeColor} />
            <Circle cx="25" cy="65" r="5" fill={nodeColor} />
            <Circle cx="75" cy="65" r="5" fill={nodeColor} />
            <Circle cx="50" cy="10" r="5" fill={nodeColor} opacity={0.5} />
            <Circle cx="50" cy="90" r="5" fill={nodeColor} opacity={0.5} />
        </Svg>
    );

    if (variant === 'app-icon') {
        return (
            <View style={{
                width: size * 1.5,
                height: size * 1.5,
                backgroundColor: colors.primary,
                borderRadius: size * 0.35, // Apple-like squircle radius
                alignItems: 'center',
                justifyContent: 'center',
                ...(Platform.OS === 'web' && { boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)' } as any)
            }}>
                {renderGeometricSymbol()}
            </View>
        );
    }

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
            {renderGeometricSymbol()}
        </View>
    );
};
