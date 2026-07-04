import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, spacing, shadows } from '../../theme';

export interface CardProps extends ViewProps {
    variant?: 'default' | 'outlined' | 'glass';
    padding?: keyof typeof spacing | number | 'none';
    withShadow?: boolean;
}

export const Card: React.FC<CardProps> = ({
    variant = 'default',
    padding = 'lg',
    withShadow = false,
    style,
    children,
    ...props
}) => {
    // Resolve padding
    const paddingVal = padding === 'none' ? 0 : typeof padding === 'string' ? spacing[padding as keyof typeof spacing] : padding;

    const baseStyle: ViewStyle = {
        borderRadius: radius.lg,
        padding: paddingVal,
        overflow: 'hidden',
    };

    const variantStyles: Record<string, ViewStyle> = {
        default: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
        },
        outlined: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.borderHighlight,
        },
        glass: {
            backgroundColor: colors.surfaceGlass,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.4)',
        }
    };

    const containerStyle = [
        baseStyle,
        variantStyles[variant],
        withShadow ? shadows.base : {},
        style,
    ];

    if (variant === 'glass') {
        return (
            <BlurView intensity={25} tint="light" style={containerStyle as any} {...props}>
                {children}
            </BlurView>
        );
    }

    return (
        <View style={containerStyle} {...props}>
            {children}
        </View>
    );
};
