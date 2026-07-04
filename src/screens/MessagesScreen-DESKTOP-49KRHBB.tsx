import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, SafeAreaView } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius, typography } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { messagingService, ChatListItem, MentisMessage } from '../services/messagingService';
import { NewChatModal } from '../components/messaging/NewChatModal';
import { useResponsive } from '../hooks/useResponsive';
import { useNavigation } from '@react-navigation/native';

export const MessagesScreen = ({ route }: any) => {
    const { user } = useAuth();
    const { isDesktop } = useResponsive();
    const navigation = useNavigation<any>();
    const styles = useStyles();
    
    // States
    const [conversations, setConversations] = useState<ChatListItem[]>([]);
    const [messages, setMessages] = useState<MentisMessage[]>([]);
    const [activeConvo, setActiveConvo] = useState<ChatListItem | null>(null);
    const [inputText, setInputText] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [pageOffset, setPageOffset] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isNewChatModalVisible, setNewChatModalVisible] = useState(false);
    
    // Realtime States
    const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [chatError, setChatError] = useState<string | null>(null);
    
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const activeConvoRef = useRef<string | null>(null);

    // Initial Load: Chat List
    useEffect(() => {
        if (!user?.id) return;
        loadConversations();

        const channel = supabase.channel(`conversations_list_${user.id}_${Date.now()}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
                loadConversations();
            }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    const loadConversations = async () => {
        setChatError(null);
        try {
            const data = await messagingService.getChatList();
            setConversations(data);
            
            // If navigating from Profile with a userId, open that chat immediately
            if (route?.params?.userId) {
                const targetUserId = route.params.userId;
                // Check if conversation exists
                const existingConvo = data.find(c => c.partner && c.partner.id === targetUserId);
                if (existingConvo) {
                    setActiveConvo(existingConvo);
                } else {
                    // Create a new conversation and set it as active
                    try {
                        const newConvoId = await messagingService.getOrCreateDirectConversation(targetUserId);
                        // Reload conversations to get the new list with this convo
                        const newData = await messagingService.getChatList();
                        setConversations(newData);
                        const newConvo = newData.find(c => c.id === newConvoId);
                        if (newConvo) setActiveConvo(newConvo);
                    } catch (err) {
                        console.error('Failed to create conversation', err);
                    }
                }
                // Clear the param so it doesn't reopen on every render
                navigation.setParams({ userId: undefined });
            }
        } catch (e: any) {
            console.error("Failed to load chats", e);
            setChatError(e.message || "Sohbetler yüklenemedi");
        } finally {
            setLoadingChats(false);
        }
    };

    // Load Messages & Setup Channels for Active Conversation
    useEffect(() => {
        activeConvoRef.current = activeConvo?.id || null;
        if (!activeConvo || !user?.id) return;
        
        loadInitialMessages(activeConvo.id);
        markUnreadAsRead(activeConvo);
        setIsTyping(false);

        // Realtime Subscription for Messages & Reads
        const msgChannel = supabase.channel(`messages_${activeConvo.id}_${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvo.id}` }, (payload) => {
                const newMsg = payload.new as MentisMessage;
                if (activeConvoRef.current === activeConvo.id) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [newMsg, ...prev];
                    });
                    if (newMsg.sender_id !== user.id) {
                        messagingService.markAsRead(newMsg.id, user.id);
                    }
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvo.id}` }, (payload) => {
                const updatedMsg = payload.new as MentisMessage;
                setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reads' }, (payload) => {
                const newRead = payload.new;
                setReadReceipts(prev => ({ ...prev, [newRead.message_id]: newRead.read_at }));
            });

        // Typing Broadcast Channel
        const typingChannel = supabase.channel(`typing_${activeConvo.id}_${Date.now()}`);
        typingChannel
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.user_id !== user.id) {
                    setIsTyping(payload.payload.is_typing);
                }
            });

        msgChannel.subscribe();
        typingChannel.subscribe();

        return () => { 
            supabase.removeChannel(msgChannel); 
            supabase.removeChannel(typingChannel);
        };
    }, [activeConvo?.id]);

    const loadInitialMessages = async (convoId: string) => {
        setLoadingMessages(true);
        setPageOffset(0);
        try {
            const msgs = await messagingService.getMessages(convoId, 50, 0);
            setMessages(msgs);
            setHasMoreMessages(msgs.length === 50);
            
            const myMsgIds = msgs.filter(m => m.sender_id === user?.id).map(m => m.id);
            if (myMsgIds.length > 0) {
                const receipts = await messagingService.getReadReceipts(myMsgIds);
                const rm: Record<string, string> = {};
                receipts.forEach(r => { rm[r.message_id] = r.read_at; });
                setReadReceipts(prev => ({ ...prev, ...rm }));
            }
        } catch (e) {
            console.error("Failed to load msgs", e);
        } finally {
            setLoadingMessages(false);
        }
    };

    const loadMoreMessages = async () => {
        if (!hasMoreMessages || loadingMessages || !activeConvo) return;
        
        const nextOffset = pageOffset + 50;
        try {
            const moreMsgs = await messagingService.getMessages(activeConvo.id, 50, nextOffset);
            if (moreMsgs.length > 0) {
                setMessages(prev => [...prev, ...moreMsgs]);
                setPageOffset(nextOffset);
                setHasMoreMessages(moreMsgs.length === 50);
                
                const myMsgIds = moreMsgs.filter(m => m.sender_id === user?.id).map(m => m.id);
                if (myMsgIds.length > 0) {
                    const receipts = await messagingService.getReadReceipts(myMsgIds);
                    const rm: Record<string, string> = {};
                    receipts.forEach(r => { rm[r.message_id] = r.read_at; });
                    setReadReceipts(prev => ({ ...prev, ...rm }));
                }
            } else {
                setHasMoreMessages(false);
            }
        } catch (e) {}
    };

    const markUnreadAsRead = async (convo: ChatListItem) => {
        if (convo.unread_count > 0 && messages.length > 0) {
            const unreadMsgs = messages.filter(m => m.sender_id !== user?.id);
            for (const m of unreadMsgs) {
                await messagingService.markAsRead(m.id, user!.id);
            }
            setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, unread_count: 0 } : c));
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeConvo || !user) return;
        
        const tempText = inputText.trim();
        setInputText('');
        handleTyping(false); // Stop typing immediately
        
        try {
            const sentMsg = await messagingService.sendMessage(activeConvo.id, user.id, tempText);
            if (sentMsg) {
                setMessages(prev => {
                    if (prev.some(m => m.id === sentMsg.id)) return prev;
                    return [sentMsg, ...prev];
                });
            }
        } catch (e) {
            console.error(e);
            setInputText(tempText);
        }
    };

    const handleTyping = (isCurrentlyTyping: boolean) => {
        if (!activeConvo || !user) return;
        messagingService.sendTypingEvent(activeConvo.id, user.id, isCurrentlyTyping);
    };

    const handleInputTextChange = (text: string) => {
        setInputText(text);
        
        if (!activeConvo || !user) return;
        
        if (text.trim().length > 0) {
            handleTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                handleTyping(false);
            }, 3000);
        } else {
            handleTyping(false);
        }
    };

    const handleChatCreated = (conversationId: string, partner: any) => {
        loadConversations();
        setActiveConvo({
            id: conversationId,
            conversation_type: 'direct',
            last_message_at: new Date().toISOString(),
            partner: partner,
            last_message: null,
            unread_count: 0
        });
    };

    const formatTime = (dateString: string) => {
        try { return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } 
        catch { return ''; }
    };

    const getOnlineStatusText = (lastActiveAt: string | null) => {
        if (!lastActiveAt) return 'Çevrimdışı';
        const diffMs = new Date().getTime() - new Date(lastActiveAt).getTime();
        if (diffMs < 5 * 60000) return 'Çevrimiçi';
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} dakika önce aktifti`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} saat önce aktifti`;
        return 'Çevrimdışı';
    };

    const isUserOnline = (lastActiveAt: string | null) => {
        if (!lastActiveAt) return false;
        return (new Date().getTime() - new Date(lastActiveAt).getTime()) < 5 * 60000;
    };

    const renderConvo = ({ item }: { item: ChatListItem }) => {
        const isOnline = item.partner ? isUserOnline(item.partner.last_active_at) : false;

        return (
            <TouchableOpacity 
                style={[styles.convoItem, activeConvo?.id === item.id && styles.convoActive]}
                onPress={() => setActiveConvo(item)}
            >
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: item.partner?.avatar_url || 'https://api.dicebear.com/9.x/micah/png?seed=' + (item.partner?.username || 'unknown') }} style={styles.convoAvatar} />
                    {isOnline && <View style={styles.onlineBadge} />}
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={styles.convoHeader}>
                        <Text variant="body" weight="bold" color={item.unread_count > 0 ? 'primary' : 'textPrimary'} numberOfLines={1}>{item.partner?.name || 'Bilinmeyen Kullanıcı'}</Text>
                        <Text variant="caption" color={item.unread_count > 0 ? 'primary' : 'textTertiary'} weight={item.unread_count > 0 ? 'bold' : 'normal'}>
                            {formatTime(item.last_message_at)}
                        </Text>
                    </View>
                    <Text variant="caption" color={item.unread_count > 0 ? 'textPrimary' : 'textSecondary'} weight={item.unread_count > 0 ? 'bold' : 'normal'} numberOfLines={1}>
                        {item.last_message?.is_deleted ? 'Bu mesaj silindi' : (item.last_message?.content || 'Sohbeti başlat...')}
                    </Text>
                </View>
                {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}><Text variant="caption" weight="bold" color="surface">{item.unread_count}</Text></View>
                )}
            </TouchableOpacity>
        );
    };

    const renderMessage = ({ item }: { item: MentisMessage }) => {
        const isMe = item.sender_id === user?.id;
        const isDeleted = item.is_deleted;
        const isRead = !!readReceipts[item.id];

        return (
            <View style={[styles.messageBubbleWrapper, isMe ? styles.messageMe : styles.messageThem]}>
                {isDeleted ? (
                    <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleThem, { opacity: 0.5 }]}>
                        <Text color={isMe ? 'surface' : 'textSecondary'} style={{ fontStyle: 'italic' }}>Bu mesaj silindi</Text>
                    </View>
                ) : (
                    <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                        <Text color={isMe ? 'surface' : 'textPrimary'}>{item.content}</Text>
                    </View>
                )}
                
                <View style={[styles.msgMetaRow, { alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>
                    <Text variant="caption" color="textTertiary" style={{ fontSize: 10 }}>
                        {formatTime(item.created_at)}
                    </Text>
                    {isMe && !isDeleted && (
                        <View style={{ marginLeft: 4 }}>
                            <Icon name="check-check" size={12} color={isRead ? colors.primary : colors.textTertiary} />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // Responsive layouts
    const renderChatList = () => {
        if (!isDesktop && activeConvo) return null;
        return (
        <View style={[styles.leftCol, !isDesktop && { width: '100%' }]}>
            <View style={styles.leftHeader}>
                <Text variant="h2" weight="bold" color="textPrimary">Mesajlar</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setNewChatModalVisible(true)}>
                    <Icon name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>
            {loadingChats ? (
                <View style={styles.emptyCenter}><ActivityIndicator color={colors.primary} /></View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    renderItem={renderConvo}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyCenter}>
                            {chatError && <Text color="textSecondary" style={{ color: 'red', marginBottom: spacing.md }}>{chatError}</Text>}
                            <Icon name="message-square" size={32} color={colors.border} />
                            <Text color="textSecondary" style={{ marginTop: spacing.md }}>Henüz sohbetiniz bulunmuyor</Text>
                        </View>
                    )}
                />
            )}
        </View>
        );
    };

    const renderChatView = () => {
        if (!activeConvo) {
            if (!isDesktop) return null; // Mobile: show only list if no active convo
            return (
                <View style={styles.centerCol}>
                    <View style={styles.emptyCenter}>
                        {chatError && (
                            <Text color="textSecondary" style={{ color: 'red', marginBottom: spacing.md, textAlign: 'center' }}>
                                Veri yüklenirken hata oluştu: {chatError}
                            </Text>
                        )}
                        <View style={styles.emptyIconBg}>
                            <Icon name="message-circle" size={48} color={colors.textSecondary} />
                        </View>
                        <Text variant="h3" weight="bold" color="textPrimary" style={{ marginTop: spacing.lg }}>Sohbet Başlatın</Text>
                        <Text color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>Yeni bir mesaj gönderin veya mevcut bir sohbeti seçin.</Text>
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => setNewChatModalVisible(true)}>
                            <Text color="surface" weight="bold">Kişi Bul</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        const partnerOnline = isUserOnline(activeConvo.partner.last_active_at);

        return (
            <View style={[styles.centerCol, !isDesktop ? { flex: 1 } : {}]}>
                <View style={styles.chatHeader}>
                    {!isDesktop && (
                        <TouchableOpacity onPress={() => setActiveConvo(null)} style={{ marginRight: spacing.sm, padding: spacing.xs }}>
                            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={styles.chatHeaderAvatarContainer}
                        onPress={() => navigation.navigate('Profile', { userId: activeConvo.partner.id })}
                    >
                        <Image source={{ uri: activeConvo.partner.avatar_url || 'https://api.dicebear.com/9.x/micah/png?seed=' + activeConvo.partner.username }} style={styles.chatAvatar} />
                        {partnerOnline && <View style={[styles.onlineBadge, { bottom: 2, right: 2 }]} />}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={{ flex: 1 }}
                        onPress={() => navigation.navigate('Profile', { userId: activeConvo.partner.id })}
                    >
                        <Text variant="body" weight="bold" color="textPrimary">{activeConvo.partner.name}</Text>
                        <Text variant="caption" color={partnerOnline ? "primary" : "textTertiary"}>
                            {isTyping ? 'yazıyor...' : getOnlineStatusText(activeConvo.partner.last_active_at)}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}><Icon name="more-vertical" size={20} color={colors.textSecondary} /></TouchableOpacity>
                </View>
                
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatContent}
                    inverted={true}
                    onEndReached={loadMoreMessages}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMessages ? <ActivityIndicator style={{ padding: 20 }} color={colors.primary} /> : null}
                />
                
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.inputArea}>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Bir mesaj yazın..."
                            placeholderTextColor={colors.textTertiary}
                            value={inputText}
                            onChangeText={handleInputTextChange}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.sendBtn, !inputText.trim() && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} 
                            onPress={handleSendMessage} 
                            disabled={!inputText.trim()}
                        >
                            <Icon name="send" size={18} color={inputText.trim() ? "surface" : colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        );
    };

    return (
        <Screen withSafeTop backgroundColor="background" hideRightSidebar>
            <View style={styles.container}>
                {renderChatList()}
                {renderChatView()}
            </View>

            {isNewChatModalVisible && (
                <NewChatModal 
                    visible={isNewChatModalVisible} 
                    onClose={() => setNewChatModalVisible(false)} 
                    onChatCreated={handleChatCreated}
                />
            )}
        </Screen>
    );
};

function useStyles() { return StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: colors.background, borderRadius: radius.lg, overflow: 'hidden', height: '100%', maxHeight: 900, borderWidth: 1, borderColor: colors.border },
    leftCol: { width: 340, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface },
    centerCol: { flex: 1, backgroundColor: colors.background },
    leftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
    iconBtn: { padding: spacing.xs, borderRadius: radius.pill },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
    searchInput: { flex: 1, height: 38, marginLeft: spacing.sm, color: colors.textPrimary, ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any) },
    convoItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, ...(Platform.OS === 'web' && { cursor: 'pointer' } as any) },
    convoActive: { backgroundColor: 'rgba(99, 102, 241, 0.05)' },
    avatarContainer: { position: 'relative', marginRight: spacing.md },
    convoAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border },
    onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.surface },
    convoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    unreadBadge: { backgroundColor: colors.primary, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm, paddingHorizontal: 6 },
    chatHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface, height: 72 },
    chatHeaderAvatarContainer: { position: 'relative', marginRight: spacing.md },
    chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border },
    chatContent: { padding: spacing.lg },
    messageBubbleWrapper: { marginBottom: spacing.sm, maxWidth: '75%' },
    messageMe: { alignSelf: 'flex-end' },
    messageThem: { alignSelf: 'flex-start' },
    messageBubble: { padding: spacing.md, borderRadius: radius.lg },
    bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleThem: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
    msgMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    inputArea: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
    attachBtn: { padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.pill, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
    chatInput: { flex: 1, backgroundColor: colors.background, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 12, minHeight: 44, maxHeight: 120, color: colors.textPrimary, ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any) },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
    emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
    emptyIconBg: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    primaryBtn: { marginTop: spacing.xl, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.md },
}); }
