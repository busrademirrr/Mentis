import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Card, Icon } from '../ui';

interface ArenaHomeProps {
    onSelectCategory: (category: string) => void;
}

export const ArenaHome: React.FC<ArenaHomeProps> = ({ onSelectCategory }) => {
    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
                {/* Felsefe Ligi */}
                <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer} onPress={() => onSelectCategory('philosophy')}>
                    <Card padding="md" style={[styles.modeCard, { borderTopColor: colors.categories.philosophy }]}>
                        <View style={styles.iconWrapper}>
                            <Text style={styles.emoji}>🧠</Text>
                        </View>
                        <Text variant="h3" weight="bold" color="textPrimary" align="center">Felsefe Ligi</Text>
                        <Text variant="caption" color="textSecondary" align="center" style={styles.cardDesc}>
                            Sizce en iyi argüman kimin?
                        </Text>
                        <View style={styles.actionBtn}>
                            <Text variant="label" weight="bold" color="surface">Meydan Oku</Text>
                        </View>
                    </Card>
                </TouchableOpacity>

                {/* Tarih Meydanı */}
                <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer} onPress={() => onSelectCategory('history')}>
                    <Card padding="md" style={[styles.modeCard, { borderTopColor: colors.categories.history }]}>
                        <View style={styles.iconWrapper}>
                            <Text style={styles.emoji}>🏛️</Text>
                        </View>
                        <Text variant="h3" weight="bold" color="textPrimary" align="center">Tarih Meydanı</Text>
                        <Text variant="caption" color="textSecondary" align="center" style={styles.cardDesc}>
                            Önemli tarihi Dönüm noktaları
                        </Text>
                        <View style={styles.actionBtn}>
                            <Text variant="label" weight="bold" color="surface">Savaşa Katıl</Text>
                        </View>
                    </Card>
                </TouchableOpacity>

                {/* Edebiyat Düellosu */}
                <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer} onPress={() => onSelectCategory('literature')}>
                    <Card padding="md" style={[styles.modeCard, { borderTopColor: colors.categories.science }]}>
                        <View style={styles.iconWrapper}>
                            <Text style={styles.emoji}>📚</Text>
                        </View>
                        <Text variant="h3" weight="bold" color="textPrimary" align="center">Edebiyat Düellosu</Text>
                        <Text variant="caption" color="textSecondary" align="center" style={styles.cardDesc}>
                            Dünya Klasikleri
                        </Text>
                        <View style={styles.actionBtn}>
                            <Text variant="label" weight="bold" color="surface">Kalemini Çek</Text>
                        </View>
                    </Card>
                </TouchableOpacity>

                {/* Sanat Arenası */}
                <TouchableOpacity activeOpacity={0.8} style={styles.cardContainer} onPress={() => onSelectCategory('art')}>
                    <Card padding="md" style={[styles.modeCard, { borderTopColor: colors.categories.art }]}>
                        <View style={styles.iconWrapper}>
                            <Text style={styles.emoji}>🎨</Text>
                        </View>
                        <Text variant="h3" weight="bold" color="textPrimary" align="center">Sanat Arenası</Text>
                        <Text variant="caption" color="textSecondary" align="center" style={styles.cardDesc}>
                            Rönesans İzleri
                        </Text>
                        <View style={styles.actionBtn}>
                            <Text variant="label" weight="bold" color="surface">Fırçanı Al</Text>
                        </View>
                    </Card>
                </TouchableOpacity>
            </View>

            {/* Haftalık Lig */}
            <View style={styles.leagueSection}>
                <View style={styles.leagueHeader}>
                    <Text variant="h3" weight="bold" color="textPrimary">Haftalık Lig</Text>
                    <View style={styles.badgeGold}>
                        <Text variant="caption" weight="bold" color="#92400e">Altın Lig</Text>
                    </View>
                </View>

                <Card padding="sm" style={styles.leaderboardRow}>
                    <View style={styles.lbLeft}>
                        <Text variant="h3" weight="bold" color="textPrimary" style={styles.rank}>1</Text>
                        <View style={styles.lbAvatar} />
                        <Text variant="label" weight="bold" color="textPrimary">Zeynep</Text>
                    </View>
                    <View style={styles.lbRight}>
                        <Text variant="label" weight="bold" color="textPrimary">2450</Text>
                        <Icon name="star" size={16} color="#eab308" />
                    </View>
                </Card>
                
                <Card padding="sm" style={[styles.leaderboardRow, { marginTop: spacing.sm }]}>
                    <View style={styles.lbLeft}>
                        <Text variant="h3" weight="bold" color="textPrimary" style={styles.rank}>2</Text>
                        <View style={[styles.lbAvatar, { backgroundColor: '#34d399' }]} />
                        <Text variant="label" weight="bold" color="textPrimary">Can</Text>
                    </View>
                    <View style={styles.lbRight}>
                        <Text variant="label" weight="bold" color="textPrimary">2100</Text>
                        <Icon name="star" size={16} color="#eab308" />
                    </View>
                </Card>
                
                <Card padding="sm" style={[styles.leaderboardRow, { marginTop: spacing.sm, borderColor: colors.primary, borderWidth: 2 }]}>
                    <View style={styles.lbLeft}>
                        <Text variant="h3" weight="bold" color="textPrimary" style={styles.rank}>3</Text>
                        <View style={[styles.lbAvatar, { backgroundColor: '#60a5fa' }]} />
                        <Text variant="label" weight="bold" color="textPrimary">Sen</Text>
                    </View>
                    <View style={styles.lbRight}>
                        <Text variant="label" weight="bold" color="textPrimary">1850</Text>
                        <Icon name="star" size={16} color="#eab308" />
                    </View>
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: spacing.xxl * 3,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    cardContainer: {
        width: '48%',
        marginBottom: spacing.md,
    },
    modeCard: {
        alignItems: 'center',
        borderTopWidth: 4,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        paddingVertical: spacing.md,
        minHeight: 200,
    },
    iconWrapper: {
        marginBottom: spacing.md,
    },
    emoji: {
        fontSize: 32,
    },
    cardDesc: {
        marginTop: spacing.xs,
        marginBottom: spacing.md,
        height: 36,
    },
    actionBtn: {
        backgroundColor: '#1f2937',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
        width: '100%',
        alignItems: 'center',
        marginTop: 'auto',
    },
    leagueSection: {
        marginBottom: spacing.xl,
    },
    leagueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    badgeGold: {
        backgroundColor: '#fef08a',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.pill,
        marginLeft: spacing.sm,
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    lbLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rank: {
        width: 30,
        textAlign: 'center',
    },
    lbAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#a78bfa',
        marginHorizontal: spacing.sm,
    },
    lbRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    }
});
