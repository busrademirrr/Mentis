import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

export interface GradientBackgroundProps {
    variant?: keyof typeof colors.gradients;
    style?: ViewStyle | ViewStyle[];
    children?: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    variant = 'premium',
    style,
    children,
}) => {
    // Determine which gradient set to use
    const gradientColors = colors.gradients[variant] || colors.gradients.premium;

    return (
        <LinearGradient
            colors={gradientColors as unknown as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }} // Sleek diagonal
            style={[styles.container, style]}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
