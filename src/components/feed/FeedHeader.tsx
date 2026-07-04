import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, FlatList, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { useResponsive } from '../../hooks/useResponsive';

const CATEGORIES = ['Hepsi', 'Felsefe', 'Tarih', 'Sanat'];

interface FeedHeaderProps {
    activeCategory: string;
    onCategorySelect: (cat: string) => void;
    onSearchChange: (query: string) => void;
}

export const FeedHeader = React.memo(({ activeCategory, onCategorySelect, onSearchChange }: FeedHeaderProps) => {
    const navigation = useNavigation<any>();
    const [localSearch, setLocalSearch] = useState('');
    const { isDesktop, isTablet } = useResponsive();
    const isWebLayout = isDesktop || isTablet;

    // Debounce search input (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            onSearchChange(localSearch);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearch, onSearchChange]);

    return (
        <View style={styles.container}>
            {/* Top Toolbar (Hidden on Desktop/Tablet to prevent duplication) */}
            {!isWebLayout && (
                <View style={styles.header}>
                    <Text variant="h2" weight="bold" color="primary" style={styles.logo}>Mentis.</Text>
                    <View style={styles.headerRight}>
                        <AnimatedPressable style={styles.proBtn} onPress={() => Toast.show({ type: 'info', text1: 'Yakında!', text2: 'Pro özellikler çok yakında sizlerle olacak.' })}>
                            <Text variant="caption" weight="bold" color="surface">☆PRO</Text>
                        </AnimatedPressable>
                        <View style={styles.streakWrap}>
                            <Text variant="label" weight="bold" color="#f97316">12</Text>
                            <Icon name="zap" size={18} color="#f97316" />
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Inbox')} style={{ marginLeft: spacing.sm }}>
                            <Icon name="send" size={24} color="textPrimary" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bellWrap} onPress={() => navigation.navigate('Notifications')}>
                            <Icon name="bell" size={24} color="textPrimary" />
                            <View style={styles.bellDot} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Search Bar (Hidden on Desktop/Tablet if we move it to WebLayout) */}
            {!isWebLayout && (
                <View style={styles.searchBar}>
                    <View style={styles.searchLeft}>
                        <Icon name="search" size={20} color="textSecondary" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Kültür arşivinde ara..."
                            placeholderTextColor={colors.textSecondary}
                            value={localSearch}
                            onChangeText={setLocalSearch}
                        />
                    </View>
                    <AnimatedPressable 
                        style={styles.aiButtonWrap}
                        onPress={() => Toast.show({ type: 'info', text1: 'Kültür Tarayıcı', text2: 'Yapay zeka ile kültür tarama özelliği yakında!' })}
                    >
                        <LinearGradient
                            colors={['#8b5cf6', '#3b82f6']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.aiButton}
                        >
                            <Icon name="maximize" size={16} color="surface" />
                        </LinearGradient>
                    </AnimatedPressable>
                </View>
            )}

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
                                {item === 'Felsefe' ? '🧠 ' : item === 'Tarih' ? '🏛️ ' : item === 'Sanat' ? '🎨 ' : ''}{item}
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
    },
    logo: {
        fontSize: 28,
        letterSpacing: -1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    proBtn: {
        backgroundColor: '#fbbf24',
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
    },
    streakWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    bellWrap: {
        position: 'relative',
    },
    bellDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
        borderWidth: 1,
        borderColor: colors.background,
    },
    searchBar: {
        height: 54,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    searchLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    searchInput: {
        marginLeft: spacing.sm,
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
    },
    aiButtonWrap: {
        backgroundColor: '#e0e7ff',
        padding: 4,
        borderRadius: 20,
    },
    aiButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipsContainer: {
        marginBottom: spacing.xl,
        flexDirection: 'row',
    },
    chip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center'
    },
    chipActive: {
        backgroundColor: '#1f2937',
        borderColor: '#1f2937'
    }
});
