import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadows, radius } from '../../theme';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

// Import new modals
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDrawer } from './NotificationDrawer';
import { ProfileDropdown } from './ProfileDropdown';

export const Header: React.FC = () => {
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === 'web';
    const topInset = isWeb ? 0 : insets.top;
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    // States
    const [searchVisible, setSearchVisible] = useState(false);
    const [notificationsVisible, setNotificationsVisible] = useState(false);
    const [profileVisible, setProfileVisible] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const profileRef = useRef<any>(null);
    const [profileAnchor, setProfileAnchor] = useState<any>(null);

    // Search placeholder animation state
    const placeholders = ['Mentis ekosisteminde ara...', 'Yapay zeka etiği...', 'Stoacılık 101...', 'CMD + K ile hızlı ara'];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        
        const loadUnread = async () => {
            const { count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .is('read_at', null);
            setUnreadNotifications(count || 0);
        };
        
        loadUnread();

        const channel = supabase.channel(`header-notifications-${user.id}_${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
                setUnreadNotifications(prev => prev + 1);
            }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    const openProfile = () => {
        if (profileRef.current && profileRef.current.measure) {
            profileRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                setProfileAnchor({ x: px, y: py, width, height });
                setProfileVisible(true);
            });
        } else {
            setProfileVisible(true);
        }
    };

    const TopbarContent = () => (
        <View style={[styles.innerContainer, { height: 72 + topInset, paddingTop: topInset }]}>
            {/* Search System */}
            <View style={styles.searchSection}>
                <TouchableOpacity 
                    style={styles.searchBar} 
                    activeOpacity={0.8}
                    onPress={() => setSearchVisible(true)}
                >
                    <Icon name="search" size={18} color="textSecondary" />
                    <Text variant="body" color="textSecondary" style={styles.searchInput}>
                        {placeholders[placeholderIndex]}
                    </Text>
                    {isWeb && (
                        <View style={styles.shortcutBadge}>
                            <Text variant="caption" color="textTertiary" weight="semibold">⌘ K</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Interaction System */}
            <View style={styles.rightSection}>
                {/* Notifications */}
                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => setNotificationsVisible(true)}>
                    <Icon name="bell" size={22} color="textPrimary" />
                    {unreadNotifications > 0 && <View style={styles.notificationBadge} />}
                </TouchableOpacity>

                {/* Messages */}
                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => navigation.navigate('Messages')}>
                    <Icon name="message-square" size={22} color="textPrimary" />
                </TouchableOpacity>

                {/* User Dropdown */}
                <TouchableOpacity 
                    ref={profileRef}
                    style={styles.profileButton} 
                    activeOpacity={0.7}
                    onPress={openProfile}
                >
                    <Image 
                        source={{ uri: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=11' }} 
                        style={styles.avatar} 
                    />
                    <Icon name="chevron-down" size={16} color="textSecondary" style={{ marginLeft: spacing.xs }} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <>
            <View style={[styles.container, styles.absolute]}>
                {Platform.OS === 'web' ? (
                    <View style={[StyleSheet.absoluteFill, styles.webGlass]} />
                ) : (
                    <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                )}
                <TopbarContent />
                <View style={styles.separator} />
            </View>

            <GlobalSearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} />
            <NotificationDrawer visible={notificationsVisible} onClose={() => { setNotificationsVisible(false); setUnreadNotifications(0); }} />
            <ProfileDropdown visible={profileVisible} onClose={() => setProfileVisible(false)} anchorRect={profileAnchor} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 100,
    },
    absolute: {
        ...(Platform.OS === 'web' ? { position: 'sticky' as any } : { position: 'absolute' }),
        top: 0, left: 0, right: 0,
    },
    webGlass: {
        backgroundColor: colors.surfaceGlass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
    } as any,
    innerContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl,
    },
    searchSection: {
        flex: 1, maxWidth: 400,
    },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderRadius: radius.md,
        paddingHorizontal: spacing.md, height: 40, ...shadows.base, elevation: 0,
    },
    searchInput: {
        marginLeft: spacing.sm, flex: 1,
    },
    shortcutBadge: {
        backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm,
    },
    rightSection: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    },
    iconButton: {
        padding: spacing.sm, borderRadius: radius.circle, position: 'relative',
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any)
    },
    notificationBadge: {
        position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4,
        backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface,
    },
    profileButton: {
        flexDirection: 'row', alignItems: 'center', padding: spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: radius.pill,
        borderWidth: 1, borderColor: colors.border, marginLeft: spacing.sm,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any)
    },
    avatar: {
        width: 32, height: 32, borderRadius: 16,
    },
    separator: {
        height: 1, width: '100%', backgroundColor: colors.borderHighlight,
    }
});
