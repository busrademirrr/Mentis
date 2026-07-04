import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius, typography } from '../../theme';
import { supabase } from '../../lib/supabase';
import { messagingService } from '../../services/messagingService';
import { useAuth } from '../../context/AuthContext';

interface NewChatModalProps {
    visible: boolean;
    onClose: () => void;
    onChatCreated: (conversationId: string, partner: any) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ visible, onClose, onChatCreated }) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        const searchUsers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, username, avatar_value, bio')
                .neq('id', user?.id)
                .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
                .limit(10);
                
            if (data && !error) {
                setResults(data);
            }
            setLoading(false);
        };

        const timeout = setTimeout(searchUsers, 500);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleSelectUser = async (selectedUser: any) => {
        setCreating(true);
        try {
            const conversationId = await messagingService.getOrCreateDirectConversation(selectedUser.id);
            onChatCreated(conversationId, {
                id: selectedUser.id,
                name: selectedUser.full_name,
                username: selectedUser.username,
                avatar_url: selectedUser.avatar_value
            });
            onClose();
        } catch (error) {
            console.error('Failed to create chat', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text variant="h3" weight="bold" color="textPrimary">Kişi Bul</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="x" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBox}>
                        <Icon name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Kullanıcı adı veya isim ara..."
                            placeholderTextColor={colors.textTertiary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Icon name="x-circle" size={18} color={colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.userRow}
                                    onPress={() => handleSelectUser(item)}
                                    disabled={creating}
                                >
                                    <Image 
                                        source={{ uri: item.avatar_value || 'https://api.dicebear.com/9.x/micah/png?seed=' + item.username }} 
                                        style={styles.avatar} 
                                    />
                                    <View style={styles.userInfo}>
                                        <Text variant="body" weight="bold" color="textPrimary">{item.full_name}</Text>
                                        <Text variant="caption" color="textSecondary">@{item.username}</Text>
                                    </View>
                                    <Icon name="message-circle" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                searchQuery.length >= 2 ? (
                                    <View style={styles.centerContainer}>
                                        <Text color="textSecondary">Sonuç bulunamadı.</Text>
                                    </View>
                                ) : (
                                    <View style={styles.centerContainer}>
                                        <Icon name="users" size={32} color={colors.border} />
                                        <Text color="textTertiary" style={{ marginTop: spacing.md }}>Sohbet başlatmak için birini arayın</Text>
                                    </View>
                                )
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', maxWidth: 500, height: '70%', maxHeight: 600, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    closeBtn: { padding: spacing.xs, backgroundColor: colors.background, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 48, marginBottom: spacing.md },
    searchIcon: { marginRight: spacing.sm },
    searchInput: { flex: 1, height: '100%', fontSize: typography.sizes.md, color: colors.textPrimary, ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any) },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: spacing.lg },
    userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border, marginRight: spacing.md },
    userInfo: { flex: 1 },
});
