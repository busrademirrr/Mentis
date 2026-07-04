import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SidebarNav } from './SidebarNav';
import { RightSidebar } from './RightSidebar';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, spacing, radius } from '../../theme';
import { Icon, Text } from '../ui';
import { TextInput, TouchableOpacity, Image } from 'react-native';

interface WebLayoutProps {
    children: React.ReactNode;
    hideRightSidebar?: boolean;
}

export const WebLayout: React.FC<WebLayoutProps> = ({ children, hideRightSidebar }) => {
    const { isDesktop, isTablet, isLargeDesktop } = useResponsive();

    if (!isDesktop && !isTablet) {
        return <>{children}</>;
    }

    return (
        <View style={styles.background}>
            <View style={[styles.container, isLargeDesktop && styles.containerLarge]}>
                {/* Left Sidebar - Always visible on Desktop & Tablet */}
                <SidebarNav />

                {/* Main Content Area */}
                <View style={styles.mainContent}>
                    {/* Top Navbar Header */}
                    <View style={styles.topNavbar}>
                        <View style={styles.searchContainer}>
                            <Icon name="search" size={18} color={colors.textSecondary} />
                            <TextInput 
                                style={styles.searchInput}
                                placeholder="Mentis'te ara..."
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <View style={styles.navActions}>
                            <TouchableOpacity style={styles.actionIcon} onPress={() => {/* Navigation logic */}}>
                                <Icon name="bell" size={20} color={colors.textPrimary} />
                                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                                    <Text style={styles.badgeText}>3</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionIcon} onPress={() => {/* Navigation logic */}}>
                                <Icon name="message-circle" size={20} color={colors.textPrimary} />
                                <View style={[styles.badge, { backgroundColor: '#8b5cf6' }]}>
                                    <Text style={styles.badgeText}>2</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.profileChip}>
                                <Image source={{ uri: 'https://api.dicebear.com/9.x/micah/png?seed=Felix&backgroundColor=b6e3f4' }} style={styles.profileAvatar} />
                                <View>
                                    <Text variant="caption" weight="bold" color="textPrimary">Immanuel Kant</Text>
                                    <Text variant="caption" color="primary" style={{ fontSize: 10 }}>Altın Lig</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Page Content */}
                    <View style={styles.pageContent}>
                        {children}
                    </View>
                </View>

                {/* Right Sidebar - Hidden on Tablet, visible on Desktop unless disabled */}
                {isDesktop && !hideRightSidebar && <RightSidebar />}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        maxWidth: 1024,
    },
    containerLarge: {
        maxWidth: 1440,
    },
    mainContent: {
        flex: 1,
        height: '100%',
        // On web, we might need to handle scrolling gracefully
        // to keep headers sticky.
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    topNavbar: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        width: 320,
        height: 40,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 14,
        color: colors.textPrimary,
        outlineStyle: 'none' as any,
    },
    navActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.primary,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    badgeText: {
        color: colors.surface,
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        marginLeft: spacing.sm,
    },
    profileAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: spacing.sm,
    },
    pageContent: {
        flex: 1,
    }
});
