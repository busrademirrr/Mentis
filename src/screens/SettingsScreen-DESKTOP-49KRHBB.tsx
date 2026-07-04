import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput, Switch, Modal } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { spacing, radius, typography } from '../theme';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { supabase } from '../lib/supabase';
import { updateProfileInfo } from '../services/profileService';
import Toast from 'react-native-toast-message';

const SETTING_SECTIONS = [
    { id: 'general', title: 'Genel', icon: 'settings' },
    { id: 'appearance', title: 'Görünüm', icon: 'layout' },
    { id: 'notifications', title: 'Bildirimler', icon: 'bell' },
    { id: 'export', title: 'Hesap Yönetimi', icon: 'user' }
];

export const SettingsScreen = () => {
    const styles = useStyles();
    return (
        <Screen backgroundColor="background" withSafeTop hideRightSidebar={true}>
            <SettingsContent styles={styles} />
        </Screen>
    );
};

const SettingsContent = ({ styles }: { styles: any }) => {
    const { user, profile, signOut, refreshSession } = useAuth();
    const { preferences, updatePreference } = usePreferences();

    const [activeSection, setActiveSection] = useState('general');
    
    // Modals
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    
    // General Settings State
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [isSavingGeneral, setIsSavingGeneral] = useState(false);
    const [usernameError, setUsernameError] = useState('');

    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setFullName(profile.full_name || '');
        }
    }, [profile]);

    const originalUsername = profile?.username || '';
    const originalFullName = profile?.full_name || '';
    const isGeneralDirty = profile && (username !== originalUsername || fullName !== originalFullName);

    const validateUsername = async (un: string) => {
        if (un.length < 3 || un.length > 30) return 'Kullanıcı adı 3 ile 30 karakter arasında olmalıdır.';
        if (un.includes(' ')) return 'Kullanıcı adı boşluk içeremez.';
        
        // Check uniqueness
        if (un !== profile?.username) {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('id')
                .ilike('username', un)
                .neq('user_id', user?.id)
                .single();
            
            if (data) return 'Bu kullanıcı adı zaten alınmış.';
        }
        return '';
    };

    const handleSaveGeneral = async () => {
        if (!user) return;
        setIsSavingGeneral(true);
        setUsernameError('');

        const errorMsg = await validateUsername(username);
        if (errorMsg) {
            setUsernameError(errorMsg);
            setIsSavingGeneral(false);
            return;
        }

        try {
            // Update user_profiles table
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ username, full_name: fullName })
                .eq('user_id', user.id);

            if (profileError) throw profileError;
            
            // Crucial: Update users table as well to reflect changes in feed/app
            const { error: usersError } = await supabase
                .from('users')
                .update({ username, full_name: fullName })
                .eq('id', user.id);
                
            if (usersError) {
                console.error('Failed to update users table:', usersError);
                // Do not throw, as profile was updated, but we log the error
            }
            
            await refreshSession(); // Update AuthContext profile
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Bilgileriniz güncellendi.' });
        } catch (error) {
            console.error('Update profile error:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Güncelleme başarısız.' });
        } finally {
            setIsSavingGeneral(false);
        }
    };

    const handleLogout = async () => {
        setLogoutModalVisible(false);
        try {
            await signOut();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Çıkış yapılırken bir sorun oluştu.' });
        }
    };

    const handleExport = async () => {
        if (!user) return;
        Toast.show({ type: 'info', text1: 'Hazırlanıyor...', text2: 'Verileriniz derleniyor, lütfen bekleyin.' });
        try {
            // Fetch everything
            const [posts, comments, likes, saved, follows] = await Promise.all([
                supabase.from('posts').select('*').eq('author_id', user.id),
                supabase.from('comments').select('*').eq('user_id', user.id),
                supabase.from('post_interactions').select('*').eq('user_id', user.id),
                supabase.from('saved_posts').select('*').eq('user_id', user.id),
                supabase.from('followers').select('*').or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
            ]);

            const exportData = {
                profile,
                preferences,
                posts: posts.data || [],
                comments: comments.data || [],
                interactions: likes.data || [],
                saved: saved.data || [],
                follows: follows.data || []
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            if (Platform.OS === 'web') {
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mentis_export_${profile?.username || 'user'}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Verileriniz indirildi.' });
        } catch (err) {
            console.error('Export failed:', err);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Dışa aktarma başarısız oldu.' });
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== profile?.username) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Kullanıcı adı eşleşmiyor.' });
            return;
        }

        try {
            const { error } = await supabase.rpc('delete_user_account');
            if (error) throw error;
            
            setDeleteModalVisible(false);
            await signOut();
            Toast.show({ type: 'success', text1: 'Elveda', text2: 'Hesabınız kalıcı olarak silindi.' });
        } catch (err) {
            console.error('Delete account error:', err);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Hesap silinirken bir sorun oluştu.' });
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'general':
                return (
                    <View style={styles.contentSection}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl}}>
                            <Text variant="h2" weight="bold">Genel Ayarlar</Text>
                            {isGeneralDirty && (
                                <TouchableOpacity 
                                    style={[styles.saveBtn, isSavingGeneral && { opacity: 0.7 }]} 
                                    onPress={handleSaveGeneral}
                                    disabled={isSavingGeneral}
                                >
                                    <Text variant="label" weight="bold" color="surface">
                                        {isSavingGeneral ? 'Kaydediliyor...' : 'Kaydet'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.modernCard}>
                            <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.xs }}>İsim</Text>
                            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
                            
                            <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.xs, marginTop: spacing.md }}>Kullanıcı Adı</Text>
                            <TextInput style={[styles.input, usernameError ? { borderColor: colors.error } : null]} value={username} onChangeText={setUsername} autoCapitalize="none" />
                            {usernameError ? <Text variant="caption" color="error" style={{marginTop: 4}}>{usernameError}</Text> : null}
                            
                            <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.xs, marginTop: spacing.md }}>E-posta (Değiştirilemez)</Text>
                            <TextInput style={[styles.input, { backgroundColor: colors.borderHighlight, opacity: 0.6 }]} value={user?.email || ''} editable={false} />
                        </View>
                    </View>
                );
            case 'appearance':
                return (
                    <View style={styles.contentSection}>
                        <Text variant="h2" weight="bold" style={{ marginBottom: spacing.xl }}>Görünüm</Text>
                        <View style={styles.themeOptions}>
                            <TouchableOpacity style={[styles.themeBox, preferences.theme === 'light' && styles.themeBoxActive]} onPress={() => updatePreference('theme', 'light')}>
                                <View style={[styles.themePreview, { backgroundColor: '#f8fafc' }]} />
                                <Text variant="label" weight="bold" style={{ marginTop: spacing.sm }}>Açık</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.themeBox, preferences.theme === 'dark' && styles.themeBoxActive]} onPress={() => updatePreference('theme', 'dark')}>
                                <View style={[styles.themePreview, { backgroundColor: '#0f172a' }]} />
                                <Text variant="label" weight="bold" style={{ marginTop: spacing.sm }}>Karanlık</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 'notifications':
                return (
                    <View style={styles.contentSection}>
                        <Text variant="h2" weight="bold" style={{ marginBottom: spacing.xl }}>Bildirimler</Text>
                        <View style={styles.modernCard}>
                            <View style={styles.settingRow}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="body" weight="bold">Anlık Bildirimler</Text>
                                    <Text variant="caption" color="textSecondary">Uygulama içi anlık bildirimler alın.</Text>
                                </View>
                                <Switch 
                                    value={profile?.push_enabled !== false} 
                                    onValueChange={async (val) => {
                                        await updateProfileInfo({ push_enabled: val });
                                        await refreshSession();
                                    }} 
                                    trackColor={{ true: colors.primary, false: '#e5e7eb' }} 
                                />
                            </View>
                            <View style={styles.settingRow}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="body" weight="bold">E-posta Bildirimleri</Text>
                                    <Text variant="caption" color="textSecondary">Önemli güncellemeleri e-posta ile alın.</Text>
                                </View>
                                <Switch 
                                    value={preferences.email_notifications} 
                                    onValueChange={(val) => { updatePreference('email_notifications', val); }}
                                    trackColor={{ false: colors.borderHighlight, true: colors.primary }}
                                />
                            </View>
                            <View style={[styles.settingRow, {borderBottomWidth: 0}]}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="body" weight="bold">Bahsetmeler (Mentions)</Text>
                                    <Text variant="caption" color="textSecondary">Birisi sizden bahsettiğinde bildirim alın.</Text>
                                </View>
                                <Switch 
                                    value={preferences.mention_notifications} 
                                    onValueChange={(val) => { updatePreference('mention_notifications', val); }} 
                                    trackColor={{ true: colors.primary, false: '#e5e7eb' }} 
                                />
                            </View>
                        </View>
                    </View>
                );

            case 'export':
                return (
                    <View style={styles.contentSection}>
                        <Text variant="h2" weight="bold" style={{ marginBottom: spacing.xl }}>Hesap Yönetimi</Text>
                        <View style={[styles.modernCard, { marginBottom: spacing.xl }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                                <View style={{flex: 1}}>
                                    <Text variant="body" weight="bold">Verilerimi İndir</Text>
                                    <Text variant="caption" color="textSecondary" style={{marginTop: 4}}>Tüm içerikleriniz, tartışmalarınız ve geçmişiniz JSON formatında hazırlanıp cihazınıza indirilir.</Text>
                                </View>
                                <TouchableOpacity style={styles.actionBtn} onPress={handleExport}>
                                    <Icon name="download" size={16} color={colors.primary} />
                                    <Text variant="label" weight="bold" color="primary" style={{marginLeft: 8}}>İndir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <Text variant="h3" weight="bold" color="error" style={{ marginBottom: spacing.md, marginTop: spacing.md }}>Tehlikeli Bölge</Text>
                        <View style={styles.dangerZone}>
                            <Text variant="body" weight="bold">Hesabı Sil</Text>
                            <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.</Text>
                            <TouchableOpacity style={styles.dangerBtn} onPress={() => setDeleteModalVisible(true)}>
                                <Text variant="label" weight="bold" color="error">Hesabımı Kalıcı Olarak Sil</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.layoutGrid}>
                {/* LEFT SIDEBAR - Navigation */}
                <View style={styles.leftSidebar}>
                    <Text variant="caption" weight="bold" color="textSecondary" style={styles.sidebarTitle}>AYARLAR</Text>
                    {SETTING_SECTIONS.map((section) => (
                        <TouchableOpacity 
                            key={section.id} 
                            style={[styles.navItem, activeSection === section.id && styles.navItemActive]}
                            onPress={() => setActiveSection(section.id)}
                        >
                            <Icon name={section.icon} size={18} color={activeSection === section.id ? colors.primary : colors.textSecondary} />
                            <Text variant="label" weight={activeSection === section.id ? 'bold' : 'medium'} color={activeSection === section.id ? 'primary' : 'textSecondary'} style={styles.navText}>
                                {section.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={[styles.navItem, { marginTop: spacing.xl }]} onPress={() => setLogoutModalVisible(true)}>
                        <Icon name="log-out" size={18} color={colors.error} />
                        <Text variant="label" weight="bold" color="error" style={styles.navText}>Çıkış Yap</Text>
                    </TouchableOpacity>
                </View>

                {/* CENTER - Main Content */}
                <View style={styles.centerContent}>
                    {renderContent()}
                </View>
            </View>

            {/* Logout Modal */}
            <Modal visible={logoutModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text variant="h2" weight="bold" style={{marginBottom: 16}}>Emin misiniz?</Text>
                        <Text style={{marginBottom: 24}}>Çıkış yapmak istediğinize emin misiniz?</Text>
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 12}}>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor: colors.borderHighlight}]} onPress={() => setLogoutModalVisible(false)}>
                                <Text weight="bold">İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor: colors.error}]} onPress={handleLogout}>
                                <Text weight="bold" color="surface">Çıkış Yap</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Modal */}
            <Modal visible={deleteModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text variant="h2" weight="bold" color="error" style={{marginBottom: 16}}>Hesabı Sil</Text>
                        <Text style={{marginBottom: 16}}>Bu işlem geri alınamaz. Profiliniz, gönderileriniz, yorumlarınız ve tüm etkileşimleriniz kalıcı olarak silinecektir.</Text>
                        <Text style={{marginBottom: 8}} weight="bold">Onaylamak için tam kullanıcı adınızı yazın: <Text color="primary">{profile?.username}</Text></Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder={profile?.username}
                            value={deleteConfirmText}
                            onChangeText={setDeleteConfirmText}
                            autoCapitalize="none"
                        />
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24}}>
                            <TouchableOpacity style={[styles.modalBtn, {backgroundColor: colors.borderHighlight}]} onPress={() => {setDeleteModalVisible(false); setDeleteConfirmText('');}}>
                                <Text weight="bold">İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, {backgroundColor: deleteConfirmText === profile?.username ? colors.error : colors.textTertiary}]} 
                                onPress={handleDeleteAccount}
                                disabled={deleteConfirmText !== profile?.username}
                            >
                                <Text weight="bold" color="surface">Kalıcı Olarak Sil</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

const useStyles = () => StyleSheet.create({
    container: {
        padding: spacing.xl,
        maxWidth: 1000,
        marginHorizontal: 'auto',
        width: '100%',
        paddingBottom: 100,
    },
    layoutGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: spacing.xxl,
    },
    leftSidebar: {
        width: Platform.OS === 'web' ? 240 : '100%',
    },
    centerContent: {
        flex: 1,
    },
    sidebarTitle: {
        marginBottom: spacing.md,
        paddingLeft: spacing.sm,
        letterSpacing: 1,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        marginBottom: 2,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    navItemActive: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...(Platform.OS === 'web' && { boxShadow: '0 2px 8px rgba(0,0,0,0.02)' } as any),
    },
    navText: {
        marginLeft: spacing.md,
    },
    contentSection: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        padding: spacing.xxl,
        ...(Platform.OS === 'web' && { boxShadow: '0 4px 12px rgba(0,0,0,0.02)' } as any),
    },
    modernCard: {
        backgroundColor: colors.background,
        padding: spacing.xl,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        color: colors.textPrimary,
        fontSize: 14,
        ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    themeOptions: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    themeBox: {
        flex: 1,
        borderWidth: 2,
        borderColor: colors.borderHighlight,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    themeBoxActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    themePreview: {
        width: '100%',
        aspectRatio: 1.5,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    dangerZone: {
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        backgroundColor: 'rgba(239, 68, 68, 0.02)',
        borderRadius: radius.md,
        padding: spacing.lg,
    },
    dangerBtn: {
        borderWidth: 1,
        borderColor: colors.error,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'all 0.2s ease' } as any),
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xxl,
        width: '100%',
        maxWidth: 400,
    },
    modalBtn: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
    }
});
