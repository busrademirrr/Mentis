import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const NAV_ITEMS = [
    { name: 'Akış', icon: 'Layers', route: 'Akış' },
    { name: 'Üret', icon: 'PlusSquare', route: 'Üret' },
    { name: 'Arena', icon: 'Trophy', route: 'Arena' },
    { name: 'Profil', icon: 'UserCircle', route: 'Profil' },
    { name: 'Kütüphanem', icon: 'Library', route: 'Saved' },
    { name: 'Ayarlar', icon: 'Settings2', route: 'Settings' },
];

const TAB_SCREENS = ['Akış', 'Üret', 'Arena', 'Profil'];

export const SidebarNav = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();

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
                {/* Premium Geometric Logo */}
                <View style={styles.logoMark}>
                    <LinearGradient
                        colors={colors.gradients.premium as any}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <Icon name="Box" size={18} color="#FFFFFF" />
                </View>
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
});
