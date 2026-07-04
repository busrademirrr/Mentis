import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Screen, Header } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius } from '../theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const DebateCreateScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sideA, setSideA] = useState('');
    const [sideB, setSideB] = useState('');
    const [category, setCategory] = useState('Felsefe');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['Felsefe', 'Teknoloji', 'Bilim', 'Sanat', 'Siyaset'];

    const handleCreate = async () => {
        if (!title.trim() || !description.trim() || !sideA.trim() || !sideB.trim() || !user) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen tüm alanları doldurun.' });
            return;
        }

        setIsSubmitting(true);
        try {
            // Using create_post RPC for debates as per our schema
            const payload = {
                title,
                description,
                side_a: sideA,
                side_b: sideB,
                category
            };

            const { data: postId, error } = await supabase.rpc('create_post', {
                p_type: 'debate',
                p_payload: payload
            });

            if (error) throw error;

            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Tartışma arenası oluşturuldu.' });
            
            // Navigate to the newly created room and replace the current screen
            navigation.replace('DebateRoom', { debateId: postId });
            
        } catch (error: any) {
            console.error('Error creating debate:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: error.message || 'Tartışma oluşturulamadı.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Screen backgroundColor="background" withSafeTop>
            <Header title="Tartışma Başlat" showBack={true} />
            
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.inputGroup}>
                        <Text variant="label" weight="bold" color="textPrimary" style={styles.label}>Tartışma Konusu</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Örn: Yapay Zeka vs İnsan Yaratıcılığı"
                            placeholderTextColor={colors.textSecondary}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text variant="label" weight="bold" color="textPrimary" style={styles.label}>Açıklama</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Bu tartışmanın ana ekseni nedir?"
                            placeholderTextColor={colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.vsContainer}>
                        <View style={styles.sideInputWrap}>
                            <Text variant="label" weight="bold" color="#ef4444" style={styles.label}>Taraf A</Text>
                            <TextInput
                                style={[styles.input, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                                placeholder="Örn: Yapay Zeka"
                                placeholderTextColor={colors.textSecondary}
                                value={sideA}
                                onChangeText={setSideA}
                            />
                        </View>
                        
                        <View style={styles.vsBadge}>
                            <Text variant="caption" weight="bold" color="surface">VS</Text>
                        </View>

                        <View style={styles.sideInputWrap}>
                            <Text variant="label" weight="bold" color="#3b82f6" style={styles.label}>Taraf B</Text>
                            <TextInput
                                style={[styles.input, { borderColor: 'rgba(59, 130, 246, 0.3)' }]}
                                placeholder="Örn: İnsan"
                                placeholderTextColor={colors.textSecondary}
                                value={sideB}
                                onChangeText={setSideB}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text variant="label" weight="bold" color="textPrimary" style={styles.label}>Kategori</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                            {categories.map((cat) => (
                                <TouchableOpacity 
                                    key={cat} 
                                    style={[styles.catBtn, category === cat && styles.catBtnActive]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text variant="caption" weight="bold" color={category === cat ? 'surface' : 'textSecondary'}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                </ScrollView>
                
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
                        onPress={handleCreate}
                        disabled={isSubmitting}
                    >
                        <Text variant="label" weight="bold" color="surface">
                            {isSubmitting ? 'Oluşturuluyor...' : 'Arenayı Başlat'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        color: colors.textPrimary,
        fontSize: 14,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        position: 'relative',
    },
    sideInputWrap: {
        flex: 1,
    },
    vsBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.sm,
        marginTop: 24, // align with inputs
        zIndex: 10,
    },
    catBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    catBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    submitBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderRadius: radius.pill,
    }
});
