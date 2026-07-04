import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius } from '../../theme';
import { CommentV4 } from '../../services/commentsService';
import { supabase } from '../../lib/supabase';

interface CommentInputProps {
    onSubmit: (content: string, parentId?: string, mentionedIds?: string[]) => Promise<void>;
    replyingTo?: CommentV4 | null;
    onCancelReply: () => void;
    editingComment?: CommentV4 | null;
    onCancelEdit: () => void;
    onSubmitEdit: (content: string) => Promise<void>;
}

export const CommentInput: React.FC<CommentInputProps> = ({
    onSubmit, replyingTo, onCancelReply, editingComment, onCancelEdit, onSubmitEdit
}) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Mentions state
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<any[]>([]);
    const [mentionedIds, setMentionedIds] = useState<string[]>([]);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (replyingTo) {
            inputRef.current?.focus();
        }
    }, [replyingTo]);

    useEffect(() => {
        if (editingComment) {
            setText(editingComment.content);
            inputRef.current?.focus();
        } else if (!replyingTo) {
            setText('');
        }
    }, [editingComment]);

    // Simple mention detection
    useEffect(() => {
        const words = text.split(' ');
        const lastWord = words[words.length - 1];
        if (lastWord.startsWith('@') && lastWord.length > 1) {
            const query = lastWord.substring(1);
            setMentionSearch(query);
            searchUsers(query);
        } else {
            setMentionSearch(null);
        }
    }, [text]);

    const searchUsers = async (query: string) => {
        const { data } = await supabase
            .from('user_profiles')
            .select('user_id, username, full_name, avatar_url')
            .ilike('username', `${query}%`)
            .limit(5);
        if (data) setMentionResults(data);
    };

    const handleSelectMention = (user: any) => {
        const words = text.split(' ');
        words.pop(); // remove partial
        words.push(`@${user.username} `);
        setText(words.join(' '));
        setMentionSearch(null);
        setMentionedIds(prev => [...prev, user.user_id]);
    };

    const handleSubmit = async () => {
        if (!text.trim() || loading) return;
        setLoading(true);
        try {
            if (editingComment) {
                await onSubmitEdit(text);
            } else {
                await onSubmit(text, replyingTo?.id, mentionedIds);
            }
            setText('');
            setMentionedIds([]);
            inputRef.current?.blur();
        } catch (error: any) {
            alert(error.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {mentionSearch && mentionResults.length > 0 && (
                <View style={styles.mentionsContainer}>
                    <FlatList
                        data={mentionResults}
                        keyExtractor={item => item.user_id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({item}) => (
                            <TouchableOpacity style={styles.mentionItem} onPress={() => handleSelectMention(item)}>
                                {item.avatar_url ? (
                                    <Image source={{uri: item.avatar_url}} style={styles.mentionAvatar} />
                                ) : (
                                    <View style={styles.mentionAvatarPlaceholder}>
                                        <Icon name="user" size={14} color={colors.textTertiary} />
                                    </View>
                                )}
                                <View>
                                    <Text variant="body" weight="medium">{item.username}</Text>
                                    <Text variant="caption" color="textSecondary">{item.full_name}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            <View style={styles.container}>
                {(replyingTo || editingComment) && (
                    <View style={styles.replyHeader}>
                        <Text variant="caption" color="textSecondary">
                            {editingComment ? 'Yorumu Düzenle' : `Yanıtlanıyor: @${replyingTo?.author_username}`}
                        </Text>
                        <TouchableOpacity onPress={editingComment ? onCancelEdit : onCancelReply}>
                            <Icon name="x" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                )}
                
                <View style={styles.inputRow}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Fikrini paylaş..."
                        placeholderTextColor={colors.textTertiary}
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity 
                        style={[styles.sendBtn, (!text.trim() || loading) && styles.sendBtnDisabled]} 
                        onPress={handleSubmit}
                        disabled={!text.trim() || loading}
                    >
                        <Icon name="send" size={18} color={text.trim() ? colors.surface : colors.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderColor: colors.borderHighlight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.sm,
    },
    replyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
        paddingBottom: spacing.sm,
        marginBottom: spacing.xs,
        borderBottomWidth: 1,
        borderColor: colors.borderHighlight,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingTop: 12,
        paddingBottom: 12,
        minHeight: 44,
        maxHeight: 120,
        color: colors.textPrimary,
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    mentionsContainer: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderColor: colors.borderHighlight,
        maxHeight: 150,
        position: 'absolute',
        bottom: '100%',
        left: 0, right: 0,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    mentionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderBottomWidth: 1,
        borderColor: colors.background,
    },
    mentionAvatar: {
        width: 32, height: 32, borderRadius: 16,
        marginRight: spacing.sm,
    },
    mentionAvatarPlaceholder: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.borderHighlight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.sm,
    }
});
