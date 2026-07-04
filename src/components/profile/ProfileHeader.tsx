import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Modal, FlatList, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { Text, Icon, Card } from '../ui';
import { User, UserSocial } from '../../types/database.types';
import { updateAvatar, updateProfileInfo, addSocialLink, deleteSocialLink } from '../../services/profileService';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';
import Toast from 'react-native-toast-message';
import { useResponsive } from '../../hooks/useResponsive';
import { BlurView } from 'expo-blur';

// PRESET AVATARS
const PRESETS: Record<string, any> = {
    'preset_1': 'https://api.dicebear.com/9.x/micah/png?seed=Felix&backgroundColor=f3f4f6',
    'preset_2': 'https://api.dicebear.com/9.x/micah/png?seed=Aneka&backgroundColor=e5e7eb',
    'preset_3': 'https://api.dicebear.com/9.x/micah/png?seed=Mimi&backgroundColor=f3f4f6',
    'preset_4': 'https://api.dicebear.com/9.x/micah/png?seed=Liam&backgroundColor=e5e7eb',
};

const SOCIAL_ICONS: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'Twitter',
    website: 'Globe',
    linkedin: 'Linkedin'
};

interface ProfileHeaderProps {
    user: User;
    stats: any;
    reputation: any;
    socials: UserSocial[];
    isOwnProfile?: boolean;
    onProfileUpdate: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, stats, reputation, socials, isOwnProfile = true, onProfileUpdate }) => {
    const navigation = useNavigation<any>();
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);
    
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isAvatarModalVisible, setAvatarModalVisible] = useState(false);
    const [editName, setEditName] = useState(user.full_name || '');
    const [editBio, setEditBio] = useState(user.bio || '');
    const [saving, setSaving] = useState(false);
    const [newPlatform, setNewPlatform] = useState<string>('instagram');
    const [newUrl, setNewUrl] = useState('');

    const getAvatarUri = () => {
        if (user.avatar_type === 'preset' && PRESETS[user.avatar_value]) {
            return PRESETS[user.avatar_value];
        }
        return user.avatar_value || PRESETS['preset_1'];
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        await updateProfileInfo({ full_name: editName, bio: editBio });
        onProfileUpdate();
        setSaving(false);
        setEditModalVisible(false);
    };

    const handleSelectPreset = async (key: string) => {
        setSaving(true);
        await updateAvatar('preset', key);
        onProfileUpdate();
        setSaving(false);
        setAvatarModalVisible(false);
    };

    const handleUploadImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].uri && result.assets[0].base64) {
                setSaving(true);
                const fileUri = result.assets[0].uri;
                const base64 = result.assets[0].base64;
                const filePath = `${user.id}/${Date.now()}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, decode(base64), { contentType: 'image/jpeg', upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                
                await updateAvatar('upload', data.publicUrl);
                onProfileUpdate();
                setAvatarModalVisible(false);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Fotoğraf yüklenemedi!' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddSocial = async () => {
        if (newUrl.trim() === '') return;
        setSaving(true);
        await addSocialLink(newPlatform, newUrl);
        setNewUrl('');
        onProfileUpdate();
        setSaving(false);
    };

    const handleDeleteSocial = async (id: string) => {
        setSaving(true);
        await deleteSocialLink(id);
        onProfileUpdate();
        setSaving(false);
    };

    const handleMessage = () => {
        navigation.navigate('Messages', { userId: user.id });
    };

    return (
        <View style={styles.container}>
            {/* Cinematic Gradient Banner */}
            <View style={styles.bannerContainer}>
                <LinearGradient
                    colors={['#e2e8f0', '#f8fafc']}
                    style={styles.bannerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                
                {/* Glassmorphism Quick Stats Overlay on Banner */}
                <View style={styles.glassStatsWrapper}>
                    {Platform.OS === 'web' ? (
                        <View style={[styles.glassStatsInner, { backgroundColor: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)' } as any]}>
                            <Text variant="caption" weight="semibold" color="textSecondary">ITIBAR PUANI</Text>
                            <Text variant="h3" weight="bold" color="primary">{reputation?.knowledge_score || 0}</Text>
                        </View>
                    ) : (
                        <BlurView intensity={20} tint="light" style={styles.glassStatsInner}>
                            <Text variant="caption" weight="semibold" color="textSecondary">ITIBAR PUANI</Text>
                            <Text variant="h3" weight="bold" color="primary">{reputation?.knowledge_score || 0}</Text>
                        </BlurView>
                    )}
                </View>
            </View>

            {/* Profile Info Section */}
            <View style={[styles.profileInfoContainer, isWebDesktop && { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }]}>
                
                <View style={[styles.leftContent, isWebDesktop && { flex: 1, paddingRight: spacing.xl }]}>
                    <View style={styles.avatarRow}>
                        <View style={styles.avatarWrapper}>
                            <Image source={{ uri: getAvatarUri() }} style={styles.avatar} />
                            {isOwnProfile && (
                                <TouchableOpacity style={styles.editBadge} onPress={() => setAvatarModalVisible(true)} activeOpacity={0.8}>
                                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="Camera" size={16} color="#fff" />}
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <View style={styles.nameAndStatus}>
                            <View style={styles.nameRow}>
                                <Text variant="h1" weight="bold" color="textPrimary" style={{ fontSize: 32, letterSpacing: -0.5 }}>{user.full_name || user.username}</Text>
                                {user.is_premium && (
                                    <View style={styles.verifiedTick}>
                                        <Icon name="CheckCircle" size={24} color={colors.primary} />
                                    </View>
                                )}
                            </View>
                            <View style={styles.handleRow}>
                                <Text variant="body" color="textSecondary" style={styles.username}>@{user.username}</Text>
                                <View style={styles.liveStatusBadge}>
                                    <View style={styles.liveDot} />
                                    <Text variant="caption" weight="bold" color="success">Çevrimiçi</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <Text variant="body" color="textPrimary" style={styles.bioText}>
                        {user.bio || 'Derin düşünen, sorgulayan ve üreten bir zihin.'}
                    </Text>
                    
                    {/* Socials & Level Row */}
                    <View style={styles.metaRow}>
                        {user.league && (
                            <View style={styles.titleBadge}>
                                <Icon name="Award" size={16} color="#f59e0b" style={styles.titleIcon} />
                                <Text variant="caption" weight="bold" color="#f59e0b">{user.league} • LVL {user.level || 1}</Text>
                            </View>
                        )}
                        <View style={styles.socialsList}>
                            {socials.map(social => (
                                <TouchableOpacity key={social.id} style={styles.socialIconBtn}>
                                    <Icon name={(SOCIAL_ICONS[social.platform] || 'Link')} size={18} color="textSecondary" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Editorial Stats Bar */}
                    <View style={styles.prestigeStatsBar}>
                        <View style={styles.prestigeItem}>
                            <Text variant="label" weight="bold" color="textPrimary">{stats?.followers_count || 0}</Text>
                            <Text variant="caption" color="textSecondary">Takipçi</Text>
                        </View>
                        <View style={styles.prestigeItem}>
                            <Text variant="label" weight="bold" color="textPrimary">{stats?.following_count || 0}</Text>
                            <Text variant="caption" color="textSecondary">Takip</Text>
                        </View>
                        <View style={styles.prestigeItem}>
                            <Text variant="label" weight="bold" color="textPrimary">{reputation?.streak_count || 0}</Text>
                            <Text variant="caption" color="textSecondary">Gün Seri</Text>
                        </View>
                    </View>
                </View>

                {/* RIGHT SIDE: Edit Profile Button OR Action Buttons */}
                <View style={[styles.rightContent, !isWebDesktop && { marginTop: spacing.md }]}>
                    {isOwnProfile ? (
                        <TouchableOpacity 
                            style={isWebDesktop ? styles.editProfileBtnDesktop : styles.editProfileBtnMobile}
                            onPress={() => {
                                setEditName(user.full_name || '');
                                setEditBio(user.bio || '');
                                setEditModalVisible(true);
                            }}
                        >
                            <Icon name="Edit2" size={16} color={colors.textPrimary} />
                            <Text variant="label" weight="bold" color="textPrimary" style={{ marginLeft: spacing.xs }}>Profili Düzenle</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.actionButtonsContainer, isWebDesktop && styles.actionButtonsDesktop]}>
                            <TouchableOpacity style={styles.followBtn}>
                                <Text variant="label" weight="bold" color="surface">Takip Et</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
                                <Icon name="MessageSquare" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* --- AVATAR MODAL --- */}
            {/* Same basic logic, but clean up icons */}
            <Modal visible={isAvatarModalVisible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAvatarModalVisible(false)}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text variant="h3" weight="bold" style={styles.modalTitle}>Avatar Seç</Text>
                        
                        <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadImage} disabled={saving}>
                            <Icon name="UploadCloud" size={20} color={colors.primary} />
                            <Text variant="body" weight="bold" color="primary" style={{ marginLeft: 8 }}>Fotoğraf Yükle</Text>
                        </TouchableOpacity>

                        <Text variant="caption" color="textSecondary" style={{ marginVertical: spacing.md, textAlign: 'center' }}>
                            Veya hazır avatarlardan seç:
                        </Text>

                        <FlatList
                            data={Object.keys(PRESETS)}
                            numColumns={4}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={[styles.avatarOption, user.avatar_value === item && styles.avatarOptionSelected]} 
                                    onPress={() => handleSelectPreset(item)}
                                    disabled={saving}
                                >
                                    <Image source={{ uri: PRESETS[item] }} style={styles.avatarThumbnail} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* --- EDIT PROFILE MODAL --- */}
            <Modal visible={isEditModalVisible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
                    <View style={[styles.modalContent, { height: '80%' }]} onStartShouldSetResponder={() => true}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
                            <Text variant="h3" weight="bold">Profili Düzenle</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Icon name="X" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text variant="label" color="textSecondary" style={styles.inputLabel}>İsim Soyisim</Text>
                            <TextInput 
                                style={styles.input}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="İsminiz..."
                                placeholderTextColor={colors.textSecondary}
                            />

                            <Text variant="label" color="textSecondary" style={styles.inputLabel}>Biyografi</Text>
                            <TextInput 
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                value={editBio}
                                onChangeText={setEditBio}
                                placeholder="Kendinizden bahsedin..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                            />

                            <View style={styles.divider} />

                            <Text variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>Sosyal Linkler</Text>
                            
                            {socials.map(social => (
                                <View key={social.id} style={styles.socialListItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name={(SOCIAL_ICONS[social.platform] || 'Link')} size={18} color={colors.textPrimary} />
                                        <Text variant="body" color="textPrimary" style={{ marginLeft: spacing.sm }}>{social.url}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteSocial(social.id)}>
                                        <Icon name="Trash2" size={18} color={colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <View style={styles.addSocialBox}>
                                <View style={styles.platformSelector}>
                                    {Object.keys(SOCIAL_ICONS).map(plat => (
                                        <TouchableOpacity 
                                            key={plat} 
                                            style={[styles.platformIcon, newPlatform === plat && styles.platformIconActive]}
                                            onPress={() => setNewPlatform(plat)}
                                        >
                                            <Icon name={SOCIAL_ICONS[plat]} size={16} color={newPlatform === plat ? colors.primary : colors.textSecondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                                    <TextInput 
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                        value={newUrl}
                                        onChangeText={setNewUrl}
                                        placeholder="Kullanıcı adı veya Link..."
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                    <TouchableOpacity style={styles.addSocialBtn} onPress={handleAddSocial} disabled={saving}>
                                        <Icon name="Plus" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
                                {saving ? <ActivityIndicator color="white" /> : <Text variant="label" weight="bold" color="#FFFFFF">Değişiklikleri Kaydet</Text>}
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: spacing.xxl,
    },
    bannerContainer: {
        height: 160,
        width: '100%',
        position: 'relative',
        borderRadius: radius.xl,
        overflow: 'hidden',
        marginBottom: spacing.md, // gives room for avatar to pop out
    },
    bannerGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    glassStatsWrapper: {
        position: 'absolute',
        bottom: spacing.lg,
        right: spacing.lg,
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    glassStatsInner: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    profileInfoContainer: {
        paddingHorizontal: spacing.md,
    },
    leftContent: {
        alignItems: 'flex-start',
    },
    rightContent: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: -60,
        marginBottom: spacing.lg,
        zIndex: 10,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: spacing.lg,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 6,
        borderColor: colors.background, // Match screen background so it cuts cleanly
        backgroundColor: colors.surface,
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.background,
    },
    nameAndStatus: {
        paddingBottom: spacing.sm,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    verifiedTick: {
        marginLeft: spacing.sm,
    },
    handleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    username: {
        marginRight: spacing.md,
    },
    liveStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // green tint
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.pill,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
        marginRight: spacing.xs,
    },
    bioText: {
        lineHeight: 24,
        marginBottom: spacing.lg,
        fontSize: 16,
        maxWidth: '90%',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.lg,
    },
    titleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    titleIcon: {
        marginRight: 6,
    },
    socialsList: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    socialIconBtn: {
        padding: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: radius.circle,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.base,
    },
    prestigeStatsBar: {
        flexDirection: 'row',
        gap: spacing.xxl,
        marginTop: spacing.xs,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight,
    },
    prestigeItem: {
        alignItems: 'flex-start', // Editorial style left-aligned
    },
    editProfileBtnMobile: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.base,
        alignSelf: 'flex-start',
    },
    editProfileBtnDesktop: {
        position: 'absolute',
        top: -70, // Align with name row visually in web
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.base,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    actionButtonsDesktop: {
        position: 'absolute',
        top: -70,
        right: 0,
    },
    followBtn: {
        backgroundColor: colors.textPrimary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageBtn: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.circle,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...shadows.base,
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        padding: spacing.xl,
        maxHeight: '90%',
    },
    modalTitle: {
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
    },
    avatarOption: {
        flex: 1,
        margin: spacing.xs,
        padding: 4,
        borderRadius: radius.circle,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    avatarOptionSelected: {
        borderColor: colors.primary,
    },
    avatarThumbnail: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 50,
    },
    
    // Forms
    inputLabel: {
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.lg,
    },
    socialListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    addSocialBox: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        marginBottom: spacing.xl,
    },
    platformSelector: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    platformIcon: {
        padding: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    platformIconActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    addSocialBtn: {
        backgroundColor: colors.primary,
        width: 52,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.glow,
    }
});
