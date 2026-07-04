import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Modal, Platform } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius, typography } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const NotificationDrawer = ({ visible, onClose }: Props) => {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!visible || !user?.id) return;
        
        const loadNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (data) setNotifications(data);
        };
        
        loadNotifications();

        // Realtime
        const channel = supabase.channel(`notifications-${user.id}_${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
                setNotifications(prev => [payload.new, ...prev]);
            }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [visible, user?.id]);

    const markAllRead = async () => {
        if (!user?.id) return;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    };

    const handlePress = async (item: any) => {
        // Mark read
        if (!item.is_read) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', item.id);
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        }

        onClose();
        
        if (item.type === 'follow' && item.actor_id) {
            navigation.navigate('Profile', { userId: item.actor_id });
        } else if (item.entity_id) {
            navigation.navigate('Comments', { postId: item.entity_id });
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                
                <View style={styles.drawer}>
                    <View style={styles.header}>
                        <Text variant="h3" weight="bold">Bildirimler</Text>
                        <TouchableOpacity onPress={markAllRead}>
                            <Text variant="caption" weight="medium" color="primary">Tümünü Okundu İşaretle</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={notifications}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.notificationItem, !item.is_read && styles.unreadItem]} 
                                onPress={() => handlePress(item)}
                            >
                                <View style={styles.iconCircle}>
                                    <Icon name={item.type === 'follow' ? 'user-plus' : 'bell'} size={16} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text variant="body" color="textPrimary" style={styles.messageText}>{item.body}</Text>
                                    <Text variant="caption" color="textTertiary" style={{ marginTop: 4 }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                {!item.is_read && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyState}>
                                <Icon name="bell-off" size={32} color={colors.textTertiary} />
                                <Text color="textSecondary" style={{ marginTop: spacing.md }}>Yeni bildiriminiz yok.</Text>
                            </View>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    drawer: {
        width: 380,
        height: '100%',
        backgroundColor: colors.surface,
        borderLeftWidth: 1,
        borderLeftColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: -10, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        ...Platform.select({ web: { maxHeight: '100vh' } as any }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        backgroundColor: colors.background,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        alignItems: 'flex-start',
    },
    unreadItem: {
        backgroundColor: colors.primaryLight,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginLeft: spacing.sm,
        marginTop: 6,
    },
    emptyState: {
        padding: spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    }
});
