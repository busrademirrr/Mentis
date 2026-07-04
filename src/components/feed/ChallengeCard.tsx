import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { Post } from '../../types/database.types';

export const ChallengeCard = ({ post }: { post: Post }) => {
    const { payload } = post;
    return (
        <View style={styles.container}>
            <View style={styles.textWrap}>
                <Text variant="caption" weight="bold" color="#34d399" style={styles.label}>HAFTALIK CHALLENGE</Text>
                <Text variant="h2" weight="bold" color="surface" style={styles.title}>{payload?.title || 'Bu Hafta: Tarih Meydanı'}</Text>
            </View>
            <View style={styles.boxWrap}>
                <Text variant="h3" weight="bold" color="#fef08a">200 XP</Text>
                <View style={{ marginTop: 8 }}>
                    <Icon name="award" size={32} color="surface" />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1f2937', 
        borderRadius: radius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#374151',
    },
    textWrap: {
        flex: 1,
        paddingRight: spacing.md,
    },
    label: {
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    title: {
        lineHeight: 30,
    },
    boxWrap: {
        backgroundColor: '#374151',
        padding: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
