import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, View, Platform, TouchableOpacity } from 'react-native';
import { Screen } from '../components/layout';
import { spacing, colors } from '../theme';
import { useResponsive } from '../hooks/useResponsive';
import { useWebSEO } from '../hooks/useWebSEO';
import { Text, Icon } from '../components/ui';
import { getUserProfile, ensureUserStats } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileContentHub } from '../components/profile/ProfileContentHub';
import { FollowListModal } from '../components/profile/FollowListModal';
import { StatsTab } from '../components/profile/tabs/StatsTab';

import { useNavigation, useFocusEffect } from '@react-navigation/native';

type TabType = 'all' | 'cards' | 'debates' | 'quizzes' | 'saved' | 'stats';

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

export const ProfileScreen = ({ route }: any) => {
    const styles = useStyles();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
    
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);
    const { user: authUser, profile: authProfile } = useAuth();
    
    // Fallback to authUser if no userId passed via navigation
    const targetUserId = route?.params?.userId || authUser?.id;

    useWebSEO({
        title: profileData?.profile?.name ? `${profileData.profile.name} (@${profileData.profile.username})` : 'Mentis Profil',
        description: profileData?.profile?.bio || 'Mentis entelektüel profili.',
    });

    const loadProfile = async () => {
        try {
            await ensureUserStats(targetUserId); // Creates empty stats if not exists
            const data = await getUserProfile(targetUserId);
            if (data && data.profile) {
                setProfileData(data);
                setErrorMsg(null);
            } else {
                setErrorMsg("Kullanıcı bulunamadı (get_profile_v5 hatası). Lütfen SQL scriptinin çalıştırıldığından emin olun.");
            }
        } catch (err: any) {
            setErrorMsg(err.message || String(err));
        }
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        loadProfile();

        if (targetUserId) {
            // Realtime Sync for User Stats (Phase 7 & 10)
            const statsSub = supabase.channel(`profile_stats_${targetUserId}_${Date.now()}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats', filter: `user_id=eq.${targetUserId}` }, () => {
                    if (isMounted) loadProfile();
                }).subscribe();

            return () => {
                isMounted = false;
                supabase.removeChannel(statsSub);
            };
        }
    }, [targetUserId]);

    useFocusEffect(
        React.useCallback(() => {
            loadProfile();
        }, [targetUserId])
    );

    useEffect(() => {
        // Optimistic update if auth profile changes
        if (targetUserId === authUser?.id && authProfile && profileData?.profile) {
            if (authProfile.username !== profileData.profile.username || authProfile.full_name !== profileData.profile.name) {
                setProfileData((prev: any) => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        username: authProfile.username || prev.profile.username,
                        name: authProfile.full_name || prev.profile.name,
                    }
                }));
            }
        }
    }, [authProfile]);

    if (loading) {
        return (
            <Screen backgroundColor="background" withSafeTop hideRightSidebar>
                <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </Screen>
        );
    }

    if (!profileData || !profileData.profile || errorMsg) {
        return (
            <Screen backgroundColor="background" withSafeTop hideRightSidebar>
                <View style={[styles.scrollContent, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text variant="h3" color="error">Profil yüklenemedi.</Text>
                    <Text variant="body" color="textSecondary" style={{ marginTop: 10, textAlign: 'center' }}>{errorMsg || "Bilinmeyen hata"}</Text>
                    <TouchableOpacity onPress={loadProfile} style={{ marginTop: 20, padding: 10, backgroundColor: colors.primary, borderRadius: 5 }}>
                        <Text color="textLight">Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            </Screen>
        );
    }

    const tabs: { id: TabType; label: string }[] = [
        { id: 'all', label: 'Tümü' },
        { id: 'cards', label: 'Bilgi Kartları' },
        { id: 'debates', label: 'Tartışmalar' },
        { id: 'quizzes', label: 'Quizler' },
        { id: 'saved', label: 'Kaydedilenler' },
        { id: 'stats', label: 'İstatistikler' },
    ];

    const renderTabs = () => (
        <View style={[styles.tabsContainer, isWebDesktop && { borderBottomWidth: 1 }]}>
            <View style={[styles.tabsScroll, isWebDesktop ? { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md } : { flexDirection: 'row' }]}>
                {!isWebDesktop ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
                        {tabs.map(tab => {
                            if (tab.id === 'saved' && !profileData.relationship.is_self) return null;
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity key={tab.id} style={[styles.tab, isActive && styles.tabActive]} onPress={() => setActiveTab(tab.id)} activeOpacity={0.8}>
                                    <Text variant="body" weight="semibold" color={isActive ? 'textPrimary' : 'textSecondary'} style={styles.tabText}>{tab.label}</Text>
                                    {isActive && <View style={styles.tabUnderline} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                ) : (
                    tabs.map(tab => {
                        if (tab.id === 'saved' && !profileData.relationship.is_self) return null;
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity key={tab.id} style={[styles.tab, isActive && styles.tabActive]} onPress={() => setActiveTab(tab.id)} activeOpacity={0.8}>
                                <Text variant="body" weight="semibold" color={isActive ? 'textPrimary' : 'textSecondary'} style={styles.tabText}>{tab.label}</Text>
                                {isActive && <View style={styles.tabUnderline} />}
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </View>
    );

    const renderTabContent = () => {
        const isPrivate = profileData.profile.is_private;
        const followStatus = profileData.relationship.follow_status;
        const isSelf = profileData.relationship.is_self;

        if (isPrivate && !isSelf && followStatus !== 'accepted') {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                    <Icon name="Lock" size={48} color={colors.textSecondary} />
                    <Text variant="h3" weight="bold" color="textPrimary" style={{ marginTop: spacing.md }}>Bu Hesap Gizli</Text>
                    <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
                        İçerikleri ve istatistikleri görmek için bu hesabı takip et.
                    </Text>
                </View>
            );
        }

        if (activeTab === 'stats') {
            return <StatsTab stats={profileData.stats} reputation={profileData.stats} />;
        }
        
        return <ProfileContentHub userId={profileData.profile.id} activeTab={activeTab} />;
    };

    return (
        <ProfileErrorBoundary>
            <Screen padding="none" backgroundColor="background" hideRightSidebar={true}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <View style={isWebDesktop ? styles.desktopGrid : undefined}>
                        <View style={isWebDesktop ? styles.desktopColumnCenter : undefined}>
                            <ProfileHeader 
                                profile={profileData.profile} 
                                stats={profileData.stats} 
                                relationship={profileData.relationship}
                                isOwnProfile={profileData.relationship.is_self}
                                onProfileUpdate={loadProfile}
                                onFollowersClick={() => setFollowListType('followers')}
                                onFollowingClick={() => setFollowListType('following')}
                            />
                            {renderTabs()}
                            <View style={[styles.tabContentContainer, !isWebDesktop && { paddingHorizontal: spacing.lg }]}>
                                {renderTabContent()}
                            </View>
                        </View>
                    </View>
                    
                    <FollowListModal 
                        visible={followListType !== null} 
                        onClose={() => setFollowListType(null)} 
                        type={followListType || 'followers'} 
                        userId={targetUserId}
                    />
                </ScrollView>
            </Screen>
        </ProfileErrorBoundary>
    );
};

function useStyles() { return StyleSheet.create({
    scrollContent: { 
        paddingVertical: spacing.xl,
        paddingBottom: 100, 
    },
    desktopGrid: {
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        maxWidth: 800, 
        width: '100%',
        alignSelf: 'center',
    },
    desktopColumnCenter: {
        flex: 1,
        maxWidth: 800,
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
}); }
