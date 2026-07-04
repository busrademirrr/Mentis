import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../components/layout';
import { Text, MentisLogo } from '../components/ui';
import { colors, spacing } from '../theme';

export const DiscoverScreen = () => {
    const styles = useStyles();
    return (
        <Screen backgroundColor="background" withSafeTop style={styles.container}>
            <MentisLogo size={48} variant="primary" />
            <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.xl }}>Keşfet</Text>
            <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                Mentis ağındaki en yeni entelektüel toplulukları ve fikirleri keşfedin. (Yakında)
            </Text>
        </Screen>
    );
};

function useStyles() { return StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    }
}); }
