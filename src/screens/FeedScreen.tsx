import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../theme';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { useRealtimeFeed } from '../hooks/useRealtimeFeed';
import { useWebSEO } from '../hooks/useWebSEO';
import { Post } from '../types/database.types';
import { toggleLike, toggleSave, submitQuizAnswer, submitDebateVote } from '../services/feedService';

// Components
import { HeroCard } from '../components/feed/HeroCard';
import { QuizCard } from '../components/feed/QuizCard';
import { ArticleCard } from '../components/feed/ArticleCard';
import { DiscussionCard } from '../components/feed/DiscussionCard';
import { PremiumLockCard } from '../components/feed/PremiumLockCard';
import { ChallengeCard } from '../components/feed/ChallengeCard';
import { FeedHeader } from '../components/feed/FeedHeader';
const CATEGORIES = ['Hepsi', 'Felsefe', 'Tarih', 'Sanat'];

export const FeedScreen = () => {
    const navigation = useNavigation<any>();
    const [activeCategory, setActiveCategory] = useState('Hepsi');
    const [searchQuery, setSearchQuery] = useState('');
    
    useWebSEO({
        title: 'Akış',
        description: 'Mentis - Felsefe, bilim ve sanatın buluşma noktası.',
    });
    
    // Connect to Supabase Custom Hook
    const { 
        posts, 
        loading, 
        refreshing, 
        handleRefresh,
        optimisticToggleLike,
        optimisticToggleSave,
        optimisticQuizAnswer,
        optimisticDebateVote
    } = useRealtimeFeed(activeCategory, searchQuery);

    const handleCategorySelect = useCallback((cat: string) => setActiveCategory(cat), []);
    const handleSearchChange = useCallback((query: string) => setSearchQuery(query), []);

    const renderItem = ({ item }: { item: Post }) => {
        // Pass optimistic updaters to cards
        const commonProps = {
            onToggleLike: async () => {
                optimisticToggleLike(item.id);
                try {
                    await toggleLike(item.id, !!item.user_has_liked);
                } catch (e) {
                    console.error('Like toggle failed', e);
                }
            },
            onToggleSave: async () => {
                optimisticToggleSave(item.id);
                try {
                    await toggleSave(item.id, !!item.user_has_saved);
                } catch (e) {
                    console.error('Save toggle failed', e);
                }
            },
        };

        // Currently unlocked all content per user request
        const userIsPremium = true; 
        const isLocked = item.is_premium && !userIsPremium;

        let content = null;
        
        switch (item.type) {
            case 'hero':
                content = (
                    <View>
                        <HeroCard post={item} {...commonProps} />
                        <View style={{ height: spacing.xl }} />
                    </View>
                );
                break;
            case 'quiz':
                content = <QuizCard post={item} onAnswer={async (ans: any) => {
                    optimisticQuizAnswer(item.id, ans);
                    try { await submitQuizAnswer(item.id, ans, false); } catch(e){} 
                }} />;
                break;
            case 'article':
                content = <ArticleCard post={item} {...commonProps} />;
                break;
            case 'discussion':
                content = <DiscussionCard post={item} onVote={async (vote: any) => {
                    optimisticDebateVote(item.id, vote);
                    try { await submitDebateVote(item.id, vote); } catch(e){}
                }} />;
                break;
            case 'premium_lock':
                content = <PremiumLockCard post={item} />;
                break;
            case 'challenge':
                content = <ChallengeCard post={item} />;
                break;
            default:
                content = null;
        }

        if (isLocked && item.type !== 'premium_lock') {
            return <PremiumLockCard>{content}</PremiumLockCard>;
        }

        return content;
    };

    if (loading && posts.length === 0) {
        return (
            <Screen padding="md" backgroundColor="background" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </Screen>
        );
    }

    return (
        <Screen backgroundColor="background" withSafeTop>
            <FlatList
                contentContainerStyle={styles.listContent}
                data={posts}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={<FeedHeader activeCategory={activeCategory} onCategorySelect={handleCategorySelect} onSearchChange={handleSearchChange} />}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                windowSize={11} // Performance optimization for large lists
                maxToRenderPerBatch={5}
                initialNumToRender={5}
                removeClippedSubviews={true}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', marginTop: 50 }}>
                        <Icon name="inbox" size={48} color={colors.textSecondary} />
                        <Text style={{ marginTop: spacing.md }} color="textSecondary">Bu kategoride henüz gönderi yok.</Text>
                    </View>
                )}
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    listContent: {
        padding: spacing.md,
        paddingBottom: 100, // accommodate bottom tab bar and FAB
    }
});
