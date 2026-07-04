import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { Text, Icon } from '../ui';

export const EcosystemWidgets = () => {
    return (
        <View style={styles.container}>
            
            {/* Widget: Active Now */}
            <View style={styles.widget}>
                <View style={styles.widgetHeader}>
                    <Text variant="label" weight="bold" color="textSecondary" style={styles.widgetTitle}>ŞU AN AKTİF</Text>
                    <View style={styles.livePulse} />
                </View>

                <View style={styles.activeRow}>
                    <View style={[styles.avatar, { backgroundColor: '#f59e0b' }]}><Text variant="caption" weight="bold" color="surface">N</Text></View>
                    <View style={styles.activeContent}>
                        <Text variant="label" weight="bold" color="textPrimary">Nietzsche</Text>
                        <Text variant="caption" color="textSecondary">Şu an Stoacı Akademi'de tartışıyor...</Text>
                    </View>
                </View>
                
                <View style={styles.activeRow}>
                    <View style={[styles.avatar, { backgroundColor: '#3b82f6' }]}><Text variant="caption" weight="bold" color="surface">K</Text></View>
                    <View style={styles.activeContent}>
                        <Text variant="label" weight="bold" color="textPrimary">Kant_01</Text>
                        <Text variant="caption" color="textSecondary">Varoluş Akademisi'ne katıldı</Text>
                    </View>
                </View>
            </View>

            {/* Widget: Hot Debates */}
            <View style={styles.widget}>
                <View style={styles.widgetHeader}>
                    <Text variant="label" weight="bold" color="textSecondary" style={styles.widgetTitle}>ATEŞLİ TARTIŞMALAR</Text>
                    <Icon name="flame" size={16} color="#ef4444" />
                </View>

                <TouchableOpacity style={styles.hotItem}>
                    <Text variant="body" weight="bold" color="textPrimary" style={{ lineHeight: 20 }}>Sanatın sınırları ahlakla belirlenebilir mi?</Text>
                    <View style={styles.hotMeta}>
                        <Text variant="caption" color="textSecondary">Yeni Rönesans</Text>
                        <Text variant="caption" color="#ef4444" weight="bold">🔥 98 Heat</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.hotItem}>
                    <Text variant="body" weight="bold" color="textPrimary" style={{ lineHeight: 20 }}>Evren simülasyon mu?</Text>
                    <View style={styles.hotMeta}>
                        <Text variant="caption" color="textSecondary">Bilim Kurgu Akademisi</Text>
                        <Text variant="caption" color="#f97316" weight="bold">🔥 74 Heat</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Widget: Weekly Event */}
            <View style={[styles.widget, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                <View style={styles.widgetHeader}>
                    <Text variant="label" weight="bold" color="#64748b" style={styles.widgetTitle}>HAFTALIK ETKİNLİK</Text>
                    <Icon name="calendar" size={16} color="#64748b" />
                </View>
                <Text variant="h3" weight="bold" color="textPrimary" style={{ marginBottom: spacing.sm }}>Açık Kürsü: Büyük Veri ve Mahremiyet</Text>
                <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>Teknoloji ve Ahlak Kulübü • Yarın 21:00</Text>
                <TouchableOpacity style={styles.eventBtn}>
                    <Text variant="caption" weight="bold" color="surface">Hatırlat</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    widget: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
    },
    widgetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    widgetTitle: {
        letterSpacing: 1,
    },
    livePulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    activeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    activeContent: {
        flex: 1,
    },
    hotItem: {
        paddingVertical: spacing.sm,
    },
    hotMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: spacing.sm,
    },
    eventBtn: {
        backgroundColor: '#1e293b',
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        alignSelf: 'flex-start',
    }
});
