import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Platform, Alert, Share, TouchableOpacity, useWindowDimensions, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { useRealtimeFeed } from '../hooks/useRealtimeFeed';
import { useWebSEO } from '../hooks/useWebSEO';
import { Post } from '../types/database.types';
import { toggleLike, toggleSave, toggleShare, submitQuizAnswer, submitDebateVote } from '../services/feedService';
import { KnowledgeHubContent } from '../components/layout/RightSidebar';

// Components
import { FeedHeader } from '../components/feed/FeedHeader';
import { ArticleCard } from '../components/feed/ArticleCard';
import { DiscussionCard } from '../components/feed/DiscussionCard';
import { QuizCard } from '../components/feed/QuizCard';
import { HeroCard } from '../components/feed/HeroCard';
import { PremiumLockCard } from '../components/feed/PremiumLockCard';
import { ChallengeCard } from '../components/feed/ChallengeCard';

class ErrorBoundary extends React.Component<{children: any}, {hasError: boolean, error: any}> {
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
                <View style={{ padding: 20, backgroundColor: '#fee2e2', marginBottom: 10, borderRadius: 8 }}>
                    <Text style={{ color: '#991b1b', fontWeight: 'bold' }}>RENDER ERROR: {String(this.state.error)}</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

export const FeedScreen = () => {
    const { width } = useWindowDimensions();
    const isMobile = width < 1024;
    const styles = useStyles();
    const [isKnowledgeHubVisible, setIsKnowledgeHubVisible] = useState(false);
    const navigation = useNavigation<any>();
    const [activeCategory, setActiveCategory] = useState('Tümü');
    const [searchQuery, setSearchQuery] = useState('');
    const [feedType, setFeedType] = useState<'for_you' | 'following' | 'trending'>('for_you');
    
    useWebSEO({
        title: 'Akış | Mentis',
        description: 'Mentis - Felsefe, bilim ve sanatın buluşma noktası.',
    });
    
    // Connect to Supabase Custom Hook
    const { 
        posts, 
        loading, 
        optimisticToggleLike,
        optimisticToggleSave,
        optimisticQuizAnswer,
        optimisticDebateVote,
        optimisticHidePost
    } = useRealtimeFeed(feedType, activeCategory === 'Tümü' ? 'Hepsi' : activeCategory, searchQuery);

    const handleCategorySelect = useCallback((cat: string) => setActiveCategory(cat), []);
    const handleSearchChange = useCallback((query: string) => setSearchQuery(query), []);

    const renderItem = ({ item }: { item: Post }) => {
        if ((item as any)._hidden) return null;
        try {
            const commonProps = {
                onToggleLike: async () => {
                    optimisticToggleLike(item.id);
                    try { await toggleLike(item.id, !!item.user_has_liked); } catch (e) {}
                },
                onToggleSave: async () => {
                    optimisticToggleSave(item.id);
                    try { 
                        await toggleSave(item.id, !!item.user_has_saved); 
                    } catch (e: any) {
                        optimisticToggleSave(item.id); // Revert UI
                        Alert.alert('Kaydetme Başarısız', e?.message || 'İçerik kaydedilirken bir hata oluştu.');
                    }
                },
                onToggleShare: async () => {
                    try {
                        const result = await Share.share({
                            message: `Mentis'te bu içeriğe göz at: ${item.title}\n\nhttps://mentis.app/post/${item.id}`,
                            title: item.title,
                        });
                        
                        if (result.action === Share.sharedAction) {
                            await toggleShare(item.id, 'native_share');
                        }
                    } catch (error: any) {
                        Alert.alert('Paylaşım Hatası', error.message);
                    }
                },
                onOpenDetail: () => {
                    navigation.navigate('PostDetail', { post: item });
                },
                onHidePost: () => {
                    Alert.alert(
                        'İçeriği Gizle',
                        'Bu içerik ve benzerleri daha az gösterilecek.',
                        [
                            { text: 'İptal', style: 'cancel' },
                            { text: 'Gizle', style: 'destructive', onPress: () => optimisticHidePost(item.id) }
                        ]
                    );
                },
                onDelete: () => optimisticHidePost(item.id)
            };

            const discoveryBadge = (item as any).discovery_reason ? (
                <View style={styles.discoveryBadge}>
                    <Text variant="caption" weight="bold" color="primary">{(item as any).discovery_reason}</Text>
                </View>
            ) : null;

            let content = null;
            
            switch (item.type) {
                case 'hero':
                    content = <View><HeroCard post={item} {...commonProps} /><View style={{ height: spacing.xl }} /></View>;
                    break;
                case 'quiz':
                    content = <QuizCard post={item} onDelete={() => optimisticHidePost(item.id)} onAnswer={async (ans: any) => {
                        optimisticQuizAnswer(item.id, ans);
                        try { await submitQuizAnswer(item.id, ans, false); } catch(e){} 
                    }} />;
                    break;
                case 'article':
                case 'knowledge_card':
                    content = <ArticleCard post={item} {...commonProps} />;
                    break;
                case 'discussion':
                    content = <DiscussionCard post={item} onDelete={() => optimisticHidePost(item.id)} onVote={async (vote: any) => {
                        optimisticDebateVote(item.id, vote);
                        try { await submitDebateVote(item.id, vote.selected_option); } catch(e){}
                    }} />;
                    break;
                case 'premium_lock':
                    content = <PremiumLockCard post={item} />;
                    break;
                case 'challenge':
                    content = <ChallengeCard post={item} />;
                    break;
                default:
                    content = <ArticleCard post={item} {...commonProps} />; // fallback
            }

            return (
                <ErrorBoundary>
                    <View style={{ marginBottom: spacing.lg }}>
                        {discoveryBadge}
                        {content}
                    </View>
                </ErrorBoundary>
            );
        } catch (error: any) {
            return (
                <View style={{ padding: 20, backgroundColor: '#fee2e2', marginBottom: 10, borderRadius: 8 }}>
                    <Text style={{ color: '#991b1b', fontWeight: 'bold' }}>RENDER ERROR: {error?.message}</Text>
                </View>
            );
        }
    };

    if (loading && posts.length === 0) {
        return (
            <Screen padding="md" backgroundColor="background" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </Screen>
        );
    }

    return (
        <Screen backgroundColor="background" withSafeTop padding="none">
            <View style={styles.feedContainer}>
                <FlatList
                    style={{ width: '100%' }}
                    contentContainerStyle={styles.listContent}
                    data={posts}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={
                        <View>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity style={[styles.tab, feedType === 'for_you' && styles.activeTab]} onPress={() => setFeedType('for_you')}>
                                    <Text weight="bold" color={feedType === 'for_you' ? 'primary' : 'textSecondary'}>Sizin İçin</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.tab, feedType === 'following' && styles.activeTab]} onPress={() => setFeedType('following')}>
                                    <Text weight="bold" color={feedType === 'following' ? 'primary' : 'textSecondary'}>Takip Edilenler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.tab, feedType === 'trending' && styles.activeTab]} onPress={() => setFeedType('trending')}>
                                    <Text weight="bold" color={feedType === 'trending' ? 'primary' : 'textSecondary'}>Trendler</Text>
                                </TouchableOpacity>
                            </View>
                            <FeedHeader 
                                activeCategory={activeCategory} 
                                onCategorySelect={handleCategorySelect}
                                onSearchChange={handleSearchChange}
                                onKnowledgeHubPress={isMobile ? () => setIsKnowledgeHubVisible(true) : undefined}
                            />
                        </View>
                    }
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    windowSize={11}
                    maxToRenderPerBatch={5}
                    initialNumToRender={5}
                    removeClippedSubviews={Platform.OS !== 'web'}
                    ListEmptyComponent={() => (
                        <View style={{ alignItems: 'center', paddingVertical: 40, minHeight: 120, justifyContent: 'center' }}>
                            <Icon name="inbox" size={48} color={colors.textSecondary} />
                            <Text style={{ marginTop: spacing.md }} color="textSecondary">Bu kategoride henüz gönderi yok.</Text>
                        </View>
                    )}
                />
            </View>

            {/* Mobile Floating Knowledge Hub Button */}
            {isMobile && !isKnowledgeHubVisible && (
                <TouchableOpacity 
                    style={styles.floatingHubBtn} 
                    onPress={() => setIsKnowledgeHubVisible(true)}
                >
                    <Icon name="compass" size={24} color={colors.surface} />
                </TouchableOpacity>
            )}

            {/* Mobile Knowledge Hub Bottom Sheet */}
            {isMobile && (
                <Modal visible={isKnowledgeHubVisible} transparent animationType="slide" onRequestClose={() => setIsKnowledgeHubVisible(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsKnowledgeHubVisible(false)} />
                        <View style={{ backgroundColor: colors.background, height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 0 }}>
                            <View style={{ width: 40, height: 4, backgroundColor: colors.borderHighlight, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg }} />
                            <Text variant="h2" weight="bold" color="textPrimary" style={{ marginBottom: spacing.md, marginLeft: spacing.md }}>Bilgi Merkezi</Text>
                            <KnowledgeHubContent />
                        </View>
                    </View>
                </Modal>
            )}
        </Screen>
    );
};

function useStyles() { return StyleSheet.create({
    feedContainer: {
        flex: 1,
        alignItems: 'center',
        width: '100%',
        backgroundColor: colors.background, // Match iOS background to feel native
    },
    listContent: {
        maxWidth: 820,
        paddingHorizontal: Platform.OS === 'web' ? spacing.xl : spacing.md, // Dense on mobile
        paddingBottom: 100, // Ensure bottom space for scrolling
    },
    floatingHubBtn: {
        position: 'absolute',
        bottom: spacing.xxl,
        right: spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        zIndex: 100,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        marginBottom: spacing.md,
    },
    tab: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginRight: spacing.sm,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: colors.primary,
    },
    discoveryBadge: {
        backgroundColor: colors.primaryLight,
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.full,
        marginBottom: spacing.sm,
        marginLeft: spacing.md,
    }
}); }
