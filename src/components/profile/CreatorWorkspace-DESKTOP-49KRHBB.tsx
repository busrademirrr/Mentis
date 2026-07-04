import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, radius, spacing, shadows } from '../../theme';
import { useNavigation } from '@react-navigation/native';

interface CreatorWorkspaceProps {
    onNavigateTab?: (tabId: string) => void;
}

export const CreatorWorkspace: React.FC<CreatorWorkspaceProps> = ({ onNavigateTab }) => {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {/* Action Card */}
            <View style={styles.card}>
                <Text variant="label" color="textSecondary" weight="semibold" style={styles.sectionTitle}>
                    ÜRETİCİ ÇALIŞMA ALANI
                </Text>
                
                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('CreateCard')}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <Icon name="FileText" size={18} color="#3b82f6" />
                    </View>
                    <View style={styles.actionText}>
                        <Text variant="body" weight="semibold" color="textPrimary">Yeni Bilgi Kartı</Text>
                        <Text variant="caption" color="textTertiary">Fikrini paylaş</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('CreateDebate')}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <Icon name="Swords" size={18} color="#ef4444" />
                    </View>
                    <View style={styles.actionText}>
                        <Text variant="body" weight="semibold" color="textPrimary">Tartışma Başlat</Text>
                        <Text variant="caption" color="textTertiary">Argüman oluştur</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('CreateQuiz')}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                        <Icon name="HelpCircle" size={18} color="#f59e0b" />
                    </View>
                    <View style={styles.actionText}>
                        <Text variant="body" weight="semibold" color="textPrimary">Quiz Oluştur</Text>
                        <Text variant="caption" color="textTertiary">Bilgiyi sına</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Live Insights Card */}
            <View style={styles.card}>
                <Text variant="label" color="textSecondary" weight="semibold" style={styles.sectionTitle}>
                    CANLI İÇGÖRÜLER
                </Text>
                
                <TouchableOpacity style={styles.insightItem} onPress={() => navigation.navigate('Drafts')}>
                    <Icon name="PenTool" size={16} color="textSecondary" />
                    <Text variant="body" color="textSecondary" style={styles.insightText}>3 Taslak Bekliyor</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.insightItem} onPress={() => onNavigateTab?.('kaydedilenler')}>
                    <Icon name="Library" size={16} color="textSecondary" />
                    <Text variant="body" color="textSecondary" style={styles.insightText}>Kütüphaneni İncele</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.insightItem}>
                    <View style={styles.liveDot} />
                    <Text variant="body" color="textSecondary" style={styles.insightText}>Yapay Zeka Etiği Odası Aktif</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing.xl,
        position: 'sticky' as any,
        top: 20, // offset from header if scrolling
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.base,
    },
    sectionTitle: {
        letterSpacing: 1.2,
        marginBottom: spacing.lg,
        fontSize: 11,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    actionText: {
        flex: 1,
        justifyContent: 'center',
    },
    insightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    insightText: {
        marginLeft: spacing.sm,
        flex: 1,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
        marginLeft: 4,
        marginRight: 4,
    }
});
