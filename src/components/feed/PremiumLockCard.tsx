import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { Post } from '../../types/database.types';

interface PremiumLockCardProps {
    post?: Post; // optional, if we still want to use it as a standalone card
    children?: React.ReactNode;
    style?: ViewStyle;
}

export const PremiumLockCard = ({ post, children, style }: PremiumLockCardProps) => {
    return (
        <View style={[styles.container, style]}>
            {/* If children provided, blur them */}
            {children && (
                <View style={styles.childrenContainer}>
                    {children}
                    <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
                </View>
            )}

            {/* Lock Overlay */}
            <View style={children ? styles.overlayContent : styles.standaloneContent}>
                <View style={styles.lockCircle}>
                    <Icon name="lock" size={24} color="#000" />
                </View>
                <Text variant="h2" weight="bold" color="#d97706" style={styles.title}>Premium İçerik</Text>
                <Text variant="body" color={children ? "#1f2937" : "textSecondary"} align="center" style={styles.desc}>
                    Tüm derinlemesine analizlere erişmek için yükseltin.
                </Text>
                
                <TouchableOpacity style={styles.unlockBtn}>
                    <Text variant="label" weight="bold" color="#fbbf24">Kilidi Aç</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.xl,
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    childrenContainer: {
        width: '100%',
    },
    standaloneContent: {
        backgroundColor: '#fffbeb',
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fef3c7',
        borderRadius: radius.lg,
    },
    overlayContent: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: 'rgba(255, 251, 235, 0.4)', // slight yellow tint
    },
    lockCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fbbf24',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    title: {
        marginBottom: spacing.sm,
    },
    desc: {
        lineHeight: 22,
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    unlockBtn: {
        backgroundColor: '#000',
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
    }
});
