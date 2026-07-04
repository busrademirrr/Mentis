import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { WebLayout } from './WebLayout';
import { useResponsive } from '../../hooks/useResponsive';
import { Platform } from 'react-native';

export interface ScreenProps extends ViewProps {
    children: React.ReactNode;
    withSafeTop?: boolean;
    withSafeBottom?: boolean;
    padding?: keyof typeof spacing | 'none';
    backgroundColor?: keyof typeof colors;
    hideRightSidebar?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
    children,
    withSafeTop = true,
    withSafeBottom = true,
    padding = 'md',
    backgroundColor = 'background',
    hideRightSidebar,
    style,
    ...props
}) => {
    const { isDesktop, isTablet } = useResponsive();
    
    const edges: Edge[] = ['left', 'right'];
    // On web, we typically don't need safe area insets from devices
    if (Platform.OS !== 'web') {
        if (withSafeTop) edges.push('top');
        // We omit 'bottom' by default since Tab Navigator handles it, 
        // but if requested we can add it. Often bottoms cause double padding with tabs.
        if (withSafeBottom) edges.push('bottom');
    }

    const containerStyle = {
        flex: 1,
        backgroundColor: colors[backgroundColor as keyof typeof colors] as string || backgroundColor,
        paddingHorizontal: padding === 'none' ? 0 : spacing[padding],
    };

    const content = (
        <SafeAreaView edges={edges} style={[containerStyle, style]} {...props}>
            {children}
        </SafeAreaView>
    );

    // If we're on a large screen, wrap the entire screen content in WebLayout
    if (Platform.OS === 'web' && (isDesktop || isTablet)) {
        return <WebLayout hideRightSidebar={hideRightSidebar}>{content}</WebLayout>;
    }

    return content;
};
