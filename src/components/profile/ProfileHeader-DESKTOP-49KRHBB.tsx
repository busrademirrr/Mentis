import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Modal, FlatList, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { Text, Icon, Card } from '../ui';
import { updateAvatar, updateProfileInfo, addSocialLink, deleteSocialLink } from '../../services/profileService';
import { followService } from '../../services/followService';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';
import Toast from 'react-native-toast-message';
import { useResponsive } from '../../hooks/useResponsive';
import { BlurView } from 'expo-blur';
import { EditProfileModal, EditProfileData } from './EditProfileModal';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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
    profile: any;
    stats: any;
    relationship: any;
    isOwnProfile?: boolean;
    onProfileUpdate: () => void;
    onFollowersClick?: () => void;
    onFollowingClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, stats, relationship, isOwnProfile = true, onProfileUpdate, onFollowersClick, onFollowingClick }) => {
    const navigation = useNavigation<any>();
    const { isDesktop, isTablet } = useResponsive();
    const isWebDesktop = Platform.OS === 'web' && (isDesktop || isTablet);
    const { refreshSession } = useAuth();
    
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isAvatarModalVisible, setAvatarModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const getAvatarUri = () => {
        return profile.avatar_url || PRESETS['preset_1'];
    };

    const handleSaveProfile = async (data: EditProfileData) => {
        setSaving(true);
        try {
            await updateProfileInfo(data);
            await refreshSession();
            onProfileUpdate();
            setEditModalVisible(false);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Profil kaydedildi (V2)' });
        } catch (error: any) {
            console.error('Save Profile Error:', error);
            if (error?.message?.includes('location') || error?.message?.includes('schema cache')) {
                Toast.show({ type: 'error', text1: 'SQL Gerekli', text2: 'Lütfen verdiğim SQL kodunu Supabase\'de çalıştırın (location sütunu eksik).' });
            } else {
                Toast.show({ type: 'error', text1: 'Hata', text2: error?.message || 'Bir hata oluştu' });
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSelectPreset = async (url: string) => {
        setSaving(true);
        await updateAvatar(url);
        await refreshSession();
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
                let base64Data = result.assets[0].base64;
                if (base64Data.includes('base64,')) {
                    base64Data = base64Data.split('base64,')[1];
                }
                const bucketName = 'avatars';
                // Cache bust string
                const timestamp = Date.now().toString();
                const filePath = `${profile.id}/${timestamp}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, decode(base64Data), { contentType: 'image/jpeg', upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                
                await updateAvatar(data.publicUrl);
                
                await refreshSession();
                onProfileUpdate();
                setAvatarModalVisible(false);
            }
        } catch (error) {
            console.error(`Error uploading avatar:`, error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Fotoğraf yüklenemedi!' });
        } finally {
            setSaving(false);
        }
    };

    const handleFollowToggle = async () => {
        setFollowLoading(true);
        if (relationship?.follow_status === 'accepted' || relationship?.follow_status === 'pending') {
            await followService.unfollow(profile.id);
        } else {
            const result = await followService.requestFollow(profile.id);
            if (!result.success) {
                Toast.show({ type: 'error', text1: 'Hata', text2: (result as any).error || 'Takip edilemedi' });
            } else {
                Toast.show({ type: 'success', text1: result.newStatus === 'pending' ? 'Takip isteği gönderildi' : 'Takip ediliyor' });
            }
        }
        onProfileUpdate();
        setFollowLoading(false);
    };

    const handleMessage = () => {
        navigation.navigate('Main', { screen: 'Mesajlar', params: { userId: profile.id } });
    };

    return (
        <View style={styles.container}>
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
                                <Text variant="h1" weight="bold" color="textPrimary" style={{ fontSize: 32, letterSpacing: -0.5 }}>{profile.name || profile.username}</Text>
                                {profile.is_verified && (
                                    <View style={styles.verifiedTick}>
                                        <Icon name="CheckCircle" size={24} color={colors.primary} />
                                    </View>
                                )}
                            </View>
                            <View style={styles.handleRow}>
                                <Text variant="body" color="textSecondary" style={styles.username}>@{profile.username}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 1-2-3: PrestigeStatsBar (Followers, Following, Reputation) */}
                    <View style={[styles.prestigeStatsBar, { borderTopWidth: 0, paddingTop: 0, paddingBottom: spacing.lg }]}>
                        <TouchableOpacity style={styles.prestigeItem} onPress={onFollowersClick} activeOpacity={0.7}>
                            <Text variant="label" weight="bold" color="textPrimary">{stats?.follower_count || 0}</Text>
                            <Text variant="caption" color="textSecondary">Takipçi</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.prestigeItem} onPress={onFollowingClick} activeOpacity={0.7}>
                            <Text variant="label" weight="bold" color="textPrimary">{stats?.following_count || 0}</Text>
                            <Text variant="caption" color="textSecondary">Takip Edilen</Text>
                        </TouchableOpacity>
                        <View style={styles.prestigeItem}>
                            <Text variant="label" weight="bold" color="textPrimary">{stats?.reputation_score || 0}</Text>
                            <Text variant="caption" color="textSecondary">İtibar Puanı</Text>
                        </View>
                    </View>

                    {/* 4-5: MetadataRow (Join Date, Location) */}
                    <View style={styles.metadataRow}>
                        <View style={styles.metadataItem}>
                            <Icon name="Calendar" size={14} color={colors.textSecondary} />
                            <Text variant="caption" color="textSecondary" style={styles.metadataText}>
                                Mentis üyesi, {profile.created_at ? format(new Date(profile.created_at), 'MMMM yyyy', { locale: tr }) : 'Haziran 2026'}
                            </Text>
                        </View>
                        {profile.location && (
                            <View style={styles.metadataItem}>
                                <Icon name="MapPin" size={14} color={colors.textSecondary} />
                                <Text variant="caption" color="textSecondary" style={styles.metadataText}>{profile.location}</Text>
                            </View>
                        )}
                    </View>
                    
                    {/* 6: Bio */}
                    <Text variant="body" color="textPrimary" style={styles.bioText}>
                        {profile.bio || 'Kendinizi tanıtın'}
                    </Text>
                </View>

                {/* RIGHT SIDE: Edit Profile Button OR Action Buttons */}
                <View style={[styles.rightContent, !isWebDesktop && { marginTop: spacing.md }]}>
                    {isOwnProfile ? (
                        <TouchableOpacity 
                            style={isWebDesktop ? styles.editProfileBtnDesktop : styles.editProfileBtnMobile}
                            onPress={() => setEditModalVisible(true)}
                        >
                            <Icon name="Edit2" size={16} color={colors.textPrimary} />
                            <Text variant="label" weight="bold" color="textPrimary" style={{ marginLeft: spacing.xs }}>Profili Düzenle</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.actionButtonsContainer, isWebDesktop && styles.actionButtonsDesktop]}>
                            <TouchableOpacity 
                                style={[styles.followBtn, relationship?.follow_status && relationship.follow_status !== 'none' && styles.followingBtn]} 
                                onPress={handleFollowToggle}
                                disabled={followLoading}
                            >
                                {followLoading ? (
                                    <ActivityIndicator color={relationship?.follow_status && relationship.follow_status !== 'none' ? colors.primary : colors.surface} size="small" />
                                ) : (
                                    <Text variant="label" weight="bold" color={relationship?.follow_status && relationship.follow_status !== 'none' ? "primary" : "surface"}>
                                        {relationship?.follow_status === 'accepted' ? 'Takiptesin' : 
                                         relationship?.follow_status === 'pending' ? 'İstek Gönderildi' : 'Takip Et'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
                                <Icon name="MessageSquare" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* --- AVATAR MODAL --- */}
            <Modal visible={isAvatarModalVisible} transparent animationType="slide">
                <TouchableOpacity style={[styles.modalOverlay, Platform.OS === 'web' && { justifyContent: 'center', alignItems: 'center' }]} activeOpacity={1} onPress={() => setAvatarModalVisible(false)}>
                    <View style={[styles.modalContent, Platform.OS === 'web' && { width: 500, maxWidth: '90%', borderRadius: radius.xl }]} onStartShouldSetResponder={() => true}>
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
                                    style={[styles.avatarOption, profile.avatar_url === PRESETS[item] && styles.avatarOptionSelected]} 
                                    onPress={() => handleSelectPreset(PRESETS[item])}
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
            <EditProfileModal 
                visible={isEditModalVisible}
                onClose={() => setEditModalVisible(false)}
                onSave={handleSaveProfile}
                saving={saving}
                initialData={{
                    bio: profile.bio || '',
                    location: profile.location || ''
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: spacing.xxl,
        paddingTop: spacing.lg,
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
        alignItems: 'center',
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
        borderColor: colors.background, 
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
    bioText: {
        lineHeight: 24,
        marginBottom: spacing.lg,
        fontSize: 16,
        maxWidth: '90%',
    },
    metadataRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metadataText: {
        marginTop: 1,
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
        alignItems: 'flex-start',
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
    },
    followBtn: {
        backgroundColor: colors.textPrimary,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    followingBtn: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
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
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.glow,
    }
});
