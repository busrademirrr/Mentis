import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { Screen, Header } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius } from '../theme';
import { debateService } from '../services/debateService';
import { useAuth } from '../context/AuthContext';
import { Post, DebateMessage } from '../types/database.types';

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
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!debateId || !user) return;
        
        loadDebate();
        loadMessages();
        
        // Auto-join room
        debateService.joinRoom(debateId, user.id);

        const msgSub = debateService.subscribeToMessages(debateId, (newMsg) => {
            setMessages((prev) => [...prev, newMsg]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        const statSub = debateService.subscribeToStats(debateId, () => {
            // Optional: refresh debate stats if needed
            loadDebate();
        });

        return () => {
            msgSub.unsubscribe();
            statSub.unsubscribe();
        };
    }, [debateId, user]);

    const loadDebate = async () => {
        // Fetch specific debate (assuming debateService has getDebateById, if not we add it)
        // For now, let's assume we can fetch it or pass it.
        // I will add a mock fetch if missing, but let's implement getDebateById in service later.
        setLoading(false);
    };

    const loadMessages = async () => {
        const msgs = await debateService.getMessages(debateId);
        setMessages(msgs);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    };

    const handleSend = async () => {
        if (!inputText.trim() || !user) return;
        const msg = inputText.trim();
        setInputText('');
        const success = await debateService.sendMessage(debateId, user.id, msg);
        if (!success) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Mesaj gönderilemedi.' });
            setInputText(msg); // revert
        }
    };

    const handleUpvote = (msgId: string) => {
        Toast.show({ type: 'success', text1: 'Beğenildi', text2: 'Argümana destek verdiniz.' });
        // RPC call to upvote
    };

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
                    
                    {!isMe && (
                        <TouchableOpacity style={styles.upvoteBtn} onPress={() => handleUpvote(item.id)}>
                            <Icon name="arrow-up" size={14} color={colors.textSecondary} />
                            <Text variant="caption" color="textSecondary" style={{marginLeft: 4}}>{item.upvotes}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Screen backgroundColor="background" withSafeTop>
            <Header title="Arena" showBack={true} />
            
            {/* Sticky Stats Header */}
            <View style={styles.statsHeader}>
                <View style={styles.statItem}>
                    <Icon name="users" size={16} color={colors.textSecondary} />
                    <Text variant="label" weight="bold" color="textPrimary" style={{marginLeft: 6}}>Canlı</Text>
                </View>
                <View style={styles.vsBar}>
                    <View style={[styles.vsProgress, { flex: 0.6, backgroundColor: '#ef4444' }]} />
                    <View style={[styles.vsProgress, { flex: 0.4, backgroundColor: '#3b82f6' }]} />
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
                {/* Side Selector */}
                <View style={styles.sideSelector}>
                    <TouchableOpacity 
                        style={[styles.sideBtn, selectedSide === 'A' && styles.sideBtnActiveA]}
                        onPress={() => setSelectedSide('A')}
                    >
                        <Text variant="label" weight="bold" color={selectedSide === 'A' ? 'surface' : 'textSecondary'}>Taraf A</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.sideBtn, selectedSide === 'B' && styles.sideBtnActiveB]}
                        onPress={() => setSelectedSide('B')}
                    >
                        <Text variant="label" weight="bold" color={selectedSide === 'B' ? 'surface' : 'textSecondary'}>Taraf B</Text>
                    </TouchableOpacity>
                </View>

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Argümanınızı yazın..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!inputText.trim()}>
                        <Icon name="send" size={20} color={inputText.trim() ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    statsHeader: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
    },
    vsBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        flexDirection: 'row',
        overflow: 'hidden',
        marginLeft: spacing.md,
    },
    vsProgress: {
        height: '100%',
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        maxWidth: '85%',
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
        marginTop: 4,
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
        borderColor: colors.border,
        borderBottomLeftRadius: 4,
    },
    upvoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: radius.pill,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    sideSelector: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        gap: spacing.sm,
    },
    sideBtn: {
        flex: 1,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    sideBtnActiveA: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
    },
    sideBtnActiveB: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sendBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    }
});
