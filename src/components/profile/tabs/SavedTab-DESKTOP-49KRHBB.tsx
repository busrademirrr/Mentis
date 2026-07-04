import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Image, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Icon } from '../../ui';
import { colors, spacing, radius, typography, shadows } from '../../../theme';
import { getSavedPosts, getSavedCollections, createSaveCollection } from '../../../services/savedService';
import { PostOptionsMenu } from '../../feed/PostOptionsMenu';

export const SavedTab = () => {
    const [savedItems, setSavedItems] = useState<any[]>([]);
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCollection, setActiveCollection] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, [activeCollection]);

    const loadData = async () => {
        setLoading(true);
        const [postsRes, colsRes] = await Promise.all([
            getSavedPosts(activeCollection || undefined),
            getSavedCollections()
        ]);
        setSavedItems(postsRes);
        setCollections(colsRes);
        setLoading(false);
    };

    const filteredItems = savedItems.filter(item => {
        const post = item.post;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return post?.title?.toLowerCase().includes(q) || post?.content?.toLowerCase().includes(q);
    });

    return (
        <View style={styles.container}>
            {/* Header / Tools */}
            <View style={styles.toolbar}>
                <View style={styles.searchContainer}>
                    <Icon name="Search" size={18} color="textTertiary" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Kütüphanende ara..."
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Collections Pills */}
            <View style={styles.collectionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: spacing.xl }}>
                    <TouchableOpacity 
                        style={[styles.pill, activeCollection === null && styles.pillActive]}
                        onPress={() => setActiveCollection(null)}
                    >
                        <Text variant="caption" weight="bold" color={activeCollection === null ? 'surface' : 'textSecondary'}>Tümü</Text>
                    </TouchableOpacity>
                    {collections.map(col => (
                        <TouchableOpacity 
                            key={col.id}
                            style={[styles.pill, activeCollection === col.id && styles.pillActive]}
                            onPress={() => setActiveCollection(col.id)}
                        >
                            <Text variant="caption" weight="bold" color={activeCollection === col.id ? 'surface' : 'textSecondary'}>
                                {col.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : filteredItems.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Icon name="Library" size={32} color={colors.primary} />
                    </View>
                    <Text variant="h3" weight="bold" color="textPrimary" style={styles.emptyTitle}>
                        Arşiviniz Boş
                    </Text>
                    <Text variant="body" color="textSecondary" align="center" style={styles.emptyDesc}>
                        İlginizi çeken içerikleri kaydederek kendi entelektüel arşivinizi oluşturmaya başlayın.
                    </Text>
                    <TouchableOpacity style={styles.emptyCtaButton}>
                        <Icon name="Compass" size={16} color={colors.surface} />
                        <Text variant="label" weight="bold" color="surface" style={{ marginLeft: 8 }}>Keşfet</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.gridContainer}>
                    {filteredItems.map((item) => (
                        <View key={item.id} style={styles.savedCard}>
                            {item.post?.image_url && (
                                <Image source={{uri: item.post.image_url}} style={styles.cardImage} />
                            )}
                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text variant="caption" weight="bold" style={styles.categoryText}>
                                        {item.post?.category?.toUpperCase() || 'BİLGİ'}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="Bookmark" size={14} color={colors.primary} />
                                        <View style={{ marginLeft: spacing.sm }}>
                                            <PostOptionsMenu 
                                                post={item.post} 
                                                onDelete={() => {
                                                    setSavedItems(prev => prev.filter(i => i.post?.id !== item.post.id));
                                                }} 
                                            />
                                        </View>
                                    </View>
                                </View>
                                <Text variant="h4" weight="bold" color="textPrimary" style={styles.title} numberOfLines={2}>
                                    {item.post?.title || 'İsimsiz İçerik'}
                                </Text>
                                <Text variant="body" color="textSecondary" style={styles.previewText} numberOfLines={3}>
                                    {item.post?.content}
                                </Text>
                                
                                <View style={styles.footer}>
                                    <Text variant="caption" color="textTertiary">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                    <TouchableOpacity style={styles.readCta}>
                                        <Text variant="caption" weight="bold" color="textPrimary">Kartı Aç →</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.lg,
        height: 48,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...shadows.base,
        elevation: 0,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        color: colors.textPrimary,
        fontFamily: typography.fonts.regular,
        fontSize: 15,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
    },
    collectionsContainer: {
        marginBottom: spacing.xl,
    },
    pill: {
        paddingHorizontal: spacing.xl,
        paddingVertical: 10,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        marginRight: spacing.sm,
    },
    pillActive: {
        backgroundColor: colors.textPrimary,
        borderColor: colors.textPrimary,
    },
    loadingContainer: {
        padding: spacing.xxl,
        alignItems: 'center',
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxxl,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderStyle: 'dashed',
        minHeight: 400,
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: radius.circle,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyDesc: {
        maxWidth: 400,
        lineHeight: 24,
        marginBottom: spacing.xxl,
    },
    emptyCtaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        ...shadows.glow,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xl,
    },
    savedCard: {
        width: Platform.OS === 'web' ? 'calc(50% - 12px)' : '100%', 
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...shadows.base,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' } as any),
    },
    cardImage: {
        width: '100%',
        height: 140,
    },
    cardContent: {
        padding: spacing.xl,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    categoryText: {
        color: colors.primary,
        letterSpacing: 1.2,
        fontSize: 11,
    },
    title: {
        lineHeight: 26,
        marginBottom: spacing.sm,
    },
    previewText: {
        lineHeight: 24,
        marginBottom: spacing.lg,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        paddingTop: spacing.md,
    },
    readCta: {
        paddingVertical: spacing.xs,
    }
});
