import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../../theme';
import { Text, Card, Icon } from '../ui';
import { User, UserBadge } from '../../types/database.types';
import { TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface ProfileLevelCardProps {
    user: User;
    badges: UserBadge[];
}

export const ProfileLevelCard: React.FC<ProfileLevelCardProps> = ({ user, badges }) => {
    const nextLevelXp = user.level * 1000;
    const progress = (user.xp / nextLevelXp) * 100;
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {/* XP / Level Card */}
            <View style={styles.cardBlock}>
                <View style={styles.badgeContainer}>
                    <Icon name="target" size={14} color={colors.primary} style={styles.goldIcon} />
                    <Text variant="caption" weight="bold" color="textPrimary">Seviye {user.level}</Text>
                </View>

                <View style={styles.levelHeader}>
                    <Text variant="label" weight="bold" color="textPrimary">{user.xp} / {nextLevelXp} XP</Text>
                </View>

                <View style={styles.progressBarBg}>
                    <LinearGradient 
                        colors={['#8b5cf6', '#c084fc']} 
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} 
                    />
                </View>

                <Text variant="caption" color="textSecondary" style={styles.footerText}>
                    Bu hafta <Text variant="caption" weight="bold" color="#10b981">+320 XP</Text> kazandın!
                </Text>

                <TouchableOpacity style={styles.statsBtn} onPress={() => navigation.navigate('Activity')}>
                    <Text variant="caption" weight="bold" color="primary">Tüm İstatistikler</Text>
                </TouchableOpacity>
            </View>

            {/* Badges Block */}
            <View style={[styles.cardBlock, { marginTop: spacing.lg }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                    <Text variant="label" weight="bold" color="textPrimary">Rozetler</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Badges')}>
                        <Text variant="caption" weight="bold" color="primary">Tümünü Gör</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.badgesRow}>
                    <View style={[styles.badgeHex, { borderColor: '#d97706', backgroundColor: '#fef3c7' }]}>
                        <Icon name="award" size={24} color="#d97706" />
                    </View>
                    <View style={[styles.badgeHex, { borderColor: '#8b5cf6', backgroundColor: '#f3e8ff' }]}>
                        <Icon name="shield" size={24} color="#8b5cf6" />
                    </View>
                    <View style={[styles.badgeHex, { borderColor: '#10b981', backgroundColor: '#d1fae5' }]}>
                        <Icon name="book" size={24} color="#10b981" />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.xxl,
    },
    cardBlock: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    goldIcon: {
        marginRight: spacing.sm,
    },
    levelHeader: {
        marginBottom: spacing.xs,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: colors.background,
        borderRadius: radius.pill,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: radius.pill,
    },
    footerText: {
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    statsBtn: {
        backgroundColor: colors.background,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: radius.md,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'all 0.2s' } as any),
    },
    badgesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.sm,
    },
    badgeHex: {
        width: 56,
        height: 64,
        borderRadius: 8,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '30deg' }], // Simple hex illusion
    }
});
