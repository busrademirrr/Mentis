import React, { useState } from 'react';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { Icon, BottomSheet, ConfirmModal } from '../ui';
import { colors } from '../../theme';
import { postService } from '../../services/postService';
import { Edit2, Copy, Trash2, User, MessageCircle, Share2, AlertOctagon } from 'lucide-react-native';

interface PostOptionsMenuProps {
    post: any;
    onDelete?: (postId: string) => void;
}

let cachedUserId: string | null = null;
let fetchingPromise: Promise<string | null> | null = null;

export const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({ post, onDelete }) => {
    const [sheetVisible, setSheetVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    React.useEffect(() => {
        if (cachedUserId) {
            setCurrentUserId(cachedUserId);
            return;
        }
        if (!fetchingPromise) {
            fetchingPromise = import('../../lib/supabase').then(({ supabase }) => 
                supabase.auth.getSession().then(({ data }) => {
                    const id = data?.session?.user?.id || null;
                    cachedUserId = id;
                    return id;
                }).catch(() => null)
            );
        }
        fetchingPromise.then(id => {
            if (id) setCurrentUserId(id);
        });
    }, []);

    const postAuthorId = post?.author_id || post?.author?.id || post?.user?.id;
    const isOwner = currentUserId && postAuthorId === currentUserId;

    const handleDeleteClick = () => {
        setSheetVisible(false);
        // Add slight delay for bottom sheet to close smoothly before opening modal on mobile
        setTimeout(() => setConfirmVisible(true), 150);
    };

    const executeDelete = async () => {
        setConfirmVisible(false);
        const targetId = post.id || post.post_id;
        
        try {
            await postService.deletePost(targetId);
            if (onDelete) onDelete(targetId);
        } catch (err: any) {
            console.error("Failed to delete post:", err);
            if (Platform.OS !== 'web') {
                Alert.alert("Hata", `İçerik silinirken bir hata oluştu: ${err.message || JSON.stringify(err)}`);
            } else {
                window.alert(`İçerik silinirken bir hata oluştu: ${err.message || JSON.stringify(err)}`);
            }
        }
    };

    const ownerActions = [
        {
            label: "Sil",
            icon: <Trash2 size={20} color={colors.error} />,
            onPress: handleDeleteClick,
            destructive: true
        }
    ];

    const otherUserActions = [
        {
            label: "Profili Görüntüle",
            icon: <User size={20} color={colors.textPrimary} />,
            onPress: () => console.log("View profile pressed for", post.author_id)
        },
        {
            label: "Mesaj Gönder",
            icon: <MessageCircle size={20} color={colors.textPrimary} />,
            onPress: () => console.log("Send message pressed for", post.author_id)
        },
        {
            label: "İçeriği Paylaş",
            icon: <Share2 size={20} color={colors.textPrimary} />,
            onPress: () => console.log("Share pressed for", post.id)
        },
        {
            label: "Şikayet Et",
            icon: <AlertOctagon size={20} color={colors.error} />,
            onPress: () => console.log("Report pressed for", post.id),
            destructive: true
        }
    ];

    const actions = isOwner ? ownerActions : otherUserActions;

    return (
        <>
            <TouchableOpacity onPress={() => setSheetVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="more-horizontal" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <BottomSheet 
                visible={sheetVisible}
                onClose={() => setSheetVisible(false)}
                actions={actions}
            />

            <ConfirmModal
                visible={confirmVisible}
                title="İçeriği Sil"
                message="Bu içeriği silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                cancelText="İptal"
                isDestructive={true}
                onConfirm={executeDelete}
                onCancel={() => setConfirmVisible(false)}
            />
        </>
    );
};
