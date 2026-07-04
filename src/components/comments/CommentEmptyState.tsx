import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius } from '../../theme';

interface CommentEmptyStateProps {
    onPress: () => void;
}

export const CommentEmptyState: React.FC<CommentEmptyStateProps> = ({ onPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Icon name="message-square" size={32} color={colors.primary} />
            </View>
            <Text variant="h3" weight="bold" color="textPrimary" style={styles.title}>
                Henüz yorum yapılmamış
            </Text>
            <Text variant="body" color="textSecondary" style={styles.subtitle}>
                Bu tartışmayı başlatan ilk kişi sen ol.
            </Text>
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Text variant="label" weight="bold" color="surface">İlk Yorumu Yaz</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxxl,
        marginTop: spacing.xl,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
    }
});
