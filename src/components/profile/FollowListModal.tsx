import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, FlatList, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { followService } from '../../services/followService';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

interface FollowListModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'followers' | 'following';
    userId: string;
}

const FollowButton = ({ targetUserId }: { targetUserId: string }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState<string>('loading');

    useEffect(() => {
        let isMounted = true;
        if (!user || user.id === targetUserId) {
            if (isMounted) setStatus('self');
            return;
        }
        followService.getFollowStatus(targetUserId).then(st => {
            if (isMounted) setStatus(st || 'none');
        });
        return () => { isMounted = false; };
    }, [user, targetUserId]);

    const handlePress = async () => {
        if (!user) return;
        setStatus('loading_action');
        try {
            if (status === 'accepted' || status === 'pending') {
                const res = await followService.unfollow(targetUserId);
                if (res) {
                    setStatus('none');
                    Toast.show({ type: 'info', text1: 'Takipten çıkıldı' });
                } else {
                    // Revert to old status
                    setStatus(status);
                    Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem başarısız' });
                }
            } else {
                const res = await followService.requestFollow(targetUserId);
                if (res.success) {
                    setStatus(res.newStatus);
                    Toast.show({ type: 'success', text1: res.newStatus === 'pending' ? 'Takip isteği gönderildi' : 'Takip ediliyor' });
                } else {
                    setStatus('none');
                    Toast.show({ type: 'error', text1: 'Hata', text2: (res as any).error || 'Takip edilemedi' });
                }
            }
        } catch (e: any) {
            setStatus('none');
            Toast.show({ type: 'error', text1: 'Hata', text2: e.message || 'Bir hata oluştu' });
        }
    };

    if (status === 'self') return null;

    if (status === 'loading') {
        return <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />;
    }

    const isFollowing = status === 'accepted';
    const isPending = status === 'pending';
    const isLoadingAction = status === 'loading_action';

    return (
        <TouchableOpacity 
            style={[
                styles.followBtn, 
                (isFollowing || isPending) && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }
            ]} 
            onPress={handlePress}
            disabled={isLoadingAction}
        >
            {isLoadingAction ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <Text variant="caption" weight="bold" color={(isFollowing || isPending) ? 'textPrimary' : 'surface'}>
                    {isFollowing ? 'Takiptesin' : isPending ? 'İstek Gönderildi' : 'Takip Et'}
                </Text>
            )}
        </TouchableOpacity>
    );
};

export const FollowListModal: React.FC<FollowListModalProps> = ({ visible, onClose, type, userId }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();

    useEffect(() => {
        if (!visible) return;
        let isMounted = true;
        
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = type === 'followers' 
                    ? await followService.getFollowers(userId)
                    : await followService.getFollowing(userId);
                
                if (isMounted) {
                    // Extract the related user object based on type
                    const mappedUsers = data.map((item: any) => type === 'followers' ? item.follower : item.following).filter(Boolean);
                    setUsers(mappedUsers);
                }
            } catch (e) {
                console.error('Error fetching follow list:', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchUsers();
        return () => { isMounted = false; };
    }, [visible, type, userId]);

    const handleUserClick = (id: string) => {
        onClose();
        navigation.push('Profile', { userId: id });
    };

    const renderItem = ({ item }: { item: any }) => {
        const userId = item.id || item.user_id;
        return (
        <TouchableOpacity style={styles.userRow} onPress={() => handleUserClick(userId)}>
            <Image source={{ uri: item.avatar_value || item.avatar_url || 'https://via.placeholder.com/40' }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
                <Text variant="body" weight="bold" color="textPrimary">{item.name || item.full_name || item.username}</Text>
                <Text variant="caption" color="textSecondary">@{item.username}</Text>
            </View>
            <FollowButton targetUserId={userId} />
        </TouchableOpacity>
    )};

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.modalContent, Platform.OS === 'web' && { width: 400, maxWidth: '90%', maxHeight: '80%', borderRadius: radius.xl }]} onStartShouldSetResponder={() => true}>
                    <View style={styles.header}>
                        <Text variant="h3" weight="bold" color="textPrimary">
                            {type === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="X" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    
                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ margin: spacing.xl }} />
                    ) : users.length > 0 ? (
                        <FlatList
                            data={users}
                            keyExtractor={(item) => item.id || item.user_id || Math.random().toString()}
                            renderItem={renderItem}
                            contentContainerStyle={{ padding: spacing.md }}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Text variant="body" color="textSecondary">
                                {type === 'followers' ? 'Henüz takipçi yok.' : 'Henüz kimseyi takip etmiyor.'}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.surface,
        width: '100%',
        maxHeight: '80%',
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        overflow: 'hidden',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    closeBtn: {
        padding: spacing.xs,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.background,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: spacing.md,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    followBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
