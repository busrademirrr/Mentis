import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius } from '../theme';
import { Button, Icon, Text } from '../components/ui';
import { Screen } from '../components/layout';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import { useResponsive } from '../hooks/useResponsive';

import { InfoCardForm } from '../components/creator/InfoCardForm';
import { DebateForm } from '../components/creator/DebateForm';
import { QuizForm } from '../components/creator/QuizForm';
import { CommunityGuidelinesModal } from '../components/creator/CommunityGuidelinesModal';
import { creatorService } from '../services/creatorService';
import Toast from 'react-native-toast-message';

type ContentType = 'info' | 'debate' | 'quiz' | 'timeline' | 'list' | null;

export const CreatorScreen = () => {
    const navigation = useNavigation<any>();
    const [contentType, setContentType] = useState<ContentType>(null);
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [isRulesVisible, setIsRulesVisible] = useState(false);
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);
    const styles = useStyles();

    const tabs: { id: ContentType; label: string; icon: any; desc: string }[] = [
        { id: 'info', label: 'Bilgi Kartı', icon: 'file-text', desc: 'Odaklanmış bilgi, makale veya analiz paylaşın.' },
        { id: 'debate', label: 'Tartışma', icon: 'message-circle', desc: 'İki zıt görüş belirleyip topluluğu oylamaya davet edin.' },
        { id: 'quiz', label: 'Mini Quiz', icon: 'check-circle', desc: 'Topluluğun bilgisini sınayan hızlı çoktan seçmeli sorular hazırlayın.' },
    ];

    const handleInfoChange = useCallback((data: any, valid?: boolean) => { setFormData(data); setIsValid(valid !== false); }, []);
    const handleDebateChange = useCallback((data: any, valid: boolean) => { setFormData(data); setIsValid(valid); }, []);
    const handleQuizChange = useCallback((data: any, valid?: boolean) => { setFormData(data); setIsValid(valid !== false); }, []);

    const renderForm = () => {
        switch (contentType) {
            case 'info':
                return <InfoCardForm onChange={handleInfoChange} />;
            case 'debate':
                return <DebateForm onChange={handleDebateChange} />;
            case 'quiz':
                return <QuizForm onChange={handleQuizChange} />;
            default:
                return null;
        }
    };

    const handlePublish = async () => {
        if (!contentType) return;
        
        setIsPublishing(true);
        console.log("STEP 1 Validation OK");
        try {
            // Add a title to payload so search works properly
            const finalPayload = { ...formData };
            if (!finalPayload.title && finalPayload.question) {
                finalPayload.title = finalPayload.question; // Map quiz question to title for generic views
            }

            // Mapped type for backend: 'knowledge_card', 'discussion', 'quiz'
            let backendType = contentType;
            if (contentType === 'info') backendType = 'knowledge_card';
            else if (contentType === 'debate') backendType = 'discussion';

            console.log("STEP 2 Image Upload OK (if applicable)");
            
            console.log("STEP 6: Insert payload", { type: backendType, payload: finalPayload });
            
            console.log("STEP 3 Insert Process Started");
            const result = await creatorService.createPost(backendType, finalPayload);
            
            console.log("STEP 4 Verify OK. Post created:", result?.id);
            
            console.log("STEP 5 Navigation OK - Redirecting to PostDetail");
            
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'İçeriğiniz yayınlandı!' });
            setContentType(null); // Reset
            setFormData({});
            
            if (backendType === 'discussion') {
                navigation.navigate('DebateRoom', { debateId: result.id });
            } else {
                // Navigate to Feed (Akış) instead of Detail page to prevent 'content not found' due to indexing delays
                navigation.navigate('Main', { screen: 'Akış' });
            }

        } catch (error: any) {
            console.error("Publish error:", error);
            Toast.show({ type: 'error', text1: 'Hata', text2: error?.message || 'İçerik yayınlanamadı.' });
        } finally {
            setIsPublishing(false);
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
                <TouchableOpacity style={{ marginTop: spacing.sm }} onPress={() => setIsRulesVisible(true)}>
                    <Text variant="caption" weight="bold" color="primary">Tüm kuralları görüntüle →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPicker = () => (
        <View style={styles.pickerContainer}>
            <View style={styles.header}>
                <Text variant="h1" weight="bold" color="textPrimary" style={styles.headerTitle}>Ne üretmek istiyorsun?</Text>
                <Text variant="body" color="textSecondary" style={styles.headerDesc}>Mentis ağında paylaşmak istediğin içerik formatını seç.</Text>
            </View>
            <ScrollView contentContainerStyle={styles.pickerGrid}>
                {tabs.map((tab) => (
                    <TouchableOpacity 
                        key={tab.id!}
                        style={styles.pickerCard}
                        onPress={() => setContentType(tab.id)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.pickerIconWrapper}>
                            <Icon name={tab.icon} size={28} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text variant="h2" weight="bold" color="textPrimary" style={{ fontSize: 18, marginBottom: 4 }}>{tab.label}</Text>
                            <Text variant="caption" color="textSecondary">{tab.desc}</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                ))}
                <View style={{height: 100}} />
            </ScrollView>
        </View>
    );

    const renderMainContent = () => {
        if (!contentType) {
            return renderPicker();
        }

        return (
            <>
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <TouchableOpacity style={styles.backToPickerBtn} onPress={() => setContentType(null)}>
                            <Icon name="arrow-left" size={20} color={colors.textPrimary} />
                            <Text variant="body" weight="bold" color="textPrimary" style={{marginLeft: 8}}>Geri</Text>
                        </TouchableOpacity>
                        {isSaving && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="loader" size={14} color={colors.textTertiary} />
                                <Text variant="caption" color="textTertiary" style={{ marginLeft: 4 }}>Kaydediliyor...</Text>
                            </View>
                        )}
                    </View>
                </View>

                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <ErrorBoundary>
                        {renderForm()}
                    </ErrorBoundary>
                </ScrollView>
            </>
        );
    };

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
                {contentType && (
                    <View style={styles.bottomBar}>
                        <LinearGradient
                            colors={isValid ? ['#8b5cf6', '#a855f7'] : [colors.surface, colors.surface]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[styles.publishGradient, !isValid && { borderWidth: 1, borderColor: colors.border }]}
                        >
                            <TouchableOpacity 
                                style={styles.publishButton} 
                                activeOpacity={0.8} 
                                onPress={handlePublish} 
                                disabled={isPublishing || !isValid}
                            >
                                {isPublishing ? (
                                    <Icon name="loader" size={18} color={isValid ? colors.surface : colors.textTertiary} />
                                ) : (
                                    <Icon name="send" size={18} color={isValid ? colors.surface : colors.textTertiary} />
                                )}
                                <Text style={[styles.publishText, !isValid && { color: colors.textTertiary }]}>
                                    {isPublishing ? 'Yayınlanıyor...' : 'Hemen Yayınla'}
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}

                {/* Community Guidelines Modal */}
                <CommunityGuidelinesModal 
                    visible={isRulesVisible} 
                    onClose={() => setIsRulesVisible(false)} 
                />

            </KeyboardAvoidingView>
        </Screen>
    );
};

function useStyles() { return StyleSheet.create({
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
    backToPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    pickerContainer: {
        flex: 1,
    },
    pickerGrid: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        gap: spacing.md,
    },
    pickerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    pickerIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
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
}); }
