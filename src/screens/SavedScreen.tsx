import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../theme';
import { useSavedContent } from '../hooks/useSavedContent';

export const SavedScreen = () => {
    const { groupedContent, loading } = useSavedContent();
    const [filter, setFilter] = useState<'all' | 'posts' | 'debates' | 'quizzes'>('all');

    return (
        <Screen backgroundColor="background" withSafeTop>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text variant="h1" weight="bold" color="textPrimary">Kaydedilenler</Text>
                    <Text variant="body" color="textSecondary" style={{ marginTop: 4 }}>
                        Kişisel bilgi kartı arşivin. Toplam {groupedContent.posts.length} içerik.
                    </Text>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.emptyState}>
                        <Text>Yükleniyor...</Text>
                    </View>
                ) : groupedContent.posts.length === 0 ? (
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
                    <View style={styles.grid}>
                        {groupedContent.posts.map(item => (
                            <View key={item.id} style={styles.card}>
                                <View style={styles.cardImageMock}>
                                    <LinearGradient
                                        colors={
                                            item?.post?.category === 'Felsefe' ? ['#ecfdf5', '#a7f3d0'] : 
                                            item?.post?.category === 'Sanat' ? ['#fffbeb', '#fde68a'] : 
                                            item?.post?.category === 'Tarih' ? ['#eff6ff', '#bfdbfe'] : 
                                            ['#f5f3ff', '#ddd6fe']
                                        }
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        style={{ flex: 1, borderRadius: radius.md }}
                                    />
                                    <View style={styles.cardBookmark}>
                                        <Icon name="bookmark" size={16} color="white" />
                                    </View>
                                    <View style={[styles.categoryBadge, { backgroundColor: item?.post?.category === 'Felsefe' ? '#10b981' : item?.post?.category === 'Sanat' ? '#f59e0b' : item?.post?.category === 'Tarih' ? '#3b82f6' : '#8b5cf6' }]}>
                                        <Text variant="caption" weight="bold" color="surface">{item?.post?.category || 'Genel'}</Text>
                                    </View>
                                </View>
                                <Text variant="label" weight="bold" color="textPrimary" numberOfLines={2} style={{ marginTop: spacing.sm, lineHeight: 20 }}>
                                    {item?.post?.title || 'İsimsiz İçerik'}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.lg,
    },
    card: {
        width: Platform.OS === 'web' ? 'calc(25% - 18px)' : '100%',
        minWidth: 250,
        marginBottom: spacing.lg,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'transform 0.2s' } as any),
    },
    cardImageMock: {
        height: 180, // slightly taller to feel like an info card
        borderRadius: radius.md,
        position: 'relative',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardBookmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 6,
        borderRadius: radius.circle,
    },
    categoryBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
    }
});
