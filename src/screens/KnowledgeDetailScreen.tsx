import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Platform, Share, Modal, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius, typography } from '../theme';
import { knowledgeService, KnowledgeDetailResult } from '../services/knowledgeService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
// A dummy markdown renderer. In a real project, react-native-markdown-display or similar is used.
// import Markdown from 'react-native-markdown-display'; 

export const KnowledgeDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    
    let { postId, post } = route.params || {};
    if (!postId && post?.id) {
        postId = post.id;
    }

    // States
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<KnowledgeDetailResult | null>(null);
    const [toc, setToc] = useState<{ id: string, title: string, level: number }[]>([]);
    
    // Interactions
    const [stats, setStats] = useState({ likes: 0, comments: 0, views: 0 });
    const [me, setMe] = useState({ has_liked: false, is_following: false, is_saved: false });
    
    // Progress Tracking
    const [readSeconds, setReadSeconds] = useState(0);
    const [maxScrollPercent, setMaxScrollPercent] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Save Quote Modal
    const [isQuoteModalVisible, setQuoteModalVisible] = useState(false);
    const [quoteText, setQuoteText] = useState('');

    useEffect(() => {
        if (!postId) return;
        loadDetail();
        
        // Log view
        knowledgeService.logPostView(postId);

        // Realtime Stats
        const channel = supabase.channel(`public:knowledge:${postId}_${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post_interactions', filter: `post_id=eq.${postId}` }, () => {
                refreshStats();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => {
                refreshStats();
            })
            .subscribe();

        // Reading Timer
        timerRef.current = setInterval(() => {
            setReadSeconds(prev => prev + 1);
        }, 1000);

        return () => {
            supabase.removeChannel(channel);
            if (timerRef.current) clearInterval(timerRef.current);
            // Save progress on unmount
            saveProgressOnUnmount();
        };
    }, [postId]);

    const saveProgressOnUnmount = () => {
        if (!postId) return;
        // Use maxScrollPercent and readSeconds (which are enclosed in closures, so better to use refs in real app, but for demo this is fine if we use latest state via ref or just flush).
        // Since state might be stale in unmount closure, we assume it's an estimate.
        // A robust way is a ref tracking current values.
    };

    // Keep refs updated for unmount
    const progressRef = useRef({ scroll: 0, time: 0 });
    useEffect(() => {
        progressRef.current = { scroll: maxScrollPercent, time: readSeconds };
        // Sync to DB every 30 seconds
        if (readSeconds > 0 && readSeconds % 30 === 0) {
            knowledgeService.logReadProgress(postId, maxScrollPercent, readSeconds);
        }
    }, [maxScrollPercent, readSeconds]);

    useEffect(() => {
        return () => {
            if (postId) {
                knowledgeService.logReadProgress(postId, progressRef.current.scroll, progressRef.current.time);
            }
        };
    }, [postId]);


    const loadDetail = async () => {
        setLoading(true);
        const data = await knowledgeService.getKnowledgeDetail(postId);
        if (data) {
            setDetail(data);
            setStats({ likes: data.stats.likes_count, comments: data.stats.comments_count, views: data.stats.views_count });
            setMe({ has_liked: data.me.has_liked, is_following: data.me.is_following, is_saved: data.me.is_saved });
            
            // Generate TOC from Markdown Headers
            generateTOC(data.post.content);
        }
        setLoading(false);
    };

    const refreshStats = async () => {
        // Fetch only stats
        const data = await knowledgeService.getKnowledgeDetail(postId);
        if (data) {
            setStats({ likes: data.stats.likes_count, comments: data.stats.comments_count, views: data.stats.views_count });
        }
    };

    const generateTOC = (content: string) => {
        if (!content) return;
        const lines = content.split('\\n');
        const tocItems = [];
        let idCounter = 0;
        for (const line of lines) {
            const match = line.match(/^(#{1,3})\\s+(.+)/);
            if (match) {
                tocItems.push({
                    id: `toc_${idCounter++}`,
                    level: match[1].length,
                    title: match[2].trim()
                });
            }
        }
        setToc(tocItems);
    };

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const totalHeight = contentSize.height - layoutMeasurement.height;
        if (totalHeight > 0) {
            const percent = Math.min(100, Math.max(0, Math.round((contentOffset.y / totalHeight) * 100)));
            if (percent > maxScrollPercent) {
                setMaxScrollPercent(percent);
            }
        }
    };

    const handleLike = async () => {
        setMe(prev => ({ ...prev, has_liked: !prev.has_liked }));
        setStats(prev => ({ ...prev, likes: prev.likes + (me.has_liked ? -1 : 1) }));
        await knowledgeService.toggleLike(postId);
    };

    const handleFollow = async () => {
        if (!detail) return;
        setMe(prev => ({ ...prev, is_following: !prev.is_following }));
        await knowledgeService.toggleFollow(detail.author.id);
    };

    const handleSaveQuote = async () => {
        if (!quoteText.trim()) return;
        await knowledgeService.saveQuote(postId, quoteText.trim());
        setQuoteModalVisible(false);
        setQuoteText('');
        alert('Alıntı profilinize başarıyla kaydedildi!');
    };

    const handleDMShare = () => {
        // In a real flow, this opens a modal to select a conversation and sends a message of type 'knowledge_card'
        alert('DM sistemine Knowledge Card objesi gönderilecek. (Phase 1 entegrasyonu)');
    };

    if (loading) {
        return (
            <Screen backgroundColor="background" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </Screen>
        );
    }

    if (!detail) {
        return (
            <Screen backgroundColor="background" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="file-x" size={48} color={colors.textTertiary} />
                <Text variant="h3" color="textSecondary" style={{ marginTop: spacing.md }}>İçerik bulunamadı</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }}>
                    <Text color="primary">Geri Dön</Text>
                </TouchableOpacity>
            </Screen>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header / Top Navigation (Absolute for overlap if Cover exists) */}
            <View style={styles.topNav}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={detail.post.image_url ? colors.surface : colors.textPrimary} />
                </TouchableOpacity>
                {/* Progress Bar Header */}
                <View style={styles.progressHeaderContainer}>
                    <View style={[styles.progressBar, { width: `${maxScrollPercent}%` }]} />
                </View>
            </View>

            <ScrollView 
                ref={scrollRef}
                style={styles.scrollView} 
                onScroll={handleScroll} 
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Cover Image */}
                {detail.post.image_url && (
                    <Image source={{ uri: detail.post.image_url }} style={styles.coverImage} />
                )}

                <View style={[styles.contentArea, !detail.post.image_url && { paddingTop: 80 }]}>
                    
                    {/* Category & Date */}
                    <View style={styles.metaRow}>
                        <View style={styles.categoryBadge}>
                            <Text variant="caption" weight="bold" color="primary">{detail.post.category.toUpperCase()}</Text>
                        </View>
                        <Text variant="caption" color="textTertiary" style={{ marginLeft: spacing.md }}>
                            {detail.post.read_time_minutes} dk okuma • {stats.views} görüntülenme
                        </Text>
                    </View>

                    {/* Title */}
                    <Text variant="h1" weight="black" style={styles.title}>{detail.post.title}</Text>
                    {detail.post.short_description && (
                        <Text variant="h3" color="textSecondary" style={styles.subtitle}>{detail.post.short_description}</Text>
                    )}

                    {/* Author Row */}
                    <View style={styles.authorRow}>
                        <TouchableOpacity style={styles.authorInfo} onPress={() => navigation.navigate('Profile', { userId: detail.author.id })}>
                            <Image source={{ uri: detail.author.avatar_url || 'https://api.dicebear.com/9.x/micah/png?seed=' + detail.author.username }} style={styles.authorAvatar} />
                            <View>
                                <Text variant="body" weight="bold" color="textPrimary">{detail.author.full_name}</Text>
                                <Text variant="caption" color="textSecondary">@{detail.author.username} • {detail.author.followers_count} takipçi</Text>
                            </View>
                        </TouchableOpacity>
                        {user?.id !== detail.author.id && (
                            <TouchableOpacity style={[styles.followBtn, me.is_following && styles.followBtnActive]} onPress={handleFollow}>
                                <Text variant="caption" weight="bold" color={me.is_following ? 'textPrimary' : 'surface'}>
                                    {me.is_following ? 'Takip Ediliyor' : 'Takip Et'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Table of Contents */}
                    {toc.length > 0 && (
                        <View style={styles.tocContainer}>
                            <Text variant="label" weight="bold" style={{ marginBottom: spacing.sm }}>İçindekiler</Text>
                            {toc.map(item => (
                                <TouchableOpacity key={item.id} style={{ paddingVertical: 4, paddingLeft: (item.level - 1) * 12 }}>
                                    <Text variant="body" color="primary" style={{ textDecorationLine: 'underline' }}>{item.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Main Content (Markdown removed temporarily for web compatibility) */}
                    <View style={styles.markdownContainer}>
                        <Text style={{ fontSize: 18, lineHeight: 28, color: colors.textPrimary }}>
                            {detail.post.content}
                        </Text>
                    </View>

                    {/* Highlight Action (Mock) */}
                    <TouchableOpacity style={styles.saveQuoteBlock} onPress={() => setQuoteModalVisible(true)}>
                        <Icon name="bookmark-plus" size={20} color={colors.primary} />
                        <Text variant="body" weight="bold" color="primary" style={{ marginLeft: spacing.sm }}>Metinden Alıntı Kaydet</Text>
                    </TouchableOpacity>

                    {/* Sources Section */}
                    {detail.sources && detail.sources.length > 0 && (
                        <View style={styles.sourcesContainer}>
                            <Text variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>Kaynaklar</Text>
                            {detail.sources.map((source, i) => (
                                <View key={i} style={styles.sourceItem}>
                                    <Icon name="link-2" size={16} color={colors.textSecondary} />
                                    <Text variant="body" color="textPrimary" style={{ marginLeft: spacing.sm }}>{source.title}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Related Knowledge Engine */}
                    {detail.related_posts && detail.related_posts.length > 0 && (
                        <View style={styles.relatedContainer}>
                            <Text variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>Bunlar da İlginizi Çekebilir</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
                                {detail.related_posts.map((rp, i) => (
                                    <TouchableOpacity 
                                        key={i} 
                                        style={styles.relatedCard}
                                        onPress={() => navigation.push('KnowledgeDetail', { postId: rp.id })}
                                    >
                                        <Image source={{ uri: rp.image_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop' }} style={styles.relatedImage} />
                                        <View style={styles.relatedCardContent}>
                                            <Text variant="caption" weight="bold" color="primary">{rp.category}</Text>
                                            <Text variant="body" weight="bold" numberOfLines={2} style={{ marginTop: 4 }}>{rp.title}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Sticky Action Bar - Sadece Bilgi Kartı (knowledge_card) için gösterilir */}
            {(detail.post.type === 'knowledge_card' || detail.post.type === 'article') && (
                <View style={styles.stickyActionBar}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                        <Icon name="heart" size={24} color={me.has_liked ? colors.error : colors.textPrimary} fill={me.has_liked ? colors.error : 'none'} />
                        <Text variant="caption" weight="bold" style={{ marginTop: 2 }}>{stats.likes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Comments', { postId })}>
                        <Icon name="message-circle" size={24} color={colors.textPrimary} />
                        <Text variant="caption" weight="bold" style={{ marginTop: 2 }}>{stats.comments}</Text>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }} />

                    <TouchableOpacity style={styles.actionBtn} onPress={handleDMShare}>
                        <Icon name="send" size={24} color={colors.textPrimary} />
                        <Text variant="caption" style={{ marginTop: 2 }}>Paylaş</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => {
                        knowledgeService.toggleSave(postId);
                        setMe(prev => ({ ...prev, is_saved: !prev.is_saved }));
                    }}>
                        <Icon name="bookmark" size={24} color={me.is_saved ? colors.primary : colors.textPrimary} fill={me.is_saved ? colors.primary : 'none'} />
                        <Text variant="caption" style={{ marginTop: 2 }}>Kaydet</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Save Quote Modal */}
            <Modal visible={isQuoteModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>Alıntı Kaydet</Text>
                        <TextInput 
                            style={styles.quoteInput} 
                            placeholder="Kaydetmek istediğiniz etkileyici cümleyi yapıştırın..." 
                            multiline 
                            value={quoteText}
                            onChangeText={setQuoteText}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md }}>
                            <TouchableOpacity onPress={() => setQuoteModalVisible(false)} style={{ padding: spacing.md }}>
                                <Text color="textSecondary">İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveQuote} style={{ padding: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, marginLeft: spacing.sm }}>
                                <Text color="surface" weight="bold">Alıntıyı Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    topNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
    progressHeaderContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
    progressBar: { height: '100%', backgroundColor: colors.primary },
    scrollView: { flex: 1 },
    coverImage: { width: '100%', height: 350 },
    contentArea: { padding: spacing.xl },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    categoryBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
    title: { fontSize: 32, marginBottom: spacing.sm, lineHeight: 40 },
    subtitle: { fontSize: 20, fontStyle: 'italic', marginBottom: spacing.xl, lineHeight: 28 },
    authorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.borderHighlight, marginBottom: spacing.xl },
    authorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    authorAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: spacing.md },
    followBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.primary },
    followBtnActive: { backgroundColor: colors.borderHighlight },
    tocContainer: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.borderHighlight },
    markdownContainer: { marginBottom: spacing.xxl },
    saveQuoteBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.primaryLight, borderRadius: radius.md, marginBottom: spacing.xxl, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.primary },
    sourcesContainer: { backgroundColor: colors.background, padding: spacing.xl, borderRadius: radius.lg, marginBottom: spacing.xxl },
    sourceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderHighlight },
    relatedContainer: { marginBottom: spacing.xxl },
    relatedCard: { width: 220, marginRight: spacing.md, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderHighlight, backgroundColor: colors.surface },
    relatedImage: { width: '100%', height: 120, backgroundColor: colors.borderHighlight },
    relatedCardContent: { padding: spacing.md },
    stickyActionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderHighlight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
    actionBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxWidth: 500, backgroundColor: colors.surface, padding: spacing.xl, borderRadius: radius.lg },
    quoteInput: { height: 100, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderHighlight, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any) },
});
