import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Animated, TextInput, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, shadows, radius } from '../../theme';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';

export const Header: React.FC = () => {
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === 'web';
    const topInset = isWeb ? 0 : insets.top;

    // Search placeholder animation state
    const placeholders = ['Nietzsche ara...', 'Yapay zeka etiği...', 'Stoacı Akademi...', 'Roma tarihi...'];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const TopbarContent = () => (
        <View style={[styles.innerContainer, { height: 72 + topInset, paddingTop: topInset }]}>
            {/* Search System (Left/Center) */}
            <View style={styles.searchSection}>
                <TouchableOpacity 
                    style={styles.searchBar} 
                    activeOpacity={0.8}
                    // In a real implementation, this opens the floating CMD+K modal
                >
                    <Icon name="Search" size={18} color="textSecondary" />
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

            {/* Interaction System (Right) */}
            <View style={styles.rightSection}>
                {/* Notifications */}
                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                    <Icon name="Bell" size={22} color="textPrimary" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>

                {/* Messages */}
                <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                    <Icon name="MessageSquare" size={22} color="textPrimary" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>

                {/* User Dropdown */}
                <TouchableOpacity style={styles.profileButton} activeOpacity={0.7}>
                    <Image 
                        source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
                        style={styles.avatar} 
                    />
                    <Icon name="ChevronDown" size={16} color="textSecondary" style={{ marginLeft: spacing.xs }} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, styles.absolute]}>
            {Platform.OS === 'web' ? (
                // Web uses standard CSS backdrop-filter via StyleSheet
                <View style={[StyleSheet.absoluteFill, styles.webGlass]} />
            ) : (
                // Native uses expo-blur
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            )}
            <TopbarContent />
            <View style={styles.separator} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        zIndex: 100,
    },
    absolute: {
        ...(Platform.OS === 'web' ? {
            position: 'sticky' as any,
        } : {
            position: 'absolute',
        }),
        top: 0,
        left: 0,
        right: 0,
    },
    webGlass: {
        backgroundColor: colors.surfaceGlass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
    } as any,
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
    },
    searchSection: {
        flex: 1,
        maxWidth: 400,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 40,
        ...shadows.base,
        elevation: 0, // override shadow base elevation for topbar
    },
    searchInput: {
        marginLeft: spacing.sm,
        flex: 1,
    },
    shortcutBadge: {
        backgroundColor: 'rgba(0,0,0,0.04)',
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconButton: {
        padding: spacing.sm,
        borderRadius: radius.circle,
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.surface,
    },
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        marginLeft: spacing.sm,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    separator: {
        height: 1,
        width: '100%',
        backgroundColor: colors.border,
    }
});
