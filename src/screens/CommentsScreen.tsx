import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { Text, Icon } from '../components/ui';
import { Screen } from '../components/layout';
import { supabase } from '../lib/supabase';
import { CURRENT_USER_ID } from '../services/feedService';
import { Comment } from '../types/database.types';

export const CommentsScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { postId } = route.params || {};

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!postId) return;

        const loadComments = async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('*, user:user_id(username, avatar_url, is_pro)')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setComments(data as any[]);
            }
            setLoading(false);
        };

        loadComments();

        const channel = supabase.channel(`comments-${postId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, () => {
                loadComments(); // Re-fetch to get user details easily, or optimistic append
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [postId]);

    const handleSend = async () => {
        if (!inputText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await supabase.from('comments').insert({
                user_id: CURRENT_USER_ID,
                post_id: postId,
                content: inputText.trim()
            });
            setInputText('');
            // Realtime subscription will fetch it
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentRow}>
            <View style={styles.avatarPlaceholder} />
            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Text variant="label" weight="bold" color="textPrimary">{item.user?.username || 'Anonim'}</Text>
                    <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <Text variant="body" style={styles.commentText}>{item.content}</Text>
            </View>
        </View>
    );

    return (
        <Screen withSafeTop withSafeBottom backgroundColor="background" style={[styles.safeArea, { paddingHorizontal: 0 }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Yorumlar</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
                ) : (
                    <FlatList
                        data={comments}
                        keyExtractor={item => item.id}
                        renderItem={renderComment}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={() => (
                            <View style={styles.center}>
                                <Text color="textSecondary">Henüz yorum yok. İlk yorumu sen yap!</Text>
                            </View>
                        )}
                    />
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Yorum ekle..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
                        onPress={handleSend}
                        disabled={!inputText.trim() || isSubmitting}
                    >
                        <Icon name="send" size={20} color="surface" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.borderHighlight,
    },
    backBtn: { padding: spacing.xs },
    headerTitle: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.textPrimary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    listContent: { padding: spacing.md },
    commentRow: { flexDirection: 'row', marginBottom: spacing.lg },
    avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.borderHighlight, marginRight: spacing.sm },
    commentContent: { flex: 1, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    timestamp: { fontSize: 10, color: colors.textSecondary },
    commentText: { fontSize: typography.sizes.sm, lineHeight: 20 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', padding: spacing.md,
        borderTopWidth: 1, borderTopColor: colors.borderHighlight, backgroundColor: colors.surface
    },
    input: {
        flex: 1, backgroundColor: colors.background, borderRadius: 20, paddingHorizontal: spacing.md,
        paddingVertical: 10, marginRight: spacing.sm, maxHeight: 100
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center'
    }
});
