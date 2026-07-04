import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { Text, Icon } from '../ui';
import { LiveDebate } from '../../types/database.types';

interface LiveDebateStreamProps {
    debates: LiveDebate[];
}

const LiveCard = ({ debate }: { debate: LiveDebate }) => {
    // Pulse animation for live dot
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
            ])
        ).start();
    }, []);

    return (
        <TouchableOpacity style={styles.card}>
            <View style={styles.header}>
                <View style={styles.liveTag}>
                    <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
                    <Text variant="caption" weight="bold" color="#10b981">CANLI</Text>
                </View>
                <Text variant="caption" weight="bold" color="textSecondary" style={{ textTransform: 'uppercase' }}>
                    {debate.category}
                </Text>
            </View>

            <Text variant="h3" weight="bold" color="textPrimary" style={styles.title} numberOfLines={2}>
                "{debate.title}"
            </Text>

            <View style={styles.participants}>
                <Icon name="users" size={14} color="textSecondary" />
                <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                    {debate.participantsCount} kişi tartışıyor
                </Text>
            </View>

            <View style={styles.messageBox}>
                <Text variant="caption" color="textSecondary" style={styles.msgLabel}>Son mesaj:</Text>
                <Text variant="body" color="textPrimary" style={styles.msgText} numberOfLines={1}>
                    "{debate.lastMessage}"
                </Text>
            </View>

            <View style={styles.joinAction}>
                <Text variant="label" weight="bold" color="primary">KATIL</Text>
                <Icon name="arrow-right" size={16} color="primary" style={{ marginLeft: 4 }} />
            </View>
        </TouchableOpacity>
    );
};

export const LiveDebateStream = ({ debates }: LiveDebateStreamProps) => {
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {debates.map(debate => (
                    <LiveCard key={debate.id} debate={debate} />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.xxl,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        gap: spacing.lg,
    },
    card: {
        width: 300,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
        marginRight: 6,
    },
    title: {
        lineHeight: 26,
        marginBottom: spacing.sm,
    },
    participants: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    messageBox: {
        backgroundColor: '#f8fafc',
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.lg,
        borderLeftWidth: 3,
        borderLeftColor: '#cbd5e1',
    },
    msgLabel: {
        marginBottom: 4,
    },
    msgText: {
        fontStyle: 'italic',
    },
    joinAction: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    }
});
