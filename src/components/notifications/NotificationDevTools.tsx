import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { NotificationType } from '../../services/notificationService';

export const NotificationDevTools = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    if (!user) return null;

    const createNotification = async (type: NotificationType, title: string, body: string, hasActor: boolean) => {
        if (!user) return;
        setLoading(true);
        try {
            // First, find some random user to be the actor (if needed)
            let actorId = null;
            if (hasActor) {
                const { data: users } = await supabase
                    .from('users')
                    .select('id')
                    .neq('id', user.id)
                    .limit(1);
                
                if (users && users.length > 0) {
                    actorId = users[0].id;
                }
            }

            const { error } = await supabase.from('notifications').insert({
                user_id: user.id,
                actor_id: actorId,
                type,
                title,
                body,
                reference_id: null, // Mock reference
                is_read: false
            });

            if (error) throw error;
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible) {
        return (
            <TouchableOpacity 
                style={styles.toggleBtn} 
                onPress={() => setIsVisible(true)}
            >
                <Icon name="tool" size={16} color={colors.background} />
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="caption" weight="bold" color="textPrimary">Dev Tools: Test Bildirimleri</Text>
                <TouchableOpacity onPress={() => setIsVisible(false)}>
                    <Icon name="x" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 10 }} />}

            <View style={styles.grid}>
                <TouchableOpacity 
                    style={styles.btn} 
                    onPress={() => createNotification('message', 'sana bir mesaj gönderdi.', 'Merhaba, bugün nasılsın?', true)}
                >
                    <Icon name="message-square" size={14} color={colors.surface} />
                    <Text variant="caption" color="surface" style={{ marginLeft: 4 }}>Mesaj</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.btn} 
                    onPress={() => createNotification('follow', 'seni takip etmeye başladı.', null, true)}
                >
                    <Icon name="user-plus" size={14} color={colors.surface} />
                    <Text variant="caption" color="surface" style={{ marginLeft: 4 }}>Takip</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: colors.error }]} 
                    onPress={() => createNotification('arena_match_found', 'ile düellon başlıyor!', 'Hazırlan, rakip bulundu.', true)}
                >
                    <Icon name="crosshair" size={14} color={colors.surface} />
                    <Text variant="caption" color="surface" style={{ marginLeft: 4 }}>Düello</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: colors.warning }]} 
                    onPress={() => createNotification('achievement', 'Yeni Başarım Kilidi Açıldı!', 'İlk düellonu kazandın. 50 XP eklendi.', false)}
                >
                    <Icon name="award" size={14} color={colors.surface} />
                    <Text variant="caption" color="surface" style={{ marginLeft: 4 }}>Başarım</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btn, { backgroundColor: colors.primary }]} 
                    onPress={() => createNotification('system', 'Mentis Güncellemesi v2.0', 'Uygulamaya yepyeni özellikler eklendi. Keşfetmek için tıkla.', false)}
                >
                    <Icon name="info" size={14} color={colors.surface} />
                    <Text variant="caption" color="surface" style={{ marginLeft: 4 }}>Sistem</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    toggleBtn: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: colors.textPrimary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    container: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        zIndex: 9999,
        width: 300,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radius.sm,
    }
});
