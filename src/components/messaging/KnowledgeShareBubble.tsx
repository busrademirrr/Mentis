import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius } from '../../theme';

interface KnowledgeShareBubbleProps {
    metadata: {
        post_id: string;
        title: string;
        category: string;
        preview_text: string;
        cover_url?: string;
    };
    isMe: boolean;
}

export const KnowledgeShareBubble: React.FC<KnowledgeShareBubbleProps> = ({ metadata, isMe }) => {
    const navigation = useNavigation<any>();

    const handlePress = () => {
        // Navigate to the knowledge detail screen
        navigation.navigate('KnowledgeDetail', { postId: metadata.post_id });
    };

    return (
        <TouchableOpacity 
            style={[styles.container, isMe ? styles.containerMe : styles.containerThem]} 
            onPress={handlePress}
            activeOpacity={0.9}
        >
            {metadata.cover_url && (
                <Image source={{ uri: metadata.cover_url }} style={styles.coverImage} />
            )}
            
            <View style={styles.contentArea}>
                <View style={styles.categoryRow}>
                    <Icon name="book-open" size={12} color={colors.primary} />
                    <Text variant="caption" weight="bold" color="primary" style={{ marginLeft: 4, textTransform: 'uppercase' }}>
                        {metadata.category || 'BİLGİ KARTI'}
                    </Text>
                </View>
                
                <Text variant="body" weight="bold" color={isMe ? 'surface' : 'textPrimary'} style={styles.title} numberOfLines={2}>
                    {metadata.title}
                </Text>
                
                {metadata.preview_text && (
                    <Text variant="caption" color={isMe ? 'surface' : 'textSecondary'} style={[styles.preview, isMe && { opacity: 0.8 }]} numberOfLines={3}>
                        {metadata.preview_text}
                    </Text>
                )}

                <View style={styles.footerRow}>
                    <Text variant="caption" weight="bold" color={isMe ? 'surface' : 'primary'}>İncele</Text>
                    <Icon name="arrow-right" size={14} color={isMe ? colors.surface : colors.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 260,
        borderRadius: radius.md,
        overflow: 'hidden',
        borderWidth: 1,
    },
    containerMe: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryDark,
    },
    containerThem: {
        backgroundColor: colors.surface,
        borderColor: colors.borderHighlight,
    },
    coverImage: {
        width: '100%',
        height: 120,
        backgroundColor: colors.borderHighlight,
    },
    contentArea: {
        padding: spacing.md,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    title: {
        marginBottom: spacing.xs,
        lineHeight: 20,
    },
    preview: {
        marginBottom: spacing.md,
        lineHeight: 18,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(150, 150, 150, 0.2)',
        paddingTop: spacing.sm,
    }
});
