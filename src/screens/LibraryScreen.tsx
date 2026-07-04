import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing } from '../theme';

export const LibraryScreen = () => {
    return (
        <Screen backgroundColor="background" withSafeTop style={styles.container}>
            <Icon name="bookmark" size={48} color={colors.primary} />
            <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.xl }}>Kütüphane</Text>
            <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                Kaydettiğiniz bilgi kartları, katıldığınız tartışmalar ve arşiviniz burada yer alacak. (Yakında)
            </Text>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    }
});
