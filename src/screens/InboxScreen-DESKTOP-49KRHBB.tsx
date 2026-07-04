import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { Text, Icon } from '../components/ui';
import { useResponsive } from '../hooks/useResponsive';
import { ChatView } from './ChatScreen';
import { WebLayout } from '../components/layout/WebLayout';

// sample Data
const sample_CONVERSATIONS: any[] = [
    {
        id: '1',
        user: { name: 'Sokrates', avatar: 'https://images.unsplash.com/photo-1590680425712-4eb2e2e92c25?w=200' },
        lastMessage: 'Sorgulanmamış bir hayat yaşamaya değmez dostum.',
        timestamp: '10:42',
        unreadCount: 2,
    }
];

export const InboxScreen = () => {
    const navigation = useNavigation<any>();
    const [conversations, setConversations] = useState<any[]>([]);
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = isDesktop || isTablet;
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // TODO: Realtime Supabase subscription for unread count would go here
    // useEffect(() => { ... }, []);

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Icon name="message-square" size={32} color={colors.textSecondary} />
            </View>
            <Text variant="h3" weight="bold" color="textPrimary" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
                Henüz Mesajın Yok
            </Text>
            <Text variant="body" color="textSecondary" align="center" style={{ maxWidth: 250 }}>
                Tartışmalara katıl, filozoflarla tanış ve sohbet etmeye başla.
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: typeof sample_CONVERSATIONS[0] }) => {
        const isUnread = item.unreadCount > 0;
        
        // Avatar fallback initials
        const initials = item.user.name.substring(0, 2).toUpperCase();

        return (
            <TouchableOpacity 
                style={[styles.chatItem, isWebDesktop && selectedUser?.name === item.user.name && styles.chatItemActive]} 
                activeOpacity={0.7}
                onPress={() => {
                    if (isWebDesktop) {
                        setSelectedUser(item.user);
                    } else {
                        navigation.navigate('Chat', { user: item.user });
                    }
                }}
            >
                <View style={styles.avatarContainer}>
                    {item.user.avatar ? (
                        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarFallback]}>
                            <Text variant="body" weight="bold" color="surface">{initials}</Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.userName, isUnread && styles.userNameUnread]} numberOfLines={1}>
                            {item.user.name}
                        </Text>
                        <Text style={[styles.timestamp, isUnread && styles.timestampUnread]}>{item.timestamp}</Text>
                    </View>
                    
                    <View style={styles.chatFooter}>
                        <Text 
                            style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} 
                            numberOfLines={1}
                        >
                            {item.lastMessage}
                        </Text>
                        {isUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const content = (
        <>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <Icon name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mesajlar</Text>
                <TouchableOpacity style={styles.actionBtn}>
                    <Icon name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </>
    );

    if (isWebDesktop) {
        return (
            <WebLayout>
                <View style={styles.splitViewContainer}>
                    <View style={styles.splitViewLeft}>
                        {content}
                    </View>
                    <View style={styles.splitViewRight}>
                        {selectedUser ? (
                            <ChatView user={selectedUser} />
                        ) : (
                            <View style={[styles.emptyContainer, { flex: 1 }]}>
                                <Icon name="message-circle" size={48} color={colors.borderHighlight} />
                                <Text style={{ marginTop: spacing.md }} color="textSecondary">Mesajlaşmak için bir sohbet seçin.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </WebLayout>
        );
    }

    return (
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
            {content}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderHighlight,
        backgroundColor: colors.surface,
    },
    backBtn: {
        padding: spacing.xs,
        width: 40,
    },
    actionBtn: {
        padding: spacing.xs,
        width: 40,
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: '700',
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 100, // accommodate bottom tab bar
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    chatItemActive: {
        backgroundColor: colors.surfaceHover || 'rgba(0,0,0,0.02)',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.borderHighlight,
        marginLeft: 84, // align with text, skip avatar
    },
    avatarContainer: {
        marginRight: spacing.md,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.borderHighlight,
    },
    avatarFallback: {
        backgroundColor: '#a78bfa',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatContent: {
        flex: 1,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
        marginRight: spacing.sm,
    },
    userNameUnread: {
        fontWeight: '800',
    },
    timestamp: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    timestampUnread: {
        color: colors.primary,
        fontWeight: '700',
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
        marginRight: spacing.md,
    },
    lastMessageUnread: {
        color: colors.textPrimary,
        fontWeight: '600',
    },
    unreadBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        height: 20,
        minWidth: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadText: {
        color: colors.surface,
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: spacing.xl,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    splitViewContainer: {
        flex: 1,
        flexDirection: 'row',
        height: '100%',
    },
    splitViewLeft: {
        width: 350,
        borderRightWidth: 1,
        borderRightColor: colors.borderHighlight,
    },
    splitViewRight: {
        flex: 1,
    }
});
