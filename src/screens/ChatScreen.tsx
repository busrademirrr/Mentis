import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { Text, Icon } from '../components/ui';

interface Message {
    id: string;
    text: string;
    isSender: boolean;
    timestamp: string;
}

export const ChatView = ({ user }: { user: any }) => {
    const navigation = useNavigation<any>();

    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Merhaba, yazdığın son makale gerçekten ufuk açıcıydı!', isSender: false, timestamp: '10:40' },
        { id: '2', text: 'Teşekkür ederim! Üzerinde çok çalıştım.', isSender: true, timestamp: '10:41' },
        { id: '3', text: 'Bir ara bu konu hakkında daha detaylı konuşalım.', isSender: false, timestamp: '10:42' },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isSender: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        // Simulate typing and reply
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const replyMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Kesinlikle katılıyorum. Fikirlerini duymak isterim.',
                isSender: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, replyMessage]);
        }, 2000);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        return (
            <View style={[styles.messageWrapper, item.isSender ? styles.messageWrapperSender : styles.messageWrapperReceiver]}>
                {!item.isSender && <Image source={{ uri: user.avatar }} style={styles.messageAvatar} />}
                <View style={[styles.bubble, item.isSender ? styles.bubbleSender : styles.bubbleReceiver]}>
                    <Text style={[styles.messageText, item.isSender ? styles.messageTextSender : styles.messageTextReceiver]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.messageTimestamp, item.isSender ? styles.messageTimestampSender : styles.messageTimestampReceiver]}>
                        {item.timestamp} {item.isSender && <Icon name="check" size={10} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerUserInfo}>
                    <Image source={{ uri: user.avatar }} style={styles.headerAvatar} />
                    <View>
                        <Text style={styles.headerUserName}>{user.name}</Text>
                        {isTyping ? (
                            <Text style={styles.typingText}>Yazıyor...</Text>
                        ) : (
                            <Text style={styles.activeStatus}>Çevrimiçi</Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity style={styles.infoBtn}>
                    <Icon name="info" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity style={styles.attachBtn}>
                            <Icon name="plus" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            placeholder="Bir mesaj yaz..."
                            placeholderTextColor={colors.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                    </View>
                    {inputText.trim().length > 0 ? (
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                            <Icon name="send" size={20} color={colors.surface} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.micBtn}>
                            <Icon name="mic" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export const ChatScreen = () => {
    const route = useRoute<any>();
    const { user } = route.params || { user: { name: 'Bilinmeyen Kullanıcı', avatar: 'https://via.placeholder.com/150' } };
    return <ChatView user={user} />;
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        backgroundColor: colors.surface,
    },
    backBtn: {
        padding: spacing.xs,
        marginRight: spacing.sm,
    },
    headerUserInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.sm,
    },
    headerUserName: {
        fontSize: typography.sizes.md,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    activeStatus: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
    },
    typingText: {
        fontSize: typography.sizes.xs,
        color: '#8b5cf6',
        fontWeight: '600',
        fontStyle: 'italic',
    },
    infoBtn: {
        padding: spacing.xs,
    },
    chatList: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
        alignItems: 'flex-end',
    },
    messageWrapperSender: {
        justifyContent: 'flex-end',
    },
    messageWrapperReceiver: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: spacing.sm,
    },
    bubble: {
        maxWidth: '75%',
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    bubbleSender: {
        backgroundColor: '#8b5cf6', // Primary Purple
        borderBottomRightRadius: 4,
    },
    bubbleReceiver: {
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    messageText: {
        fontSize: typography.sizes.md,
        lineHeight: 20,
    },
    messageTextSender: {
        color: colors.surface,
    },
    messageTextReceiver: {
        color: colors.textPrimary,
    },
    messageTimestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
    },
    messageTimestampSender: {
        color: 'rgba(255,255,255,0.7)',
    },
    messageTimestampReceiver: {
        color: colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        paddingHorizontal: spacing.sm,
        marginRight: spacing.sm,
    },
    attachBtn: {
        padding: spacing.xs,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: spacing.sm,
        fontSize: typography.sizes.md,
        color: colors.textPrimary,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#8b5cf6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    micBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
