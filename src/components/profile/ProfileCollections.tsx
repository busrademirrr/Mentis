import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { CURRENT_USER_ID } from '../../services/profileService';
import { useResponsive } from '../../hooks/useResponsive';
import { useSavedContent } from '../../hooks/useSavedContent';

interface ProfileCollectionsProps {
    type?: 'posts' | 'saved';
}

export const ProfileCollections: React.FC<ProfileCollectionsProps> = ({ type = 'posts' }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { savedItems, loading: savedLoading } = useSavedContent();
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);

    useEffect(() => {
        let isMounted = true;
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('author_id', CURRENT_USER_ID)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                
                if (isMounted && data && data.length > 0) {
                    setPosts(data.map(p => ({
                        id: p.id,
                        title: p.payload?.title || 'İsimsiz İçerik',
                        category: p.payload?.category || 'Genel',
                        likes: Math.floor(Math.random() * 100), // mock stats for now
                        comments: Math.floor(Math.random() * 20),
                        time: new Date(p.created_at).toLocaleDateString()
                    })));
                } else if (isMounted) {
                    // Empty or offline mock fallback
                    setPosts(getOfflineMockPosts());
                }
            } catch (err) {
                console.warn('Supabase offline in ProfileCollections. Using mock data.');
                if (isMounted) setPosts(getOfflineMockPosts());
            }
            setLoading(false);
        };

        const getOfflineMockPosts = () => [
            { id: '1', title: 'Ahlakın kaynağı akıl mıdır, duygu mudur?', category: 'Felsefe', likes: 124, comments: 15, time: '2 gün önce', image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbcb47231?w=400&q=80' },
            { id: '2', title: 'Sürrealizm ve bilinçaltının sanattaki yeri', category: 'Sanat', likes: 89, comments: 34, time: '1 hafta önce', image_url: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=400&q=80' },
            { id: '3', title: 'Rönesans\'ın bilimsel devrime etkisi', category: 'Tarih', likes: 210, comments: 45, time: '2 hafta önce', image_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80' }
        ];

        if (type === 'posts') fetchPosts();
        
        return () => { isMounted = false; };
    }, [type]);

    const displayData = type === 'saved' 
        ? savedItems.map(item => ({
            id: item?.id || Math.random().toString(),
            title: item?.post?.title || 'İsimsiz İçerik',
            category: item?.post?.category || 'Genel',
            likes: 0, comments: 0, time: item?.created_at ? new Date(item.created_at).toLocaleDateString() : 'Bilinmeyen Tarih'
        }))
        : posts;
    
    const isLoading = type === 'saved' ? savedLoading : loading;

    if (isLoading) {
        return (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <Text>Yükleniyor...</Text>
            </View>
        );
    }

    if (displayData.length === 0) {
        return (
            <View style={{ padding: spacing.xl, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderHighlight, marginTop: spacing.md }}>
                <Icon name={type === 'saved' ? 'bookmark' : 'edit-3'} size={48} color={colors.textTertiary} />
                <Text variant="body" color="textSecondary" style={{ marginTop: spacing.md }}>
                    {type === 'saved' ? 'Kaydedilmiş içerik yok.' : 'Henüz içerik üretmediniz.'}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.gridContainer}>
            {displayData.map(post => (
                <TouchableOpacity 
                    key={post.id} 
                    style={styles.gridCard}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardImageContainer}>
                        <View style={{ flex: 1, backgroundColor: colors.borderHighlight, borderRadius: radius.md, overflow: 'hidden' }}>
                            {post?.image_url ? (
                                <Image source={{ uri: post.image_url }} style={{ flex: 1, width: '100%', height: '100%' }} resizeMode="cover" />
                            ) : (
                                <LinearGradient
                                    colors={
                                        post?.category === 'Felsefe' ? ['#ecfdf5', '#a7f3d0'] : 
                                        post?.category === 'Sanat' ? ['#fffbeb', '#fde68a'] : 
                                        post?.category === 'Tarih' ? ['#eff6ff', '#bfdbfe'] : 
                                        ['#f5f3ff', '#ddd6fe']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ flex: 1 }}
                                />
                            )}
                            <View style={styles.cardBookmark}>
                                <Icon name="bookmark" size={16} color="white" />
                            </View>
                            <View style={[styles.cardCategory, { backgroundColor: post?.category === 'Felsefe' ? '#10b981' : post?.category === 'Sanat' ? '#f59e0b' : post?.category === 'Tarih' ? '#3b82f6' : '#8b5cf6' }]}>
                                <Text variant="caption" weight="bold" color="surface" style={{ fontSize: 10 }}>{post?.category || 'Genel'}</Text>
                            </View>
                        </View>
                    </View>
                    <Text variant="label" weight="bold" color="textPrimary" style={styles.cardTitle} numberOfLines={2}>
                        {post?.title || 'İsimsiz İçerik'}
                    </Text>
                    <View style={styles.cardStats}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="heart" size={14} color={colors.textSecondary} />
                                <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>{post?.likes || 0}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="message-circle" size={14} color={colors.textSecondary} />
                                <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>{post?.comments || 0}</Text>
                            </View>
                        </View>
                        <Text variant="caption" color="textSecondary">{post?.time}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};



const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.lg,
        paddingBottom: spacing.xxl,
        paddingTop: spacing.md,
    },
    gridCard: {
        width: Platform.OS === 'web' ? 'calc(33.333% - 16px)' : '100%',
        minWidth: 220,
        marginBottom: spacing.md,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'transform 0.2s' } as any),
    },
    cardImageContainer: {
        height: 160,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        position: 'relative',
    },
    cardBookmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 6,
        borderRadius: radius.circle,
    },
    cardCategory: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    cardTitle: {
        lineHeight: 20,
        marginBottom: spacing.xs,
    },
    cardStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    }
});
