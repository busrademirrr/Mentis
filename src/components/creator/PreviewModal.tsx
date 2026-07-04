import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { HeroCard } from '../feed/HeroCard';
import { DiscussionCard } from '../feed/DiscussionCard';
import { QuizCard } from '../feed/QuizCard';
import { useAuth } from '../../context/AuthContext';

interface PreviewModalProps {
    visible: boolean;
    onClose: () => void;
    contentType: 'info' | 'debate' | 'quiz' | null;
    formData: any;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ visible, onClose, contentType, formData }) => {
    const { user, profile } = useAuth();

    if (!visible || !contentType) return null;

    // Construct mock post data to feed into the cards
    const mockPost: any = {
        id: 'preview-123',
        title: formData.title || formData.question || 'Başlık Belirtilmedi',
        content: formData.content || '',
        short_description: formData.short_description || '',
        category: formData.category || 'Genel',
        type: contentType === 'info' ? 'knowledge_card' : contentType,
        created_at: new Date().toISOString(),
        payload: {
            ...formData,
            // mapping for debate
            side_a: formData.option_a,
            side_b: formData.option_b,
            votes_A: 0,
            votes_B: 0,
            // mapping for quiz
            options: formData.options,
            correct_index: formData.correct_index,
            difficulty: formData.difficulty,
            xp_reward: formData.difficulty === 'Uzman' ? 500 : (formData.difficulty === 'Zor' ? 250 : (formData.difficulty === 'Orta' ? 100 : 50))
        },
        author_full_name: profile?.full_name || user?.user_metadata?.full_name || 'Önizleme Kullanıcısı',
        author_username: profile?.username || user?.user_metadata?.username || 'onizleme_user',
        author_avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url,
        likes_count: 0,
        comments_count: 0,
        saves_count: 0,
        user_has_liked: false,
        user_has_saved: false,
        user: {
            full_name: profile?.full_name || 'Önizleme',
            username: profile?.username || 'onizleme',
            avatar_url: profile?.avatar_url
        }
    };

    const renderCard = () => {
        switch (contentType) {
            case 'info':
                return <HeroCard post={mockPost} onToggleLike={() => {}} onToggleSave={() => {}} />;
            case 'debate':
                return <DiscussionCard post={mockPost} onVote={() => {}} />;
            case 'quiz':
                return <QuizCard item={mockPost} />;
            default:
                return null;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text variant="h2" weight="bold" color="textPrimary">İçerik Önizlemesi</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="x" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.previewNote}>
                            <Icon name="info" size={16} color={colors.primary} />
                            <Text variant="caption" color="textSecondary" style={{ marginLeft: 8, flex: 1 }}>
                                Bu bir önizlemedir. Yayınlandıktan sonra akışta bu şekilde görünecektir.
                            </Text>
                        </View>
                        
                        <View style={styles.cardWrapper}>
                            {renderCard()}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.editBtn} onPress={onClose}>
                            <Text variant="body" weight="bold" color="textPrimary">Düzenlemeye Dön</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        ...(Platform.OS === 'web' && { backdropFilter: 'blur(4px)' } as any),
    },
    modalContainer: {
        width: '100%',
        maxWidth: 600,
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
        backgroundColor: colors.surface,
    },
    closeBtn: {
        padding: spacing.xs,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    previewNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    cardWrapper: {
        alignItems: 'center',
        width: '100%',
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        backgroundColor: colors.surface,
        alignItems: 'flex-end',
    },
    editBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.pill,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    }
});
