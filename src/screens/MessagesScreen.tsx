import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius } from '../theme';
import { Screen } from '../components/layout';
import { getConversations, getMessages, sendMessage, subscribeToMessages, Conversation, Message } from '../services/messagingService';
import { useResponsive } from '../hooks/useResponsive';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute } from '@react-navigation/native';
import { CURRENT_USER_ID } from '../services/profileService'; // Assume we have this for demo purposes

export const MessagesScreen = () => {
    const route = useRoute<any>();
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation.id);
            const unsubscribe = subscribeToMessages(activeConversation.id, (msg) => {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
            });
            return () => unsubscribe();
        }
    }, [activeConversation]);

    const loadConversations = async () => {
        setLoading(true);
        const data = await getConversations();
        setConversations(data);
        if (data.length > 0 && !activeConversation && !route.params?.userId) {
            setActiveConversation(data[0]);
        }
        setLoading(false);
    };

    const loadMessages = async (convId: string) => {
        const data = await getMessages(convId);
        setMessages(data);
        scrollToBottom();
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !activeConversation) return;
        setSending(true);
        
        // Optimistic update
        const tempId = `temp_${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            conversation_id: activeConversation.id,
            sender_id: CURRENT_USER_ID,
            content: newMessage,
            message_type: 'text',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');
        scrollToBottom();

        const sentMsg = await sendMessage(activeConversation.id, tempMsg.content);
        if (sentMsg) {
            setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
        }
        setSending(false);
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const getOtherParticipant = (conv: Conversation) => {
        return conv.participants?.find((p: any) => p.user_id !== CURRENT_USER_ID)?.user;
    };

    if (loading && conversations.length === 0) {
        return (
            <Screen backgroundColor="background" withSafeTop hideRightSidebar>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </Screen>
        );
    }

    const renderConversationsList = () => (
        <View style={styles.leftColumn}>
            <View style={styles.listHeader}>
                <Text variant="h2" weight="bold" color="textPrimary">Mesajlar</Text>
                <TouchableOpacity style={styles.newMessageBtn}>
                    <Icon name="edit" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
                <Icon name="search" size={16} color={colors.textSecondary} />
                <TextInput 
                    placeholder="Sohbetlerde ara..." 
                    placeholderTextColor={colors.textSecondary}
                    style={styles.searchInput}
                />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {conversations.map(conv => {
                    const otherUser = getOtherParticipant(conv);
                    const isActive = activeConversation?.id === conv.id;
                    return (
                        <TouchableOpacity 
                            key={conv.id} 
                            style={[styles.convItem, isActive && styles.convItemActive]}
                            onPress={() => setActiveConversation(conv)}
                        >
                            <View style={styles.avatarWrapper}>
                                <View style={styles.avatarPlaceholder}>
                                    <Text variant="h3" color="surface">{otherUser?.name?.[0] || 'U'}</Text>
                                </View>
                                {otherUser?.online_status && <View style={styles.onlineDot} />}
                            </View>
                            <View style={styles.convInfo}>
                                <View style={styles.convHeader}>
                                    <Text variant="label" weight="bold" color="textPrimary" numberOfLines={1}>{otherUser?.name || 'Kullanıcı'}</Text>
                                    <Text variant="caption" color="textTertiary">
                                        {conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    </Text>
                                </View>
                                <Text variant="body" color={isActive ? 'textPrimary' : 'textSecondary'} numberOfLines={1}>
                                    {conv.last_message?.content || 'Sohbeti başlat'}
                                </Text>
                            </View>
                            {conv.unread_count ? (
                                <View style={styles.unreadBadge}>
                                    <Text variant="caption" weight="bold" color="surface">{conv.unread_count}</Text>
                                </View>
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderActiveChat = () => {
        if (!activeConversation) {
            return (
                <View style={styles.centerColumnEmpty}>
                    <Icon name="message-square" size={48} color={colors.border} style={{ marginBottom: spacing.lg }} />
                    <Text variant="h3" color="textSecondary">Bir sohbet seçin veya yeni mesaj gönderin.</Text>
                </View>
            );
        }

        const otherUser = getOtherParticipant(activeConversation);

        return (
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.centerColumn}
            >
                {/* Chat Header */}
                <View style={styles.chatHeader}>
                    <View style={styles.chatHeaderLeft}>
                        <View style={styles.chatHeaderAvatar}>
                            <Text variant="h3" color="surface">{otherUser?.name?.[0] || 'U'}</Text>
                        </View>
                        <View>
                            <Text variant="h3" weight="bold" color="textPrimary">{otherUser?.name || 'Kullanıcı'}</Text>
                            <Text variant="caption" color={otherUser?.online_status ? "success" : "textTertiary"}>
                                {otherUser?.online_status ? 'Çevrimiçi' : 'Çevrimdışı'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.chatHeaderRight}>
                        <TouchableOpacity style={styles.headerAction}><Icon name="search" size={20} color={colors.textSecondary} /></TouchableOpacity>
                        <TouchableOpacity style={styles.headerAction}><Icon name="more-vertical" size={20} color={colors.textSecondary} /></TouchableOpacity>
                    </View>
                </View>

                {/* Messages List */}
                <ScrollView 
                    ref={scrollViewRef}
                    style={styles.messagesList} 
                    contentContainerStyle={styles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((msg, index) => {
                        const isOwn = msg.sender_id === CURRENT_USER_ID;
                        const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                        
                        return (
                            <View key={msg.id} style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
                                {!isOwn && (
                                    <View style={styles.messageAvatar}>
                                        {showAvatar ? <Text variant="caption" color="surface" weight="bold">{msg.sender?.name?.[0] || 'U'}</Text> : null}
                                    </View>
                                )}
                                <LinearGradient
                                    colors={isOwn ? ['#a78bfa', '#8b5cf6'] : [colors.surface, colors.surface]}
                                    style={[
                                        styles.messageBubble, 
                                        isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                                        !isOwn && { borderWidth: 1, borderColor: colors.borderHighlight }
                                    ]}
                                >
                                    <Text variant="body" color={isOwn ? "surface" : "textPrimary"}>{msg.content}</Text>
                                    <Text variant="caption" color={isOwn ? "rgba(255,255,255,0.7)" : "textTertiary"} style={styles.messageTime}>
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </Text>
                                </LinearGradient>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Composer */}
                <View style={styles.composer}>
                    <TouchableOpacity style={styles.composerAttach}><Icon name="paperclip" size={20} color={colors.textSecondary} /></TouchableOpacity>
                    <TextInput 
                        style={styles.composerInput}
                        placeholder="Bir mesaj yazın..."
                        placeholderTextColor={colors.textTertiary}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                        onSubmitEditing={Platform.OS === 'web' ? (e) => {
                            if (!(e.nativeEvent as any).shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        } : undefined}
                    />
                    <TouchableOpacity style={[styles.composerSend, !newMessage.trim() && { opacity: 0.5 }]} onPress={handleSend} disabled={!newMessage.trim() || sending}>
                        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.composerSendGradient}>
                            <Icon name="send" size={16} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    };

    const renderRightPanel = () => {
        if (!activeConversation) return null;
        const otherUser = getOtherParticipant(activeConversation);
        
        return (
            <View style={styles.rightColumn}>
                <View style={styles.rightProfileCard}>
                    <View style={styles.rightAvatarLarge}>
                        <Text variant="h1" color="surface">{otherUser?.name?.[0] || 'U'}</Text>
                    </View>
                    <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.md }}>{otherUser?.name || 'Kullanıcı'}</Text>
                    <Text variant="body" color="textSecondary" style={{ marginBottom: spacing.md }}>@{otherUser?.handle || 'kullanici'}</Text>
                    
                    <View style={styles.rightStatsRow}>
                        <View style={styles.rightStat}>
                            <Icon name="award" size={16} color="#f59e0b" />
                            <Text variant="label" weight="bold" color="textPrimary" style={{ marginTop: 4 }}>Altın Lig</Text>
                        </View>
                        <View style={styles.rightStat}>
                            <Icon name="book-open" size={16} color="#3b82f6" />
                            <Text variant="label" weight="bold" color="textPrimary" style={{ marginTop: 4 }}>24k İtibar</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.rightSection}>
                    <Text variant="label" weight="bold" color="textSecondary" style={{ marginBottom: spacing.md }}>Ortak İlgi Alanları</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                        <View style={styles.chip}><Text variant="caption" color="textPrimary">Tarih</Text></View>
                        <View style={styles.chip}><Text variant="caption" color="textPrimary">Ahlak Felsefesi</Text></View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <Screen backgroundColor="background" hideRightSidebar padding="none">
            {isWebDesktop ? (
                <View style={styles.desktopContainer}>
                    {renderConversationsList()}
                    {renderActiveChat()}
                    {renderRightPanel()}
                </View>
            ) : (
                <View style={styles.mobileContainer}>
                    {activeConversation ? renderActiveChat() : renderConversationsList()}
                </View>
            )}
        </Screen>
    );
};

const styles = StyleSheet.create({
    desktopContainer: {
        flex: 1,
        flexDirection: 'row',
        maxWidth: 1600,
        alignSelf: 'center',
        width: '100%',
        backgroundColor: colors.background,
    },
    mobileContainer: {
        flex: 1,
    },
    // Left Column
    leftColumn: {
        width: 320,
        borderRightWidth: 1,
        borderRightColor: colors.borderHighlight,
        backgroundColor: colors.surface,
        display: 'flex',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.xl,
        paddingBottom: spacing.md,
    },
    newMessageBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        color: colors.textPrimary,
        height: '100%',
        ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
    },
    convItem: {
        flexDirection: 'row',
        padding: spacing.lg,
        paddingHorizontal: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        alignItems: 'center',
    },
    convItemActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        paddingLeft: spacing.xl - 3,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: spacing.md,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.success,
        borderWidth: 2,
        borderColor: colors.surface,
    },
    convInfo: {
        flex: 1,
    },
    convHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    unreadBadge: {
        backgroundColor: colors.error,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        marginLeft: spacing.sm,
    },
    // Center Column
    centerColumn: {
        flex: 1,
        backgroundColor: colors.background,
        display: 'flex',
    },
    centerColumnEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        height: 72,
    },
    chatHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatHeaderAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    chatHeaderRight: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    headerAction: {
        padding: spacing.xs,
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        padding: spacing.xl,
        gap: spacing.lg,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        maxWidth: '80%',
    },
    messageRowOwn: {
        alignSelf: 'flex-end',
    },
    messageRowOther: {
        alignSelf: 'flex-start',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.borderHighlight,
        marginRight: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageBubble: {
        padding: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.lg,
        minWidth: 80,
    },
    messageBubbleOwn: {
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        borderBottomLeftRadius: 4,
    },
    messageTime: {
        alignSelf: 'flex-end',
        marginTop: 4,
        fontSize: 10,
    },
    composer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
    },
    composerAttach: {
        padding: spacing.sm,
        marginRight: spacing.sm,
        marginBottom: 4,
    },
    composerInput: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 44,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        color: colors.textPrimary,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
    },
    composerSend: {
        marginLeft: spacing.md,
        marginBottom: 4,
    },
    composerSendGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Right Column
    rightColumn: {
        width: 320,
        borderLeftWidth: 1,
        borderLeftColor: colors.borderHighlight,
        backgroundColor: colors.surface,
        padding: spacing.xl,
    },
    rightProfileCard: {
        alignItems: 'center',
        paddingBottom: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        marginBottom: spacing.xl,
    },
    rightAvatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.background,
    },
    rightStatsRow: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    rightStat: {
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: radius.md,
        minWidth: 90,
    },
    rightSection: {
        marginBottom: spacing.xl,
    },
    chip: {
        backgroundColor: colors.background,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    }
});
