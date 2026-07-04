import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../theme';
import { Icon } from '../components/ui/Icon';
import { Text } from '../components/ui/Text';

export const LoadingScreen = () => {
    // Simple pulse animation for the icon
    const scale = React.useRef(new Animated.Value(0.95)).current;
    const opacity = React.useRef(new Animated.Value(0.5)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 0.95, duration: 1000, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(opacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
                ])
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale }], opacity }]}>
                <Icon name="hexagon" size={64} color={colors.primary} />
            </Animated.View>
            <Text variant="body" color="textSecondary" weight="medium" style={{ marginTop: spacing.xl }}>
                Mentis yükleniyor...
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    }
});
