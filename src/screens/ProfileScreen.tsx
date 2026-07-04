import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, View, Platform, TouchableOpacity, Animated } from 'react-native';
import { Screen } from '../components/layout';
import { spacing, colors, radius, shadows } from '../theme';
import { useResponsive } from '../hooks/useResponsive';
import { useWebSEO } from '../hooks/useWebSEO';
import { Text } from '../components/ui';
import { getUserProfile, ensureUserStats, CURRENT_USER_ID } from '../services/profileService';
import { supabase } from '../lib/supabase';

import { ProfileHeader } from '../components/profile/ProfileHeader';
import { CreatorWorkspace } from '../components/profile/CreatorWorkspace';
import { PostsTab } from '../components/profile/tabs/PostsTab';
import { SavedTab } from '../components/profile/tabs/SavedTab';
import { BadgesTab } from '../components/profile/tabs/BadgesTab';
import { StatsTab } from '../components/profile/tabs/StatsTab';

import { useNavigation } from '@react-navigation/native';

class ProfileErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <Screen backgroundColor="background" withSafeTop>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Text variant="h2" color="error">Profil Yüklenemedi</Text>
                        <Text variant="body" color="textSecondary" style={{ marginTop: 10 }}>{this.state.error?.toString()}</Text>
                    </View>
                </Screen>
            );
        }
        return this.props.children;
    }
}

export const ProfileScreen = () => {
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('gonderiler');
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);

    useWebSEO({
        title: profileData?.user?.name ? `${profileData.user.name} Profil` : 'Entelektüel Kimlik',
        description: profileData?.user?.bio || 'Mentis profilin.',
    });

    const loadProfile = async () => {
        await ensureUserStats();
        const data = await getUserProfile();
        if (data) {
            setProfileData(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        loadProfile();

        const statsSub = supabase.channel(`stats:${CURRENT_USER_ID}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${CURRENT_USER_ID}` }, () => {
                if (isMounted) loadProfile();
            }).subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(statsSub);
        };
    }, []);

    if (loading) {
        return (
            <Screen backgroundColor="background" withSafeTop hideRightSidebar>
                <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </Screen>
        );
    }

    if (!profileData || !profileData.user) {
        return (
            <Screen backgroundColor="background" withSafeTop hideRightSidebar>
                <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text>Profil yüklenemedi.</Text>
                </View>
            </Screen>
        );
    }

    const tabs = [
        { id: 'gonderiler', label: 'Gönderiler' },
        { id: 'kaydedilenler', label: 'Kütüphanem' },
        { id: 'rozetler', label: 'Rozetler' },
        { id: 'istatistikler', label: 'İstatistikler' },
    ];

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity 
                            key={tab.id} 
                            style={[styles.tab, isActive && styles.tabActive]}
                            onPress={() => setActiveTab(tab.id)}
                            activeOpacity={0.8}
                        >
                            <Text variant="body" weight="semibold" color={isActive ? 'textPrimary' : 'textSecondary'} style={styles.tabText}>
                                {tab.label}
                            </Text>
                            {isActive && <View style={styles.tabUnderline} />}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'gonderiler':
                return <PostsTab posts={profileData.posts} />; 
            case 'kaydedilenler':
                return <SavedTab />;
            case 'rozetler':
                return <BadgesTab badges={profileData.badges} />;
            case 'istatistikler':
                return <StatsTab stats={profileData.stats} reputation={profileData.reputation} cognitiveTraits={profileData.cognitive_traits} />;
            default:
                return null;
        }
    };

    return (
        <ProfileErrorBoundary>
            <Screen padding="none" backgroundColor="background" hideRightSidebar={true}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    {isWebDesktop ? (
                        <View style={styles.desktopGrid}>
                            {/* Main Content (Center) */}
                            <View style={styles.desktopColumnLeft}>
                                <ProfileHeader user={profileData.user} stats={profileData.stats} socials={profileData.socials} reputation={profileData.reputation} onProfileUpdate={loadProfile} />
                                {renderTabs()}
                                <View style={styles.tabContentContainer}>
                                    {renderTabContent()}
                                </View>
                            </View>
                            {/* Creator Workspace (Right) */}
                            <View style={styles.desktopColumnRight}>
                                <CreatorWorkspace onNavigateTab={(tab) => setActiveTab(tab)} />
                            </View>
                        </View>
                    ) : (
                        <>
                            <ProfileHeader user={profileData.user} stats={profileData.stats} socials={profileData.socials} reputation={profileData.reputation} onProfileUpdate={loadProfile} />
                            {renderTabs()}
                            <View style={[styles.tabContentContainer, { paddingHorizontal: spacing.lg }]}>
                                {renderTabContent()}
                            </View>
                        </>
                    )}
                </ScrollView>
            </Screen>
        </ProfileErrorBoundary>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingVertical: spacing.xl,
        paddingBottom: 100, // accommodate bottom tab bar and FAB
    },
    desktopGrid: {
        flexDirection: 'row',
        gap: spacing.xxl,
        paddingHorizontal: spacing.xl,
        maxWidth: 1200, // Tighter editorial width
        width: '100%',
        alignSelf: 'center',
    },
    desktopColumnLeft: {
        flex: 3,
        maxWidth: 800,
    },
    desktopColumnRight: {
        flex: 1,
        maxWidth: 320,
    },
    tabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        marginBottom: spacing.xxl,
    },
    tabsScroll: {
        paddingHorizontal: Platform.OS === 'web' ? 0 : spacing.lg,
    },
    tab: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        position: 'relative',
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    tabActive: {
        backgroundColor: 'transparent',
    },
    tabText: {
        letterSpacing: 0.2,
    },
    tabUnderline: {
        position: 'absolute',
        bottom: -1,
        left: spacing.lg,
        right: spacing.lg,
        height: 2,
        backgroundColor: colors.textPrimary,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
    tabContentContainer: {
        minHeight: 500,
    },
});
