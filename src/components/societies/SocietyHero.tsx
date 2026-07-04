import React from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../../theme';
import { Text, Icon } from '../ui';
import { Society } from '../../types/database.types';

interface SocietyHeroProps {
    society: Society;
}

export const SocietyHero = ({ society }: SocietyHeroProps) => {
    return (
        <View style={styles.container}>
            <ImageBackground 
                source={{ uri: 'https://images.unsplash.com/photo-1536697246787-1f276329e4f7?q=80&w=1200&auto=format&fit=crop' }} 
                style={styles.imageBackground}
                imageStyle={{ borderRadius: radius.xl }}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)', '#1a1a1a']}
                    style={styles.gradientOverlay}
                />
                
                <View style={styles.content}>
                    <View style={styles.risingBadge}>
                        <Icon name="zap" size={14} color="#f59e0b" />
                        <Text variant="caption" weight="bold" color="#f59e0b" style={{ marginLeft: 6, letterSpacing: 1 }}>
                            HAFTANIN YÜKSELEN TOPLULUĞU
                        </Text>
                    </View>

                    <Text variant="h1" weight="bold" color="surface" style={styles.title}>
                        {society.name}
                    </Text>

                    {society.currentDebate && (
                        <Text variant="h2" weight="regular" color="#e5e7eb" style={styles.quote}>
                            "{society.currentDebate.title}"
                        </Text>
                    )}

                    <View style={styles.statsRow}>
                        <View style={styles.statBadge}>
                            <Icon name="users" size={14} color="#9ca3af" />
                            <Text variant="caption" weight="bold" color="#d1d5db" style={{ marginLeft: 4 }}>
                                {(society.memberCount || 0) > 1000 ? `${((society.memberCount || 0)/1000).toFixed(1)}K` : society.memberCount} üye
                            </Text>
                        </View>
                        <View style={styles.statBadge}>
                            <View style={styles.onlineDot} />
                            <Text variant="caption" weight="bold" color="#34d399" style={{ marginLeft: 4 }}>
                                {society.onlineCount} online
                            </Text>
                        </View>
                        <View style={styles.statBadge}>
                            <Icon name="flame" size={14} color="#f97316" />
                            <Text variant="caption" weight="bold" color="#d1d5db" style={{ marginLeft: 4 }}>
                                {society.activeDebatesCount} aktif tartışma
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.joinBtn}>
                        <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.joinBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text variant="label" weight="bold" color="surface">Topluluğa Katıl</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 360,
        marginBottom: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    imageBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: radius.xl,
    },
    content: {
        padding: spacing.xl,
    },
    risingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    title: {
        fontSize: 36,
        letterSpacing: -1,
        marginBottom: spacing.sm,
    },
    quote: {
        fontStyle: 'italic',
        lineHeight: 32,
        marginBottom: spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#34d399',
    },
    joinBtn: {
        alignSelf: 'flex-start',
        borderRadius: radius.pill,
        overflow: 'hidden',
    },
    joinBtnInner: {
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
    }
});
