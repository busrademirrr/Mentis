import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';

export const ProfileCognitiveAnalysis = () => {
    const traits = [
        'Analitik Düşünen',
        'Varoluşçu',
        'Tarihsel Stratejist',
        'Eleştirel Okur'
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Icon name="cpu" size={20} color="#8b5cf6" style={styles.headerIcon} />
                <Text variant="h3" weight="bold" color="textPrimary">Bilişsel Profil (AI Analizi)</Text>
            </View>

            <View style={styles.list}>
                {traits.map((trait, index) => (
                    <View key={index} style={styles.pill}>
                        <Text variant="body" weight="bold" color="#8b5cf6">{trait}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerIcon: {
        marginRight: spacing.sm,
    },
    list: {
        gap: spacing.sm,
    },
    pill: {
        backgroundColor: '#faf5ff',
        borderWidth: 1,
        borderColor: '#d8b4fe',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
    }
});
