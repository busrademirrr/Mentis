import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { Text, Icon } from '../components/ui';
import { Screen } from '../components/layout';

const MOCK_NOTIFICATIONS = [
    { id: '1', type: 'like', text: '"Nietzsche ve Nihilizm" gönderini beğendi.', user: 'Selin', time: '5dk önce', unread: true },
    { id: '2', type: 'comment', text: 'Tartışmana yorum yaptı: "Bence de sanat toplum içindir."', user: 'Ahmet', time: '1s önce', unread: true },
    { id: '3', type: 'system', text: 'Tebrikler! "Felsefe Taşı" rozetini kazandın.', user: 'Mentis', time: '3s önce', unread: false },
    { id: '4', type: 'follow', text: 'Seni takip etmeye başladı.', user: 'Zeynep', time: '1g önce', unread: false },
];

export const NotificationsScreen = () => {
    const navigation = useNavigation();

    const getIcon = (type: string): { name: any; color: string } => {
        switch (type) {
            case 'like': return { name: 'heart', color: '#ef4444' };
            case 'comment': return { name: 'message-circle', color: '#3b82f6' };
            case 'system': return { name: 'award', color: '#f59e0b' };
            case 'follow': return { name: 'user-plus', color: '#10b981' };
            default: return { name: 'bell', color: colors.textSecondary };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const iconInfo = getIcon(item.type);
        return (
            <TouchableOpacity style={[styles.notificationCard, item.unread && styles.unreadCard]}>
                <View style={[styles.iconContainer, { backgroundColor: `${iconInfo.color}15` }]}>
                    <Icon name={iconInfo.name} size={20} color={iconInfo.color} />
                </View>
                <View style={styles.textContainer}>
                    <Text variant="body" weight={item.unread ? 'bold' : 'regular'} color="textPrimary">
                        <Text weight="bold">{item.user} </Text>{item.text}
                    </Text>
                    <Text variant="caption" color="textSecondary" style={styles.timeText}>{item.time}</Text>
                </View>
                {item.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <Screen withSafeTop backgroundColor="background" style={[styles.safeArea, { paddingHorizontal: 0 }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bildirimler</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={MOCK_NOTIFICATIONS}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </Screen>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.borderHighlight,
    },
    backBtn: { padding: spacing.xs },
    headerTitle: { fontSize: typography.sizes.lg, fontWeight: '700', color: colors.textPrimary },
    listContent: { padding: spacing.md },
    notificationCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    unreadCard: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
    },
    iconContainer: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        marginRight: spacing.md,
    },
    textContainer: { flex: 1 },
    timeText: { marginTop: 4 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginLeft: spacing.sm },
});
