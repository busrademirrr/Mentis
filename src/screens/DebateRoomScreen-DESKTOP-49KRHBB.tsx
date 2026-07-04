import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Screen, Header } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius, typography } from '../theme';
import { debateService } from '../services/debateService';
import { useAuth } from '../context/AuthContext';
import { Post, DebateMessage } from '../types/database.types';
import { supabase } from '../lib/supabase';

export const DebateRoomScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { user } = useAuth();
    const debateId = route.params?.debateId;

    const [debate, setDebate] = useState<Post | null>(null);
    const [messages, setMessages] = useState<DebateMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!debateId || !user) return;
        
        loadDebate();
        loadMessages();
        
        debateService.joinRoom(debateId, user.id);

        const msgSub = debateService.subscribeToMessages(debateId, (newMsg) => {
            setMessages((prev) => [...prev, newMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        // Track Debate View
        console.log(`[ANALYTICS] DEBATE_VIEWED | user_id: ${user.id} | debate_id: ${debateId}`);

        return () => {
            msgSub.unsubscribe();
        };
    }, [debateId, user]);

    const loadDebate = async () => {
        try {
            const { data, error } = await supabase.from('posts').select(`*, user:author_id(username, full_name, avatar_url)`).eq('id', debateId).single();
            if (error) throw error;
            setDebate(data);
            
            // Check if user voted
            const { data: voteData } = await supabase.from('user_debate_votes').select('selected_option').eq('post_id', debateId).eq('user_id', user!.id).single();
            if (voteData) {
                setHasVoted(true);
                setSelectedSide(voteData.selected_option as 'A' | 'B');
            }
        } catch (e) {
            console.error("Failed to load debate:", e);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async () => {
        const msgs = await debateService.getMessages(debateId);
        setMessages(msgs);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    };

    const handleVote = async (side: 'A' | 'B') => {
        if (hasVoted) return;
        setSelectedSide(side);
        setHasVoted(true);
        
        // Optimistically update debate payload stats
        setDebate(prev => {
            if (!prev) return prev;
            const newPayload = { ...prev.payload };
            if (side === 'A') newPayload.votes_A = (newPayload.votes_A || 0) + 1;
            if (side === 'B') newPayload.votes_B = (newPayload.votes_B || 0) + 1;
            return { ...prev, payload: newPayload };
        });

        console.log(`[ANALYTICS] DEBATE_VOTED | user_id: ${user?.id} | debate_id: ${debateId} | side: ${side}`);
        Toast.show({ type: 'success', text1: 'Oyunuz Kaydedildi', text2: `${side} tarafını seçtiniz.` });
        
        try {
            await supabase.from('debate_votes').insert({
                post_id: debateId,
                user_id: user?.id,
                selected_option: side
            });
        } catch (error) {
            console.error('Failed to submit debate vote', error);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !user || !selectedSide) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen bir taraf seçin ve mesaj yazın.' });
            return;
        }
        const msg = inputText.trim();
        setInputText('');
        console.log(`[ANALYTICS] DEBATE_COMMENTED | user_id: ${user?.id} | debate_id: ${debateId}`);
        const success = await debateService.sendMessage(debateId, user.id, msg);
        if (!success) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Mesaj gönderilemedi.' });
            setInputText(msg);
        }
    };

    const handleShare = () => {
        console.log(`[ANALYTICS] DEBATE_SHARED | user_id: ${user?.id} | debate_id: ${debateId}`);
        Toast.show({ type: 'info', text1: 'Paylaşım', text2: 'Tartışma linki kopyalandı!' });
    };

    if (loading) {
        return (
            <Screen backgroundColor="background" withSafeTop>
                <Header title="Arena" showBack={true} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </Screen>
        );
    }

    if (!debate) {
        return (
            <Screen backgroundColor="background" withSafeTop>
                <Header title="Arena" showBack={true} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name="alert-circle" size={48} color={colors.textTertiary} />
                    <Text variant="h2" color="textTertiary" style={{ marginTop: spacing.md }}>İçerik yüklenemedi</Text>
                </View>
            </Screen>
        );
    }

    const payload = debate.payload;
    const titleA = payload?.side_a || 'A';
    const titleB = payload?.side_b || 'B';
    const statsA = payload?.votes_A || 0;
    const statsB = payload?.votes_B || 0;
    const totalVotes = statsA + statsB || 1;
    const percentA = Math.round((statsA / totalVotes) * 100);
    const percentB = Math.round((statsB / totalVotes) * 100);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text variant="caption" weight="bold" color="primary" style={styles.categoryBadge}>{debate.category}</Text>
            <Text variant="h1" weight="bold" color="textPrimary" style={styles.title}>{debate.title}</Text>
            {debate.content ? <Text variant="body" color="textSecondary" style={styles.description}>{debate.content}</Text> : null}
            
            <View style={styles.statsRow}>
                <Text variant="caption" color="textTertiary">{statsA + statsB} Oy • {messages.length} Yorum</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                    <Icon name="share-2" size={16} color={colors.textSecondary} />
                    <Text variant="caption" color="textSecondary" style={{marginLeft: 4}}>Paylaş</Text>
                </TouchableOpacity>
            </View>

            {/* Voting Area */}
            <View style={styles.votingArea}>
                <TouchableOpacity 
                    style={[styles.voteCard, styles.voteCardA, hasVoted && selectedSide === 'A' && styles.voteCardActiveA]}
                    onPress={() => handleVote('A')}
                    activeOpacity={0.8}
                >
                    <Text variant="h3" weight="bold" color={hasVoted && selectedSide === 'A' ? '#ef4444' : 'textPrimary'} style={{textAlign: 'center'}}>{titleA}</Text>
                    {hasVoted && <Text variant="caption" color="textSecondary" style={{marginTop: 4}}>{percentA}%</Text>}
                </TouchableOpacity>
                <View style={styles.vsBadge}>
                    <Text variant="label" weight="bold" color="textSecondary">VS</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.voteCard, styles.voteCardB, hasVoted && selectedSide === 'B' && styles.voteCardActiveB]}
                    onPress={() => handleVote('B')}
                    activeOpacity={0.8}
                >
                    <Text variant="h3" weight="bold" color={hasVoted && selectedSide === 'B' ? '#3b82f6' : 'textPrimary'} style={{textAlign: 'center'}}>{titleB}</Text>
                    {hasVoted && <Text variant="caption" color="textSecondary" style={{marginTop: 4}}>{percentB}%</Text>}
                </TouchableOpacity>
            </View>
            
            {hasVoted && (
                <View style={styles.vsProgressBar}>
                    <View style={[styles.vsProgressFill, { width: `${percentA}%`, backgroundColor: '#ef4444' }]} />
                    <View style={[styles.vsProgressFill, { width: `${percentB}%`, backgroundColor: '#3b82f6' }]} />
                </View>
            )}
        </View>
    );

    const renderMessage = ({ item }: { item: DebateMessage }) => {
        const isMe = item.user_id === user?.id;
        return (
            <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                {!isMe && (
                    <View style={styles.avatar}>
                        <Text variant="caption" weight="bold" color="surface">
                            {item.user?.username?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
                <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                    {!isMe && <Text variant="caption" weight="bold" color="textSecondary" style={{ marginBottom: 4 }}>{item.user?.username}</Text>}
                    <Text variant="body" color={isMe ? 'surface' : 'textPrimary'}>{item.message}</Text>
                </View>
            </View>
        );
    };

    return (
        <Screen backgroundColor="background" withSafeTop>
            <Header title="Tartışma" showBack={true} />
            
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: spacing.xl, color: colors.textTertiary}}>Henüz argüman yok. İlk yorumu sen yap!</Text>}
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    {!hasVoted && (
                        <View style={styles.votePrompt}>
                            <Icon name="info" size={16} color={colors.primary} />
                            <Text variant="caption" color="primary" style={{marginLeft: 6}}>Yorum yapmak için önce tarafını seç!</Text>
                        </View>
                    )}
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, !hasVoted && styles.inputDisabled]}
                            placeholder={hasVoted ? "Argümanınızı yazın..." : "Tarafını seç..."}
                            placeholderTextColor={colors.textTertiary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            editable={hasVoted}
                        />
                        <TouchableOpacity style={[styles.sendBtn, !hasVoted && {opacity: 0.5}]} onPress={handleSend} disabled={!inputText.trim() || !hasVoted}>
                            <Icon name="send" size={20} color={inputText.trim() && hasVoted ? colors.primary : colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        marginBottom: spacing.md,
    },
    categoryBadge: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.pill,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: typography.sizes.xl,
        lineHeight: 30,
        marginBottom: spacing.sm,
    },
    description: {
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
    },
    votingArea: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
    },
    voteCard: {
        flex: 1,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        backgroundColor: colors.surface,
        minHeight: 100,
    },
    voteCardA: {
        borderTopLeftRadius: radius.lg,
        borderBottomLeftRadius: radius.lg,
        borderRightWidth: 0,
    },
    voteCardB: {
        borderTopRightRadius: radius.lg,
        borderBottomRightRadius: radius.lg,
        borderLeftWidth: 0,
    },
    voteCardActiveA: {
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderColor: '#ef4444',
        borderRightWidth: 1,
        zIndex: 1,
    },
    voteCardActiveB: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderColor: '#3b82f6',
        borderLeftWidth: 1,
        zIndex: 1,
    },
    vsBadge: {
        position: 'absolute',
        left: '50%',
        marginLeft: -16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    vsProgressBar: {
        flexDirection: 'row',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: spacing.md,
    },
    vsProgressFill: {
        height: '100%',
    },
    listContent: {
        paddingBottom: spacing.xxl,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        maxWidth: '85%',
        paddingHorizontal: spacing.md,
    },
    messageRowMe: {
        alignSelf: 'flex-end',
    },
    messageRowOther: {
        alignSelf: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    messageBubble: {
        padding: spacing.md,
        borderRadius: radius.lg,
    },
    messageBubbleMe: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderBottomLeftRadius: 4,
    },
    inputContainer: {
        padding: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        backgroundColor: colors.background,
    },
    votePrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
        padding: spacing.sm,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingTop: 12,
        paddingBottom: 12,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    inputDisabled: {
        backgroundColor: colors.background,
        color: colors.textTertiary,
    },
    sendBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    }
});
