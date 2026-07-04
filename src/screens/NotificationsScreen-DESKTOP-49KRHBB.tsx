import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { Text, Icon } from '../components/ui';
import { Screen } from '../components/layout';
import { MentisNotification, getNotificationsV2, markAllAsRead, markAsRead, NotificationType } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { followService } from '../services/followService';
import Toast from 'react-native-toast-message';

type TabType = 'all' | 'message' | 'arena' | 'follow' | 'system' | 'achievement';

const TABS: { id: TabType; label: string }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'message', label: 'Mesajlar' },
    { id: 'arena', label: 'Arena' },
    { id: 'follow', label: 'Takipçiler' },
    { id: 'system', label: 'Sistem' },
    { id: 'achievement', label: 'Başarımlar' }
];

export const NotificationsScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { refreshUnreadCount } = useNotifications();
    const styles = useStyles();
    const [notifications, setNotifications] = useState<MentisNotification[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    
    // Pagination & Loading
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    const fetchNotifications = async (isLoadMore = false) => {
        if (!user) return;
        
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            const cursor = isLoadMore && notifications.length > 0 
                ? notifications[notifications.length - 1].created_at 
                : null;

            const newNotifs = await getNotificationsV2(PAGE_SIZE, cursor);

            if (newNotifs.length < PAGE_SIZE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            if (isLoadMore) {
                setNotifications(prev => [...prev, ...newNotifs]);
            } else {
                setNotifications(newNotifs);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [user])
    );

    useEffect(() => {
        if (!user) return;
        const channel = supabase.channel(`notifications_screen_${user.id}_${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
                fetchNotifications(); // Refresh top
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && !loading) {
            fetchNotifications(true);
        }
    };

    const handleMarkAllAsRead = async () => {
        const success = await markAllAsRead();
        if (success) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            refreshUnreadCount();
        }
    };

    const handleAcceptFollow = async (actorId: string | null, notificationId: string) => {
        if (!actorId) return;
        const success = await followService.acceptRequest(actorId);
        if (success) {
            Toast.show({ type: 'success', text1: 'İstek kabul edildi' });
            // Hide action buttons by changing notification type locally to 'follow'
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, type: 'follow', body: 'Takip isteğini kabul ettiniz.' } : n));
        }
    };

    const handleRejectFollow = async (actorId: string | null, notificationId: string) => {
        if (!actorId) return;
        const success = await followService.rejectRequest(actorId);
        if (success) {
            Toast.show({ type: 'info', text1: 'İstek reddedildi' });
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }
    };

    const handlePress = async (item: MentisNotification) => {
        if (!item.is_read) {
            await markAsRead(item.id);
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
            refreshUnreadCount();
        }

        // Deep linking logic
        switch (item.type) {
            case 'message':
            case 'message_request':
            case 'unread_reminder':
                // Pass reference_id as conversationId
                navigation.navigate('Chat', { partnerId: item.actor_id });
                break;
            case 'follow':
            case 'follow_request':
            case 'follow_accepted':
                navigation.navigate('Profile', { userId: item.actor_id });
                break;
            case 'arena_match_found':
            case 'arena_won':
            case 'arena_lost':
            case 'arena_promotion':
                navigation.navigate('Arena');
                break;
            case 'achievement':
                navigation.navigate('Badges');
                break;
            case 'system':
                // Maybe open a modal or just show the text inline
                break;
        }
    };

    const getIcon = (type: NotificationType): { name: any; color: string } => {
        switch (type) {
            case 'message':
            case 'message_request':
            case 'unread_reminder':
                return { name: 'message-square', color: '#3b82f6' };
            case 'arena_match_found':
            case 'arena_won':
            case 'arena_lost':
            case 'arena_promotion':
                return { name: 'crosshair', color: '#ef4444' };
            case 'achievement':
                return { name: 'award', color: '#f59e0b' };
            case 'follow': 
            case 'follow_request':
            case 'follow_accepted':
                return { name: 'user-plus', color: '#10b981' };
            case 'system':
                return { name: 'info', color: '#8b5cf6' };
            default: 
                return { name: 'bell', color: colors.textSecondary };
        }
    };

    const formatTime = (isoString: string) => {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            
            if (diffInSeconds < 60) return `${diffInSeconds}sn önce`;
            
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `${diffInMinutes}dk önce`;
            
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours}s önce`;
            
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}g önce`;
        } catch {
            return '';
        }
    };

    // Filter logic (Now only 'all' is used, keeping for reference if needed later)
    const filteredNotifications = notifications;

    const renderItem = ({ item }: { item: MentisNotification }) => {
        const iconInfo = getIcon(item.type);
        const avatarUri = item.actor?.avatar_url || 'https://api.dicebear.com/9.x/micah/png?seed=' + (item.actor?.username || item.id);

        return (
            <TouchableOpacity 
                style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
                onPress={() => handlePress(item)}
                activeOpacity={0.8}
            >
                <View style={[styles.cardLeftBorder, { backgroundColor: !item.is_read ? colors.primary : 'transparent' }]} />
                
                <View style={styles.cardContent}>
                    <TouchableOpacity 
                        style={styles.avatarContainer} 
                        onPress={(e) => {
                            if (item.actor_id) {
                                e.stopPropagation();
                                navigation.navigate('Profile', { userId: item.actor_id });
                            }
                        }}
                    >
                        {item.actor_id ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.iconContainer, { backgroundColor: `${iconInfo.color}15` }]}>
                                <Icon name={iconInfo.name} size={20} color={iconInfo.color} />
                            </View>
                        )}
                        
                        {item.actor_id && (
                            <View style={[styles.badgeIcon, { backgroundColor: iconInfo.color }]}>
                                <Icon name={iconInfo.name} size={10} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                            <Text variant="body" weight={!item.is_read ? 'bold' : 'medium'} color="textPrimary" style={{ flex: 1, paddingRight: 8 }}>
                                {item.actor && <Text weight="bold">{item.actor.name} </Text>}
                                {item.title}
                            </Text>
                            <Text variant="caption" color="textTertiary" style={styles.timeText}>
                                {formatTime(item.created_at)}
                            </Text>
                        </View>
                        {item.body ? (
                            <Text variant="caption" color="textSecondary" style={{ marginTop: 4, lineHeight: 18 }}>
                                {item.body}
                            </Text>
                        ) : null}
                        
                        {item.type === 'follow_request' && (
                            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                                <TouchableOpacity 
                                    style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' }}
                                    onPress={(e) => { e.stopPropagation(); handleAcceptFollow(item.actor_id, item.id); }}
                                >
                                    <Text variant="label" weight="bold" color="surface">Kabul Et</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderHighlight, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center' }}
                                    onPress={(e) => { e.stopPropagation(); handleRejectFollow(item.actor_id, item.id); }}
                                >
                                    <Text variant="label" weight="bold" color="textPrimary">Reddet</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderTabs = () => (
        <View style={styles.tabsWrapper}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={TABS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.tabsContainer}
                renderItem={({ item }) => {
                    const isActive = activeTab === item.id;
                    return (
                        <TouchableOpacity
                            style={[styles.tab, isActive && styles.tabActive]}
                            onPress={() => setActiveTab(item.id)}
                        >
                            <Text variant="body" weight={isActive ? 'bold' : 'medium'} color={isActive ? 'textPrimary' : 'textSecondary'}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );

    return (
        <Screen withSafeTop backgroundColor="background" style={[styles.safeArea, { paddingHorizontal: 0 }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Bildirimler</Text>
                </View>
                <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllAsRead}>
                    <Icon name="check-circle" size={16} color={colors.primary} />
                    <Text variant="caption" weight="bold" color="primary" style={{ marginLeft: 4 }}>Tümünü Okundu İşaretle</Text>
                </TouchableOpacity>
            </View>

            {loading && notifications.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator color={colors.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator color={colors.primary} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconWrapper}>
                                <Icon name="bell-off" size={48} color={colors.textTertiary} />
                            </View>
                            <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
                                Henüz bildirimin bulunmuyor
                            </Text>
                            <Text color="textSecondary" style={{ textAlign: 'center', maxWidth: 300 }}>
                                Mesajlar, düellolar ve takipçiler burada görünecek.
                            </Text>
                        </View>
                    }
                />
            )}
        </Screen>
    );
};

function useStyles() { return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.borderHighlight,
        backgroundColor: colors.surface,
    },
    backBtn: { padding: spacing.xs, marginRight: spacing.sm },
    headerTitle: { fontSize: typography.sizes.xl, fontWeight: 'bold', color: colors.textPrimary },
    markReadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderRadius: radius.md,
        paddingHorizontal: spacing.sm,
    },
    tabsWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        backgroundColor: colors.surface,
    },
    tabsContainer: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },
    tab: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        marginHorizontal: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: 'transparent',
    },
    tabActive: {
        backgroundColor: colors.borderHighlight,
    },
    listContent: { padding: spacing.md, paddingBottom: 100 },
    notificationCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        overflow: 'hidden',
        ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.2s' } as any : {})
    },
    unreadCard: {
        backgroundColor: 'rgba(124, 58, 237, 0.03)',
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    cardLeftBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    cardContent: {
        flexDirection: 'row',
        padding: spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.borderHighlight,
    },
    iconContainer: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center',
    },
    badgeIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    textContainer: { flex: 1, justifyContent: 'center' },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    timeText: { 
        marginTop: 2,
        minWidth: 60,
        textAlign: 'right'
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyIconWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    }
}); }
