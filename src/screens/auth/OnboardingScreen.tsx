import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon, MentisLogo } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { CATEGORIES } from '../../constants/categories';

const TOPICS = CATEGORIES;

export const OnboardingScreen = ({ navigation }: any) => {
    const { user, profile, refreshSession, signOut } = useAuth();
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleFinish = async () => {
        if (selectedTopics.length < 3) {
            Toast.show({ type: 'info', text1: 'Seçim Gerekli', text2: 'Lütfen en az 3 ilgi alanı seçin.' });
            return;
        }

        if (!user) {
            Toast.show({ type: 'error', text1: 'Oturum Hatası', text2: 'Oturumunuz bulunamadı. Lütfen tekrar giriş yapın.' });
            await signOut();
            return;
        }

        setLoading(true);

        try {
            // Upsert profile data
            const { error: profileError } = await supabase.from('user_profiles').upsert({
                user_id: user.id,
                full_name: user.user_metadata?.full_name || '',
                username: user.user_metadata?.username || `user_${user.id.substring(0,8)}`,
            });
            if (profileError) throw profileError;

            // Insert interests
            const interestsData = selectedTopics.map(topic => ({
                user_id: user.id,
                topic_id: topic
            }));
            const { error: interestsError } = await supabase.from('user_interests').upsert(interestsData);
            if (interestsError) throw interestsError;

            // Mark onboarding as complete in auth metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { onboarding_completed: true }
            });
            if (updateError) throw updateError;

            Toast.show({ type: 'success', text1: 'Mentis Ağına Hoş Geldin!', text2: 'Profilin başarıyla oluşturuldu.' });
            
            // Reload context to trigger Auth Guard update
            await refreshSession();

        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Kayıt Hatası', text2: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <MentisLogo size={40} variant="primary" />
                <Text variant="h2" weight="bold" color="textPrimary" style={{ marginTop: spacing.lg }}>İlgi Alanlarını Seç</Text>
                <Text variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                    Sana en uygun içerikleri ve tartışmaları sunabilmemiz için ilgini çeken en az 3 konuyu işaretle.
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {TOPICS.map((topic) => {
                        const isSelected = selectedTopics.includes(topic.id);
                        return (
                            <TouchableOpacity 
                                key={topic.id} 
                                style={[styles.topicCard, isSelected && styles.topicCardSelected]}
                                onPress={() => toggleTopic(topic.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
                                    <Icon name={topic.icon} size={24} color={isSelected ? colors.primary : colors.textSecondary} />
                                </View>
                                <Text variant="body" weight="bold" color={isSelected ? 'textPrimary' : 'textSecondary'} style={{ marginTop: spacing.md }}>
                                    {topic.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Text variant="caption" color="textSecondary">
                    {selectedTopics.length} / 3 seçildi
                </Text>
                <TouchableOpacity 
                    style={[styles.primaryBtn, (selectedTopics.length < 3 || loading) && styles.primaryBtnDisabled]} 
                    onPress={handleFinish}
                    disabled={selectedTopics.length < 3 || loading}
                >
                    {loading ? <ActivityIndicator color={colors.surface} /> : <Text variant="body" weight="bold" color="surface">Mentis'e Başla</Text>}
                    {!loading && <Icon name="arrow-right" size={18} color={colors.surface} style={{ marginLeft: spacing.sm }} />}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        padding: spacing.xxl,
        paddingTop: 80,
        maxWidth: 600,
        width: '100%',
    },
    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingBottom: 120, // space for footer
        alignItems: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.lg,
        justifyContent: 'center',
        maxWidth: 800,
    },
    topicCard: {
        width: 140,
        height: 140,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'all 0.2s ease' } as any),
    },
    topicCardSelected: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(124, 58, 237, 0.04)',
    },
    iconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapperSelected: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        padding: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...(Platform.OS === 'web' && { paddingHorizontal: 'calc(50vw - 400px)' } as any),
    },
    primaryBtn: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'background-color 0.2s ease' } as any),
    },
    primaryBtnDisabled: {
        backgroundColor: colors.textTertiary,
        ...(Platform.OS === 'web' && { cursor: 'not-allowed' } as any),
    }
});
