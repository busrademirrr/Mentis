import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '../ui/BrandLogo';
import { useNotifications } from '../../context/NotificationContext';

const NAV_ITEMS = [
    { name: 'Akış', icon: 'layers', route: 'Akış' },
    { name: 'Üret', icon: 'plus-square', route: 'Üret' },
    { name: 'Arena', icon: 'award', route: 'Arena' },
    { name: 'Mesajlar', icon: 'message-square', route: 'Mesajlar' },
    { name: 'Bildirimler', icon: 'bell', route: 'Bildirimler' },
    { name: 'Profil', icon: 'user', route: 'Profil' },
    { name: 'Kaydedilenler', icon: 'bookmark', route: 'Saved' },
    { name: 'Ayarlar', icon: 'settings', route: 'Ayarlar' },
];

const TAB_SCREENS = ['Akış', 'Üret', 'Arena', 'Mesajlar', 'Ayarlar', 'Bildirimler', 'Profil'];

export const SidebarNav = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { unreadCount } = useNotifications();

    const handleNavigation = (routeName: string) => {
        if (TAB_SCREENS.includes(routeName)) {
            navigation.navigate('Main', { screen: routeName });
        } else {
            navigation.navigate(routeName);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <BrandLogo variant="primary" size={32} />
                <Text variant="h2" weight="bold" style={styles.logoText}>Mentis</Text>
            </View>

            <View style={styles.navLinks}>
                {NAV_ITEMS.map((item) => {
                    const isActive = route.name === item.route;
                    return (
                        <Pressable
                            key={item.route}
                            onPress={() => handleNavigation(item.route)}
                            // @ts-ignore
                            style={({ hovered }) => [
                                styles.navItem,
                                isActive && styles.navItemActive,
                                hovered && !isActive && styles.navItemHovered,
                            ]}
                        >
                            <View style={[styles.activeIndicator, isActive && styles.activeIndicatorVisible]} />
                            <Icon 
                                name={item.icon} 
                                size={20} 
                                color={isActive ? 'primary' : 'textSecondary'} 
                            />
                            <Text 
                                variant="body" 
                                weight={isActive ? 'semibold' : 'medium'}
                                color={isActive ? 'textPrimary' : 'textSecondary'}
                                style={styles.navText}
                            >
                                {item.name}
                            </Text>
                            {item.route === 'Notifications' && unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text variant="caption" weight="bold" color="surface">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 260,
        height: '100%',
        paddingVertical: spacing.xxl,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        backgroundColor: colors.background,
        position: 'sticky' as any,
        top: 0,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xxxl,
        paddingHorizontal: spacing.xl,
    },
    logoMark: {
        width: 32,
        height: 32,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logoText: {
        marginLeft: spacing.sm,
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    navLinks: {
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        position: 'relative',
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
            transition: 'all 0.15s ease',
        } as any),
    },
    navItemHovered: {
        backgroundColor: colors.surfaceHover || 'rgba(0,0,0,0.02)',
    },
    navItemActive: {
        backgroundColor: colors.primaryLight,
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: '25%',
        bottom: '25%',
        width: 3,
        backgroundColor: colors.primary,
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
        opacity: 0,
    },
    activeIndicatorVisible: {
        opacity: 1,
    },
    navText: {
        marginLeft: spacing.md,
        flex: 1,
    },
    badge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
