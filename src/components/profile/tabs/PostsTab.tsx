import React from 'react';
import { View, StyleSheet, FlatList, Platform, TouchableOpacity } from 'react-native';
import { spacing, colors, radius, shadows } from '../../../theme';
import { KnowledgeCard } from '../cards/KnowledgeCard';
import { DiscussionCard } from '../cards/DiscussionCard';
import { QuizCard } from '../cards/QuizCard';
import { Text, Icon } from '../../ui';
import { useNavigation } from '@react-navigation/native';

interface PostsTabProps {
    posts: any[];
}

export const PostsTab: React.FC<PostsTabProps> = ({ posts }) => {
    const navigation = useNavigation<any>();

    const renderItem = ({ item }: { item: any }) => {
        switch (item.type) {
            case 'discussion':
                return <DiscussionCard post={item} />;
            case 'quiz':
                return <QuizCard post={item} />;
            case 'article':
            case 'hero':
            default:
                return <KnowledgeCard post={item} />;
        }
    };

    if (!posts || posts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                    <Icon name="PenTool" size={32} color={colors.primary} />
                </View>
                <Text variant="h2" weight="bold" color="textPrimary" style={styles.emptyTitle}>
                    Zihninizi Kağıda Dökün
                </Text>
                <Text variant="body" color="textSecondary" style={styles.emptyDesc}>
                    Burada henüz bir şey yok. Yeni bir bilgi kartı oluşturarak ya da 
                    tartışma başlatarak entelektüel kimliğinizi inşa etmeye başlayın.
                </Text>
                
                <View style={styles.emptyActions}>
                    <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => navigation.navigate('CreateCard')}>
                        <Icon name="Plus" size={16} color="#FFFFFF" />
                        <Text variant="label" weight="bold" color="#FFFFFF" style={{ marginLeft: 8 }}>İlk Gönderini Oluştur</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <View style={styles.feedColumn}>
                    {posts.map((post) => (
                        <View key={post.id}>
                            {renderItem({ item: post })}
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        padding: spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderStyle: 'dashed',
        marginTop: spacing.md,
    },
    emptyIconBox: {
        width: 64,
        height: 64,
        borderRadius: radius.circle,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyDesc: {
        textAlign: 'center',
        maxWidth: 400,
        marginBottom: spacing.xxl,
        lineHeight: 24,
    },
    emptyActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionBtnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        ...shadows.glow,
    },
    feedColumn: {
        width: '100%',
        maxWidth: 860,
        alignSelf: 'center',
    },
    listContent: {
        paddingBottom: spacing.xxl,
    }
});
