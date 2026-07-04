import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, FlatList, Platform, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';

import { CATEGORY_LABELS } from '../../constants/categories';

const CATEGORIES = ['Tümü', ...CATEGORY_LABELS];
const SORT_TABS = [
    { id: 'trend', label: 'Trend', icon: 'flame' },
    { id: 'bugun', label: 'Bugün Popüler', icon: 'sun' },
    { id: 'yeni', label: 'Yeni', icon: 'sparkles' },
    { id: 'kaydedilen', label: 'En Çok Kaydedilen', icon: 'bookmark' },
    { id: 'tartisisan', label: 'En Çok Tartışılan', icon: 'message-circle' }
];

interface FeedHeaderProps {
    activeCategory: string;
    onCategorySelect: (cat: string) => void;
    onSearchChange: (query: string) => void;
    onKnowledgeHubPress?: () => void;
}

export const FeedHeader = React.memo(({ activeCategory, onCategorySelect, onSearchChange, onKnowledgeHubPress }: FeedHeaderProps) => {
    const [localSearch, setLocalSearch] = useState('');

    // Debounce search input (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            onSearchChange(localSearch);
        }, 300);
        return () => clearTimeout(handler);
    }, [localSearch, onSearchChange]);

    return (
        <View style={styles.container}>
            {/* Main Search Box & Knowledge Hub Btn */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}>
                <View style={[styles.searchBar, { flex: 1, marginBottom: 0 }]}>
                    <Icon name="search" size={20} color={colors.textSecondary} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Mentis'te ara..."
                        placeholderTextColor={colors.textSecondary}
                        value={localSearch}
                        onChangeText={setLocalSearch}
                    />
                </View>
                
                {/* Mobile Knowledge Hub Button (Visible only if prop passed, e.g. on mobile layout) */}
                {onKnowledgeHubPress && (
                    <TouchableOpacity style={styles.hubBtn} onPress={onKnowledgeHubPress}>
                        <Icon name="layout" size={20} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Category Chips */}
            <View style={styles.chipsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.chip, activeCategory === item && styles.chipActive]}
                            onPress={() => onCategorySelect(item)}
                        >
                            <Text 
                                variant="label" 
                                color={activeCategory === item ? "surface" : "textSecondary"} 
                                weight="bold"
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingBottom: spacing.lg,
    },
    searchBar: {
        height: 52,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    searchInput: {
        marginLeft: spacing.md,
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any)
    },
    hubBtn: {
        width: 52,
        height: 52,
        borderRadius: radius.circle,
        backgroundColor: colors.surface,
        marginLeft: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    chipsContainer: {
        marginBottom: spacing.lg,
    },
    chip: {
        paddingHorizontal: spacing.xl,
        paddingVertical: 10,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any)
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    }
});
