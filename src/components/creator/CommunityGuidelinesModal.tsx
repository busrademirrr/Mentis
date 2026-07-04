import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text, Icon } from '../ui';
import { LinearGradient } from 'expo-linear-gradient';

interface CommunityGuidelinesModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CommunityGuidelinesModal: React.FC<CommunityGuidelinesModalProps> = ({ visible, onClose }) => {
    if (!visible) return null;

    const rules = [
        {
            icon: 'check-circle',
            title: '1. Saf Bilgi, Düşük Gürültü',
            description: 'Mentis bir fikir arenasıdır. Kişisel güncellemeler değil, evrensel fikirler paylaşın.'
        },
        {
            icon: 'shield',
            title: '2. Saygı Çerçevesinde Tartışma',
            description: 'Fikirleri eleştirin, kişileri değil. Yapıcı eleştiri Mentis kültürünün temelidir.'
        },
        {
            icon: 'book-open',
            title: '3. Kaynak Gösterimi',
            description: 'İddialarınızı verilerle destekleyin ve alıntılarınızı her zaman kaynağıyla paylaşın.'
        },
        {
            icon: 'eye-off',
            title: '4. Tıklama Tuzağına Hayır',
            description: 'Clickbait başlıklar yerine, içeriğin özünü dürüstçe yansıtan başlıklar kullanın.'
        },
        {
            icon: 'mic',
            title: '5. Özgün Sesiniz',
            description: 'Başka yerlerden kopyalanmış içerikler yerine, kendi analizlerinizi ve sentezlerinizi paylaşın.'
        },
        {
            icon: 'alert-triangle',
            title: '6. Nefret Söylemine Sıfır Tolerans',
            description: 'Ayrımcılık, ırkçılık veya herhangi bir gruba yönelik nefret söylemi hesaptan uzaklaştırma sebebidir.'
        },
        {
            icon: 'zap',
            title: '7. Gelişime Katkı',
            description: 'Amacımız haklı çıkmak değil, gerçeğe bir adım daha yaklaşmaktır. Öğrenmeye açık olun.'
        }
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={['#8b5cf6', '#a855f7']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.headerGradient}
                    >
                        <View style={styles.headerContent}>
                            <Icon name="shield" size={32} color={colors.surface} style={{ marginBottom: spacing.sm }} />
                            <Text variant="h2" weight="bold" color="surface">Mentis Manifestosu</Text>
                            <Text variant="caption" color="surface" style={{ opacity: 0.9, marginTop: 4 }}>
                                Daha iyi bir dijital zihin için temel yasalar.
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="x" size={24} color={colors.surface} />
                        </TouchableOpacity>
                    </LinearGradient>
                    
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {rules.map((rule, index) => (
                            <View key={index} style={styles.ruleCard}>
                                <View style={styles.ruleIconWrapper}>
                                    <Icon name={rule.icon} size={20} color={colors.primary} />
                                </View>
                                <View style={styles.ruleContent}>
                                    <Text variant="label" weight="bold" color="textPrimary" style={{ marginBottom: 4 }}>
                                        {rule.title}
                                    </Text>
                                    <Text variant="body" color="textSecondary" style={{ lineHeight: 20 }}>
                                        {rule.description}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={onClose}>
                            <Text variant="body" weight="bold" color="surface">Anladım ve Kabul Ediyorum</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        ...(Platform.OS === 'web' && { backdropFilter: 'blur(8px)' } as any),
    },
    modalContainer: {
        width: '100%',
        maxWidth: 600,
        backgroundColor: colors.background,
        borderRadius: radius.lg,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    headerGradient: {
        padding: spacing.xl,
        position: 'relative',
    },
    headerContent: {
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        padding: spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: radius.circle,
    },
    scrollContent: {
        padding: spacing.xl,
    },
    ruleCard: {
        flexDirection: 'row',
        marginBottom: spacing.xl,
    },
    ruleIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    ruleContent: {
        flex: 1,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    acceptBtn: {
        width: '100%',
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
