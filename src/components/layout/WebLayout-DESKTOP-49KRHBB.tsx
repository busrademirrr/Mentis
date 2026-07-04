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
                {/* Left Sidebar - Always visible on Desktop & Tablet (Fixed 260px) */}
                <SidebarNav />

                {/* Content Area (Split 65% / 35%) */}
                <View style={styles.contentWrapper}>
                    {/* Main Content (Feed) - 65% */}
                    <View style={[styles.mainContent, hideRightSidebar && styles.mainContentFull]}>
                        <View style={styles.pageContent}>
                            {children}
                        </View>
                    </View>

                    {/* Right Sidebar - 35% */}
                    {isDesktop && !hideRightSidebar && (
                        <View style={styles.rightSidebarWrapper}>
                            <RightSidebar />
                        </View>
                    )}
                </View>
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
        maxWidth: 1200, // Slightly wider to accommodate new feed layout
    },
    containerLarge: {
        maxWidth: 1440,
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
        height: '100%',
    },
    mainContent: {
        flex: 6.5, // 65% width
        height: '100%',
        borderRightWidth: 1,
        borderRightColor: colors.borderHighlight,
        backgroundColor: colors.background,
    },
    mainContentFull: {
        flex: 1, // 100% if right sidebar is hidden
        borderRightWidth: 0,
    },
    rightSidebarWrapper: {
        flex: 3.5, // 35% width
        height: '100%',
        backgroundColor: colors.background,
    },
    pageContent: {
        flex: 1,
    }
});
