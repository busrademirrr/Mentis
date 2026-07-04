import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, Platform } from 'react-native';
import { colors, typography } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption';
type TextColor = keyof typeof colors | string;
type TextWeight = keyof typeof typography.weights;

export interface TextProps extends RNTextProps {
    variant?: TextVariant;
    color?: TextColor;
    weight?: TextWeight;
    align?: 'left' | 'center' | 'right' | 'justify';
}

export const Text: React.FC<TextProps> = ({
    variant = 'body',
    color = 'textPrimary',
    weight,
    align = 'left',
    style,
    children,
    ...props
}) => {
    const { isDesktop, isTablet } = useResponsive();
    const isWebScale = Platform.OS === 'web' && (isDesktop || isTablet);

    const getVariantStyle = (): TextStyle => {
        const sizes = isWebScale ? typography.webSizes : typography.sizes;
        const lineHeights = isWebScale ? typography.webLineHeights : typography.lineHeights;

        switch (variant) {
            case 'h1':
                return { fontSize: sizes.xxxl, lineHeight: lineHeights.xxxl, fontWeight: typography.weights.bold };
            case 'h2':
                return { fontSize: sizes.xxl, lineHeight: lineHeights.xxl, fontWeight: typography.weights.bold };
            case 'h3':
                return { fontSize: sizes.xl, lineHeight: lineHeights.xl, fontWeight: typography.weights.semibold };
            case 'body':
                return { fontSize: sizes.md, lineHeight: lineHeights.md, fontWeight: typography.weights.regular };
            case 'label':
                return { fontSize: sizes.sm, lineHeight: lineHeights.sm, fontWeight: typography.weights.medium };
            case 'caption':
                return { fontSize: sizes.xs, lineHeight: lineHeights.xs, fontWeight: typography.weights.regular };
            default:
                return { fontSize: sizes.md, lineHeight: lineHeights.md };
        }
    };

    // Safely get color from theme or fallback to raw string
    const resolveColor = (): string => {
        if (colors[color as keyof typeof colors]) {
            return colors[color as keyof typeof colors] as string;
        }
        return color;
    };

    const textStyle: TextStyle = {
        ...getVariantStyle(),
        color: resolveColor(),
        textAlign: align,
        fontFamily: typography.fonts.heading,
    };

    if (weight) {
        textStyle.fontWeight = typography.weights[weight];
    }

    return (
        <RNText style={[textStyle, style]} {...props}>
            {children}
        </RNText>
    );
};
