import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme';
import { Button, Icon, Text } from '../components/ui';
import { Screen } from '../components/layout';
import { useResponsive } from '../hooks/useResponsive';

import { InfoCardForm } from '../components/creator/InfoCardForm';
import { DebateForm } from '../components/creator/DebateForm';
import { QuizForm } from '../components/creator/QuizForm';

type ContentType = 'info' | 'debate' | 'quiz';

export const CreatorScreen = () => {
    const [contentType, setContentType] = useState<ContentType>('info');
    const [isSaving, setIsSaving] = useState(false);
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);

    const tabs: { id: ContentType; label: string; icon: any }[] = [
        { id: 'info', label: 'Bilgi Kartı', icon: 'file-text' },
        { id: 'debate', label: 'Tartışma', icon: 'message-circle' },
        { id: 'quiz', label: 'Mini Quiz', icon: 'check-circle' },
    ];

    const renderForm = () => {
        switch (contentType) {
            case 'info':
                return <InfoCardForm />;
            case 'debate':
                return <DebateForm />;
            case 'quiz':
                return <QuizForm />;
            default:
                return null;
        }
    };

    // Simulated Draft Autosave
    useEffect(() => {
        const interval = setInterval(() => {
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 1000); // Simulate network request
        }, 30000); // Auto save every 30 seconds
        return () => clearInterval(interval);
    }, [contentType]);

    // Keyboard Shortcuts (Web)
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        const handleKeyDown = (e: any) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                // Simulate publish
                console.log('Publishing via keyboard shortcut...');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const renderRightPanel = () => (
        <View style={styles.rightPanel}>
            {/* Content Tips */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text variant="label" weight="bold" color="textPrimary">İçerik İpuçları</Text>
                </View>
                <View style={styles.tipRow}>
                    <Icon name="check-circle" size={16} color={colors.primary} />
                    <Text variant="caption" color="textSecondary" style={styles.tipText}>Net ve ilgi çekici başlıklar kullanın</Text>
                </View>
                <View style={styles.tipRow}>
                    <Icon name="check-circle" size={16} color={colors.primary} />
                    <Text variant="caption" color="textSecondary" style={styles.tipText}>Güvenilir kaynaklardan bilgiler paylaşın</Text>
                </View>
                <View style={styles.tipRow}>
                    <Icon name="check-circle" size={16} color={colors.primary} />
                    <Text variant="caption" color="textSecondary" style={styles.tipText}>Topluluğa değer katacak içerikler üretin</Text>
                </View>
                <View style={styles.tipRow}>
                    <Icon name="check-circle" size={16} color={colors.primary} />
                    <Text variant="caption" color="textSecondary" style={styles.tipText}>Görsel kullanmak etkileşimi artırır</Text>
                </View>
            </View>

            {/* Community Rules */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text variant="label" weight="bold" color="textPrimary">Topluluk Kuralları</Text>
                </View>
                <View style={styles.tipRow}>
                    <Icon name="shield" size={16} color={colors.secondary} />
                    <Text variant="caption" color="textSecondary" style={styles.tipText}>Saygılı ve yapıcı olun</Text>
                </View>
                <View style={styles.tipRow}>
                    <Icon name="shield" size={16} color={colors.secondary} />
                    <Text variant="caption" color="textSecondary" style={styles.tipText}>Telif hakkına dikkat edin</Text>
                </View>
                <View style={styles.tipRow}>
                    <Icon name="shield" size={16} color={colors.error} />
                    <Text variant="caption" color="textSecondary" style={styles.tipText}>Yanıltıcı bilgi paylaşmayın</Text>
                </View>
                <TouchableOpacity style={{ marginTop: spacing.sm }}>
                    <Text variant="caption" weight="bold" color="primary">Tüm kuralları görüntüle →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderMainContent = () => (
        <>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text variant="h1" weight="bold" color="textPrimary" style={styles.headerTitle}>İçerik Üret</Text>
                    {isSaving && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="loader" size={14} color={colors.textTertiary} />
                            <Text variant="caption" color="textTertiary" style={{ marginLeft: 4 }}>Taslak kaydediliyor...</Text>
                        </View>
                    )}
                </View>
                <Text variant="body" color="textSecondary" style={styles.headerDesc}>Mentis topluluğu ile bilgini paylaş, tartışma başlat.</Text>
            </View>

            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                    {tabs.map((tab) => {
                        const isActive = contentType === tab.id;
                        return (
                            <TouchableOpacity 
                                key={tab.id} 
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => setContentType(tab.id)}
                                activeOpacity={0.7}
                            >
                                <Icon name={tab.icon} size={18} color={isActive ? colors.surface : colors.textSecondary} />
                                <Text variant="body" weight={isActive ? 'bold' : 'medium'} style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderForm()}
            </ScrollView>
        </>
    );

    return (
        <Screen padding="none" backgroundColor="background" hideRightSidebar={true}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                
                {isWebDesktop ? (
                    <View style={styles.desktopSplitLayout}>
                        <View style={styles.desktopMainContent}>
                            {renderMainContent()}
                        </View>
                        <View style={styles.desktopRightPanelWrapper}>
                            {renderRightPanel()}
                        </View>
                    </View>
                ) : (
                    renderMainContent()
                )}

                {/* Fixed Bottom Action Bar */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.previewButton}>
                        <Icon name="eye" size={20} color={colors.primary} />
                        <Text style={styles.previewButtonText}>Önizleme</Text>
                    </TouchableOpacity>

                    <LinearGradient
                        colors={['#8b5cf6', '#a855f7']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.publishGradient}
                    >
                        <TouchableOpacity style={styles.publishButton} activeOpacity={0.8}>
                            <Icon name="send" size={18} color={colors.surface} />
                            <Text style={styles.publishText}>Hemen Yayınla</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    headerTitle: {
        fontSize: typography.sizes.xxl,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        letterSpacing: -0.5,
    },
    headerDesc: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
    },
    tabContainer: {
        marginBottom: spacing.md,
    },
    tabScroll: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xs,
        gap: spacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        shadowOpacity: 0,
    },
    tabText: {
        marginLeft: spacing.sm,
    },
    tabTextActive: {
        color: colors.surface,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 120, // Space for bottom bar + tab bar
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0, 
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        padding: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    previewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.background,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
    },
    previewButtonText: {
        marginLeft: spacing.xs,
        fontSize: typography.sizes.md,
        fontWeight: '600',
        color: colors.primary,
    },
    publishGradient: {
        borderRadius: radius.pill,
    },
    publishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    publishText: {
        marginLeft: spacing.sm,
        fontSize: typography.sizes.md,
        fontWeight: '700',
        color: colors.surface,
    },
    desktopSplitLayout: {
        flexDirection: 'row',
        flex: 1,
        height: '100%',
    },
    desktopMainContent: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: colors.borderHighlight,
    },
    desktopRightPanelWrapper: {
        width: 320,
        backgroundColor: colors.background,
    },
    rightPanel: {
        padding: spacing.lg,
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
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    tipText: {
        marginLeft: spacing.sm,
        flex: 1,
    }
});
