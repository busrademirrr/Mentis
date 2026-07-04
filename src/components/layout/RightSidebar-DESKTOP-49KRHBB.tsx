import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Toast from 'react-native-toast-message';
import { useSidebarIntelligence } from '../../hooks/useSidebarIntelligence';
import { Trophy, Medal, Award, TrendingUp, Users, BookOpen, Swords, Target, Compass, Sparkles, Zap, BrainCircuit, Hash } from 'lucide-react-native';
import { followService } from '../../services/followService';

export const KnowledgeHubContent = () => {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const { data, loading, refetch } = useSidebarIntelligence();
    const styles = useStyles();

    const [followStates, setFollowStates] = useState<Record<string, string>>({});

    const handleFollowUser = async (userId: string) => {
        if (!user) return;
        try {
            setFollowStates(prev => ({ ...prev, [userId]: 'loading' }));
            const result = await followService.requestFollow(userId);
            if (result.success) {
                setFollowStates(prev => ({ ...prev, [userId]: result.newStatus }));
                Toast.show({ type: 'success', text1: result.newStatus === 'pending' ? 'Takip isteği gönderildi' : 'Takip ediliyor' });
                // Refetch immediately to remove from recommendations
                refetch();
            } else {
                setFollowStates(prev => ({ ...prev, [userId]: 'none' }));
                Toast.show({ type: 'error', text1: 'Hata', text2: (result as any).error || 'Takip edilemedi' });
            }
        } catch (err) {
            console.error('Follow error:', err);
            setFollowStates(prev => ({ ...prev, [userId]: 'none' }));
        }
    };

    const EmptyState = ({ message, icon: IconComponent }: { message: string, icon: any }) => (
        <View style={styles.emptyBox}>
            <IconComponent size={24} color={colors.textTertiary} style={{ marginBottom: spacing.sm }} />
            <Text variant="body" color="textSecondary" style={{ textAlign: 'center' }}>{message}</Text>
        </View>
    );

    const Skeleton = ({ height, width = '100%', borderRadius = radius.md, style }: any) => (
        <View style={[styles.skeleton, { height, width, borderRadius }, style]} />
    );

    if (loading) {
        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
            </ScrollView>
        );
    }

    const renderMedal = (index: number) => {
        if (index === 0) return <Trophy size={18} color="#FBBF24" />; // Gold
        if (index === 1) return <Medal size={18} color="#94A3B8" />; // Silver
        if (index === 2) return <Award size={18} color="#B45309" />; // Bronze
        return <Text variant="caption" weight="bold" color="textSecondary">#{index + 1}</Text>;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'knowledge_card': return <BookOpen size={14} color={colors.primary} />;
            case 'discussion': return <Users size={14} color="#10B981" />;
            case 'quiz': return <BrainCircuit size={14} color="#8B5CF6" />;
            default: return <Sparkles size={14} color={colors.textSecondary} />;
        }
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>

            {/* 3. RECOMMENDED USERS */}
            <View style={styles.card}>
                <Text variant="label" weight="bold" color="textSecondary" style={styles.cardTitle}>ÖNERİLEN KULLANICILAR</Text>
                {data?.recommendedUsers && data.recommendedUsers.length > 0 ? (
                    <View style={styles.modernBox}>
                        {data.recommendedUsers.map((thinker, idx) => (
                            <View key={thinker.id} style={[styles.thinkerRow, idx !== data.recommendedUsers.length - 1 && styles.suggestedRowBorder]}>
                                <TouchableOpacity style={styles.thinkerInfo} onPress={() => navigation.navigate('Profile', { userId: thinker.id })}>
                                    <Image source={{ uri: thinker.avatar_value || 'https://via.placeholder.com/40' }} style={styles.avatarLarge} />
                                    <View style={{ flex: 1 }}>
                                        <Text variant="body" weight="bold" color="textPrimary">{thinker.username?.split('@')[0] || 'Kullanıcı'}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.followBtn, followStates[thinker.id] && followStates[thinker.id] !== 'none' && followStates[thinker.id] !== 'loading' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]} 
                                    onPress={() => handleFollowUser(thinker.id)}
                                    disabled={followStates[thinker.id] === 'loading' || followStates[thinker.id] === 'accepted' || followStates[thinker.id] === 'pending'}
                                >
                                    {followStates[thinker.id] === 'loading' ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Text variant="caption" weight="bold" color={followStates[thinker.id] && followStates[thinker.id] !== 'none' ? 'textPrimary' : 'background'}>
                                            {followStates[thinker.id] === 'accepted' ? 'Takiptesin' : followStates[thinker.id] === 'pending' ? 'İstek Gönderildi' : 'Takip'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                ) : (
                    <EmptyState message="İlk kullanıcınızı takip edin." icon={Users} />
                )}
            </View>

            {/* 4. TRENDING TOPICS */}
            <View style={styles.card}>
                <Text variant="label" weight="bold" color="textSecondary" style={styles.cardTitle}>TRENDLER (SON 7 GÜN)</Text>
                {data?.trendingTopics && data.trendingTopics.length > 0 ? (
                    <View style={styles.tagCloud}>
                        {data.trendingTopics.map((tag, i) => (
                            <TouchableOpacity 
                                key={i} 
                                style={styles.tagBtn} 
                                onPress={() => navigation.navigate('Feed', { searchQuery: tag.category })}
                            >
                                <Hash size={14} color={colors.textSecondary} />
                                <Text variant="caption" weight="bold" color="textPrimary">{tag.category}</Text>
                                <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>{tag.count} gönderi</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <EmptyState message="Şu an trend olan bir etiket yok." icon={TrendingUp} />
                )}
            </View>

            {/* 5. WEEKLY LEADERBOARD */}
            <View style={styles.card}>
                <Text variant="label" weight="bold" color="textSecondary" style={styles.cardTitle}>HAFTANIN EN İYİ ZİHİNLERİ</Text>
                {data?.leaderboard && data.leaderboard.length > 0 ? (
                    <View style={styles.modernBox}>
                        {data.leaderboard.map((u, idx) => (
                            <TouchableOpacity 
                                key={u.id} 
                                style={[styles.thinkerRow, idx !== data.leaderboard.length - 1 && styles.suggestedRowBorder]} 
                                onPress={() => navigation.navigate('Profile', { userId: u.id })}
                            >
                                <View style={styles.rankBadge}>
                                    {renderMedal(idx)}
                                </View>
                                <Image source={{ uri: u.avatar_value || 'https://via.placeholder.com/40' }} style={styles.avatar} />
                                <View style={{ flex: 1 }}>
                                    <Text variant="body" weight="bold" color="textPrimary">{u.username?.split('@')[0] || 'Kullanıcı'}</Text>
                                </View>
                                <View style={styles.scoreBadge}>
                                    <Text variant="caption" weight="bold" color="surface">{u.arena_elo}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <EmptyState message="Henüz bu hafta liderlik tablosunda kimse yok." icon={Trophy} />
                )}
            </View>

        </ScrollView>
    );
};

export const RightSidebar = () => {
    const styles = useStyles();
    return (
        <View style={styles.container}>
            <KnowledgeHubContent />
        </View>
    );
};

function useStyles() { return StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        paddingVertical: spacing.xl,
        paddingLeft: spacing.xxl,
        paddingRight: spacing.xl,
        backgroundColor: colors.background,
        ...(Platform.OS === 'web' && { position: 'sticky', top: 0 } as any),
    },
    card: {
        marginBottom: spacing.xxl,
    },
    cardTitle: {
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    modernBox: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    emptyBox: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    skeleton: {
        backgroundColor: colors.borderHighlight,
        opacity: 0.5,
    },
    thinkerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    contentIconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    suggestedRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
    },
    rankBadge: {
        width: 24,
        alignItems: 'center',
        marginRight: 8,
    },
    thinkerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
        backgroundColor: colors.background,
    },
    avatarLarge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.sm,
        backgroundColor: colors.background,
    },
    scoreBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.pill,
    },
    followBtn: {
        backgroundColor: colors.textPrimary,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
        marginLeft: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    tagCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tagBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    statBox: {
        flex: 1,
        minWidth: 70,
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    }
}); }
