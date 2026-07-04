import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme';
import { debateService } from '../../services/debateService';

export const RightSidebar = () => {
    const navigation = useNavigation<any>();
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {
        debateService.getLeaderboard().then(setLeaderboard);
    }, []);

    const suggestedUsers = [
        { id: 'u1', name: 'Zeynep', username: '@zeynep', isOnline: true },
        { id: 'u2', name: 'Nietzsche', username: '@ubermensch', isOnline: true },
        { id: 'u3', name: 'Camus', username: '@absurd', isOnline: false },
    ];

    const activeDebates = [
        { id: 'd1', title: 'Sanat Toplum İçin mi?', participants: 124 },
        { id: 'd2', title: 'Yapay Zeka Sanat Üretebilir mi?', participants: 89 },
    ];

    return (
        <View style={styles.container}>
            {/* WEEKLY CHALLENGE */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Icon name="trending-up" size={20} color={colors.primary} />
                    <Text variant="label" weight="bold" style={styles.cardTitle}>Haftanın Meydan Okuması</Text>
                </View>
                <Text variant="body" color="textSecondary" style={styles.cardDesc}>
                    "Yapay Zeka" kategorisinde 3 tartışmaya katıl ve 500 XP kazan!
                </Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '33%' }]} />
                </View>
                <Text variant="caption" color="textSecondary" style={{marginTop: 4, textAlign: 'right'}}>1/3 Tamamlandı</Text>
            </View>

            {/* ACTIVE DEBATES (Density) */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.liveDotSmall} />
                    <Text variant="label" weight="bold" style={styles.cardTitle}>Sıcak Arenalar</Text>
                </View>
                {activeDebates.map(debate => (
                    <TouchableOpacity key={debate.id} style={styles.activeDebateItem} onPress={() => navigation.navigate('DebateRoom', { debateId: debate.id })}>
                        <Text variant="label" weight="bold" color="textPrimary" numberOfLines={1}>{debate.title}</Text>
                        <View style={styles.participantsRow}>
                            <Icon name="users" size={12} color={colors.textSecondary} />
                            <Text variant="caption" color="textSecondary" style={{marginLeft: 4}}>{debate.participants} aktif</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* WEEKLY TOP DEBATERS (Moved from main screen) */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Icon name="award" size={20} color="#fbbf24" />
                    <Text variant="label" weight="bold" style={styles.cardTitle}>Haftanın Liderleri</Text>
                </View>
                {leaderboard.slice(0, 3).map((u, i) => (
                    <View key={u.id} style={styles.leaderboardRow}>
                        <Text variant="label" weight="bold" color={i === 0 ? '#fbbf24' : (i === 1 ? '#94a3b8' : (i === 2 ? '#b45309' : 'textSecondary'))} style={{width: 20}}>
                            {i + 1}
                        </Text>
                        <View style={styles.lbAvatar}>
                            <Text variant="caption" color="surface" weight="bold">{u.username.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{flex: 1}}>
                            <Text variant="label" weight="bold">{u.username}</Text>
                            <Text variant="caption" color="textSecondary">{u.xp} XP</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* SUGGESTED USERS */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Icon name="users" size={20} color={colors.secondary} />
                    <Text variant="label" weight="bold" style={styles.cardTitle}>Önerilen Kullanıcılar</Text>
                </View>
                {suggestedUsers.map(user => (
                    <View key={user.id} style={styles.userRow}>
                        <View style={styles.avatarWrap}>
                            <View style={styles.avatarPlaceholder}>
                                <Text variant="label" weight="bold" color="surface">{user.name.charAt(0)}</Text>
                            </View>
                            {user.isOnline && <View style={styles.onlineBadge} />}
                        </View>
                        <View style={{flex: 1}}>
                            <Text variant="label" weight="bold">{user.name}</Text>
                            <Text variant="caption" color="textSecondary">{user.username}</Text>
                        </View>
                        <TouchableOpacity style={styles.followBtn}>
                            <Text variant="caption" weight="bold" color="primary">Takip Et</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 320,
        height: '100%',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        position: 'sticky' as any,
        top: 0,
        overflow: 'hidden',
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    cardTitle: {
        marginLeft: spacing.sm,
    },
    cardDesc: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: spacing.sm,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: colors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    liveDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
    },
    activeDebateItem: {
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
    },
    participantsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    lbAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.sm,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarWrap: {
        position: 'relative',
        marginRight: spacing.sm,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    followBtn: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: radius.pill,
    }
});
