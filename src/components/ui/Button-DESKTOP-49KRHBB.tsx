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
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
                    textColor: colors.surface,
                    isGradient: true,
                };
            case 'danger':
                return {
                    container: { backgroundColor: colors.error, borderColor: colors.error, ...shadows.glow },
                    textColor: colors.surface,
                    isGradient: false,
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
                <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.textPrimary} />
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
                    dynamicSize, // ALWAYS APPLY dynamicSize so the button has dimensions
                    (disabled || isLoading) && { opacity: 0.6 },
                    fullWidth && { width: '100%' },
                    style as any,
                ]}
                {...props}
            >
                {isGradient && (
                    <LinearGradient
                        colors={colors.gradients.premium as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFill, { borderRadius: dynamicSize.borderRadius }]}
                    />
                )}
                <Content />
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
