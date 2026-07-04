import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '../theme';
import { Text, Icon } from '../components/ui';

export const ProUpgradeScreen = () => {
    const navigation = useNavigation();

    const features = [
        { icon: 'unlock', title: 'Tüm Premium İçerikler', desc: 'Özel felsefe, sanat ve tarih arşivlerine sınırsız erişim.' },
        { icon: 'zap', title: 'Gelişmiş Arena Rozetleri', desc: 'Profilinde PRO statünü göster ve arenada öne çık.' },
        { icon: 'book-open', title: 'Derinlemesine Analizler', desc: 'Konuların perde arkasını anlatan uzun makaleler okuma şansı.' },
        { icon: 'shield', title: 'Reklamsız Deneyim', desc: 'Kesintisiz öğrenme ve odaklanma.' }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="x" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    <LinearGradient
                        colors={['#fbbf24', '#f59e0b', '#d97706']}
                        style={styles.proBadge}
                    >
                        <Icon name="star" size={32} color="#fff" />
                    </LinearGradient>
                    <Text variant="h1" weight="bold" color="textPrimary" style={styles.title}>
                        Mentis <Text color="#d97706">PRO</Text>
                    </Text>
                    <Text variant="body" color="textSecondary" align="center" style={styles.subtitle}>
                        Zihninin sınırlarını zorla. Tüm kilitleri aç ve en iyi tartışmalara katıl.
                    </Text>
                </View>

                <View style={styles.featuresList}>
                    {features.map((f, i) => (
                        <View key={i} style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Icon name={f.icon as any} size={24} color="#d97706" />
                            </View>
                            <View style={styles.featureText}>
                                <Text variant="label" weight="bold" color="textPrimary">{f.title}</Text>
                                <Text variant="caption" color="textSecondary">{f.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.buyBtn}>
                    <LinearGradient
                        colors={['#f59e0b', '#d97706']}
                        style={styles.buyBtnGradient}
                    >
                        <Text variant="label" weight="bold" color="#fff">Aylık 99.99₺ - Hemen Başla</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.restoreBtn}>
                    <Text variant="caption" weight="bold" color="textSecondary">Satın Alımları Geri Yükle</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    },
    backBtn: { padding: spacing.xs },
    content: { padding: spacing.xl, paddingBottom: 100 },
    heroSection: { alignItems: 'center', marginBottom: spacing.xxl },
    proBadge: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.lg,
        shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
    },
    title: { fontSize: 32, marginBottom: spacing.sm },
    subtitle: { lineHeight: 24, paddingHorizontal: spacing.md },
    featuresList: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
        borderWidth: 1, borderColor: '#fef3c7' },
    featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
    featureIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fffbeb',
        alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    featureText: { flex: 1 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl,
        backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderHighlight,
        paddingBottom: spacing.xxl },
    buyBtn: { borderRadius: radius.pill, overflow: 'hidden', marginBottom: spacing.md },
    buyBtnGradient: { paddingVertical: spacing.lg, alignItems: 'center', justifyContent: 'center' },
    restoreBtn: { alignItems: 'center', paddingVertical: spacing.sm },
});
