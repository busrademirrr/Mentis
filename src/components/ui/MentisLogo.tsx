import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';

interface MentisLogoProps {
    size?: number;
    color?: string;
    variant?: 'primary' | 'monochrome' | 'white';
}

export const MentisLogo = ({ size = 40, color, variant = 'primary' }: MentisLogoProps) => {
    // Elegant, minimalist geometric neural pathway / intellectual node construction.
    // It features three interconnected diamond-like nodes representing "Knowledge, Ideas, Connections".
    
    const baseColor = color || (
        variant === 'white' ? colors.textPrimary :
        variant === 'monochrome' ? colors.textPrimary :
        colors.primary
    );

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="100" y2="100">
                        <Stop offset="0" stopColor={baseColor} stopOpacity="1" />
                        <Stop offset="1" stopColor={variant === 'primary' ? colors.primaryLight || '#A78BFA' : baseColor} stopOpacity="0.8" />
                    </LinearGradient>
                </Defs>
                
                {/* Central Mathematical Construction - Abstract Node Structure */}
                {/* Outer Hexagon / Geometric Boundary */}
                <Path 
                    d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
                    stroke="url(#grad)" 
                    strokeWidth="6" 
                    strokeLinejoin="round" 
                    fill="none"
                />
                
                {/* Inner Neural Connections */}
                <Path 
                    d="M50 5 L50 50 M10 27.5 L50 50 M90 27.5 L50 50 M50 95 L50 50 M10 72.5 L50 50 M90 72.5 L50 50" 
                    stroke="url(#grad)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeOpacity="0.4"
                />
                
                {/* Intellectual Nodes */}
                <Circle cx="50" cy="5" r="4" fill="url(#grad)" />
                <Circle cx="90" cy="27.5" r="4" fill="url(#grad)" />
                <Circle cx="90" cy="72.5" r="4" fill="url(#grad)" />
                <Circle cx="50" cy="95" r="4" fill="url(#grad)" />
                <Circle cx="10" cy="72.5" r="4" fill="url(#grad)" />
                <Circle cx="10" cy="27.5" r="4" fill="url(#grad)" />
                <Circle cx="50" cy="50" r="6" fill="url(#grad)" />
                
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({});
