import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Modal } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../theme';
import { useSavedContent } from '../hooks/useSavedContent';
import { HeroCard } from '../components/feed/HeroCard';
import { DiscussionCard } from '../components/feed/DiscussionCard';
import { QuizCard } from '../components/feed/QuizCard';
import { ArticleCard } from '../components/feed/ArticleCard';
import { toggleSave, toggleLike } from '../services/feedService';

export const SavedScreen = () => {
    const styles = useStyles();
    const { groupedContent, loading, refetch } = useSavedContent();

    return (
        <Screen backgroundColor="background" withSafeTop>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text variant="h1" weight="bold" color="textPrimary">Kaydedilenler</Text>
                    <Text variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                        Kişisel bilgi kartı arşivin. Toplam {groupedContent.all.length} içerik.
                    </Text>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.emptyState}>
                        <Text>Yükleniyor...</Text>
                    </View>
                ) : groupedContent.all.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="bookmark" size={48} color={colors.textTertiary} />
                        <Text variant="h3" weight="bold" color="textSecondary" style={{ marginTop: spacing.md }}>
                            Henüz kaydedilmiş içerik yok.
                        </Text>
                        <Text variant="body" color="textTertiary" style={{ marginTop: spacing.xs }}>
                            Keşfetmeye başla ve ilgini çekenleri kaydet.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {groupedContent.all.map(item => {
                            const post = item.post as any;
                            if (!post) return null;
                            
                            // Format object exactly as expected by existing Feed components
                            const formattedItem = {
                                ...post,
                                author: {
                                    id: post.author_id,
                                    username: post.author_username || post.user?.username,
                                    full_name: post.author_full_name || post.user?.full_name,
                                    avatar_value: post.author_avatar_url || post.user?.avatar_url,
                                    level: post.author_level
                                },
                                likes: Number(post.likes_count) || 0,
                                comments: Number(post.comments_count) || 0,
                                user_has_saved: true // we know it's saved
                            };
                            
                            const handleDelete = async () => {
                                await toggleSave(post.id, true); // true means currently saved, so toggle will unsave it
                                refetch();
                            };

                            if (post.type === 'knowledge_card') return <HeroCard key={item.id} post={formattedItem} onToggleLike={() => {}} onToggleSave={handleDelete} onDelete={handleDelete} />;
                            if (post.type === 'discussion') return <DiscussionCard key={item.id} post={formattedItem} onVote={() => {}} onDelete={handleDelete} />;
                            if (post.type === 'quiz') return <QuizCard key={item.id} post={formattedItem} onAnswer={() => {}} onDelete={handleDelete} />;
                            
                            return <ArticleCard key={item.id} post={formattedItem} onToggleLike={() => {}} onToggleSave={handleDelete} onDelete={handleDelete} />;
                        })}
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
};

function useStyles() { return StyleSheet.create({
    container: {
        padding: spacing.xl,
        maxWidth: 1440,
        marginHorizontal: 'auto',
        width: '100%',
    },
    header: {
        marginBottom: spacing.xl,
    },
    filters: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'all 0.2s' } as any),
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl * 2,
    },
    list: {
        flexDirection: 'column',
        gap: spacing.lg,
        maxWidth: 820,
        marginHorizontal: 'auto',
        width: '100%',
    }
}); }
