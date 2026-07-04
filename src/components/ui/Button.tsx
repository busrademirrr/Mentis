import React, { useRef } from 'react';
import {
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    Animated,
    Pressable,
    PressableProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, shadows } from '../../theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    isLoading?: boolean;
    style?: ViewStyle | ViewStyle[];
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    icon,
    isLoading = false,
    disabled = false,
    style,
    fullWidth = false,
    onPressIn,
    onPressOut,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: any) => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 20,
            bounciness: 5,
        }).start();
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 5,
        }).start();
        onPressOut?.(e);
    };

    const getVariantStyles = (): { container: ViewStyle; textColor: string; isGradient?: boolean } => {
        switch (variant) {
            case 'primary':
                return {
                    container: { ...shadows.glow, borderColor: 'transparent' },
                    textColor: '#FFFFFF',
                    isGradient: true,
                };
            case 'secondary':
                return {
                    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.base },
                    textColor: 'textPrimary',
                };
            case 'outline':
                return {
                    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderHighlight },
                    textColor: 'textPrimary',
                };
            case 'ghost':
                return {
                    container: { backgroundColor: 'transparent' },
                    textColor: 'textSecondary',
                };
        }
    };

    const getSizeStyles = (): ViewStyle => {
        switch (size) {
            case 'sm':
                return { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.md };
            case 'lg':
                return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, borderRadius: radius.xl };
            default: // md
                return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.lg };
        }
    };

    const { container: dynamicContainer, textColor, isGradient } = getVariantStyles();
    const dynamicSize = getSizeStyles();

    const Content = () => (
        <React.Fragment>
            {isLoading ? (
                <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.textPrimary} />
            ) : (
                <React.Fragment>
                    {icon && <Animated.View style={{ marginRight: spacing.sm }}>{icon}</Animated.View>}
                    <Text variant="label" color={textColor} weight="semibold">
                        {title}
                    </Text>
                </React.Fragment>
            )}
        </React.Fragment>
    );

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || isLoading}
                style={[
                    styles.base,
                    dynamicContainer,
                    !isGradient && dynamicSize, // Gradient handles its own padding to fill
                    (disabled || isLoading) && { opacity: 0.6 },
                    fullWidth && { width: '100%' },
                    style as any,
                ]}
                {...props}
            >
                {isGradient ? (
                    <LinearGradient
                        colors={colors.gradients.premium as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, dynamicSize, { borderRadius: dynamicSize.borderRadius, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }]}
                    >
                        <Content />
                    </LinearGradient>
                ) : (
                    <Content />
                )}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden', // to keep gradient inside radius
    },
});
