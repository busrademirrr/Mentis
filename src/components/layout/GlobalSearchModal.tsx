import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, Platform, Modal, Image, Keyboard } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { searchService, SearchResult } from '../../services/searchService';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const GlobalSearchModal = ({ visible, onClose }: Props) => {
    const navigation = useNavigation<any>();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [trending, setTrending] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial load for trending and history
    useEffect(() => {
        if (visible) {
            loadInitialData();
        } else {
            // Reset when hidden
            setQuery('');
            setResults([]);
        }
    }, [visible]);

    const loadInitialData = async () => {
        try {
            const [t, h] = await Promise.all([
                searchService.getTrending(5),
                searchService.getRecentSearches(5)
            ]);
            setTrending(t);
            setHistory(h);
        } catch (e) {}
    };

    // Debounced Search (300ms)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length >= 2) {
                performSearch(query);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async (searchTerm: string) => {
        setLoading(true);
        try {
            const data = await searchService.search(searchTerm);
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (item: SearchResult) => {
        // Log to history
        await searchService.logSearch(query);
        onClose();
        
        if (item.type === 'user') {
            navigation.navigate('Profile', { userId: item.id });
        } else if (item.type === 'post') {
            // We will route to KnowledgeDetail eventually. For now, Comments acts as the entry
            navigation.navigate('Comments', { postId: item.id });
        }
    };

    const handleHistoryClick = (term: string) => {
        setQuery(term);
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <View style={styles.modalContent}>
                    <View style={styles.searchHeader}>
                        <Icon name="search" size={20} color={colors.textSecondary} />
                        <TextInput
                            autoFocus
                            style={styles.input}
                            placeholder="Mentis'te ara (FTS Aktif)..."
                            placeholderTextColor={colors.textTertiary}
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={async () => {
                                if (query.trim().length >= 2) {
                                    await searchService.logSearch(query);
                                    performSearch(query);
                                }
                            }}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity style={{ padding: 4, marginRight: 8 }} onPress={() => setQuery('')}>
                                <Icon name="x-circle" size={18} color={colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                        <View style={styles.escBadge}>
                            <Text variant="caption" weight="bold" color="textTertiary">ESC</Text>
                        </View>
                    </View>

                    {query.trim().length < 2 ? (
                        <View style={styles.emptyState}>
                            {history.length > 0 && (
                                <View style={{ marginBottom: spacing.xl }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                                        <Icon name="clock" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                        <Text variant="label" weight="bold" color="textSecondary">Son Aramalar</Text>
                                    </View>
                                    {history.map((term, i) => (
                                        <TouchableOpacity key={`hist_${i}`} style={styles.suggestionRow} onPress={() => handleHistoryClick(term)}>
                                            <Icon name="history" size={16} color={colors.border} />
                                            <Text style={styles.suggestionText}>{term}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {trending.length > 0 && (
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                                        <Icon name="trending-up" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                                        <Text variant="label" weight="bold" color="primary">Mentis'te Trendler</Text>
                                    </View>
                                    {trending.map((term, i) => (
                                        <TouchableOpacity key={`trend_${i}`} style={styles.suggestionRow} onPress={() => handleHistoryClick(term)}>
                                            <Icon name="search" size={16} color={colors.border} />
                                            <Text style={styles.suggestionText}>{term}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => {
                                if (item.type === 'user') {
                                    return (
                                        <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                                            <Image source={{ uri: item.data.avatar_url || 'https://api.dicebear.com/9.x/micah/png?seed=' + item.data.username }} style={styles.avatar} />
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text variant="body" weight="bold" color="textPrimary">{item.data.full_name}</Text>
                                                    <Text variant="caption" color="textTertiary" style={{ marginLeft: 6 }}>@{item.data.username}</Text>
                                                </View>
                                                {item.data.bio && (
                                                    <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>{item.data.bio}</Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                } else {
                                    return (
                                        <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                                            <View style={styles.postIconWrapper}>
                                                <Icon name={item.data.post_type === 'knowledge_card' ? 'book-open' : 'file-text'} size={18} color={colors.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <View style={styles.categoryBadge}>
                                                        <Text variant="caption" weight="bold" color="primary">{item.data.category || 'İÇERİK'}</Text>
                                                    </View>
                                                    <Text variant="caption" color="textTertiary" style={{ marginLeft: 6 }}>{item.data.read_time_minutes} dk okuma</Text>
                                                </View>
                                                <Text variant="body" weight="bold" color="textPrimary" style={{ marginTop: 4 }} numberOfLines={1}>{item.data.title}</Text>
                                                {item.data.short_description && (
                                                    <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>{item.data.short_description}</Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }
                            }}
                            ListEmptyComponent={() => (
                                !loading ? (
                                    <View style={styles.noResults}>
                                        <Icon name="search-x" size={48} color={colors.border} />
                                        <Text color="textSecondary" style={{ marginTop: spacing.md }}>Sonuç bulunamadı.</Text>
                                    </View>
                                ) : null
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: Platform.OS === 'web' ? 100 : 60,
    },
    modalContent: {
        width: '100%',
        maxWidth: 600,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    input: {
        flex: 1,
        height: 40,
        marginLeft: spacing.md,
        fontSize: typography.sizes.lg,
        color: colors.textPrimary,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any)
    },
    escBadge: {
        backgroundColor: colors.background,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    emptyState: {
        padding: spacing.xl,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    suggestionText: {
        marginLeft: spacing.md,
        fontSize: 15,
        color: colors.textPrimary,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.md,
        backgroundColor: colors.borderHighlight
    },
    postIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    categoryBadge: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    noResults: {
        padding: spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
