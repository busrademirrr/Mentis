import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Icon } from '../components/ui';
import { colors, spacing, radius } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

export const SettingsScreen = () => {
    const { user, logout } = useAuth();

    const [activeTab, setActiveTab] = useState('hesap');
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(false);
    const [privateProfile, setPrivateProfile] = useState(false);
    const [activeStatus, setActiveStatus] = useState(true);
    const [newFollowersAlert, setNewFollowersAlert] = useState(true);
    
    const [username, setUsername] = useState('@kantinkedisi');
    
    useEffect(() => {
        if (user?.username) {
            setUsername(`@${user.username}`);
        }
    }, [user]);

    const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean, message: string) => {
        setter(value);
        Toast.show({
            type: 'success',
            text1: 'Başarılı',
            text2: message
        });
    };

    const handleThemeChange = (isDark: boolean) => {
        setDarkMode(isDark);
        Toast.show({
            type: 'success',
            text1: 'Tema Güncellendi',
            text2: isDark ? 'Karanlık temaya geçildi.' : 'Açık temaya geçildi.'
        });
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            Toast.show({
                type: 'success',
                text1: 'Çıkış Yapıldı',
                text2: 'Başarıyla çıkış yaptınız.'
            });
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Çıkış yapılamadı.'
            });
        }
    };
    
    const handleUpgrade = () => {
        Toast.show({
            type: 'info',
            text1: 'Yakında',
            text2: 'Pro üyelik satın alma işlemi yakında aktif olacak.'
        });
    };
    
    const handleSaveProfile = () => {
        Toast.show({
            type: 'success',
            text1: 'Kaydedildi',
            text2: 'Profil bilgileriniz güncellendi.'
        });
    };

    const renderTabMenu = () => (
        <View style={styles.tabMenu}>
            <TouchableOpacity style={[styles.tabMenuItem, activeTab === 'hesap' && styles.tabMenuItemActive]} onPress={() => setActiveTab('hesap')}>
                <Icon name="user" size={18} color={activeTab === 'hesap' ? colors.primary : colors.textSecondary} />
                <Text variant="label" weight={activeTab === 'hesap' ? 'bold' : 'medium'} color={activeTab === 'hesap' ? 'primary' : 'textSecondary'} style={styles.tabMenuText}>Hesap Bilgileri</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabMenuItem, activeTab === 'gorunum' && styles.tabMenuItemActive]} onPress={() => setActiveTab('gorunum')}>
                <Icon name="layout" size={18} color={activeTab === 'gorunum' ? colors.primary : colors.textSecondary} />
                <Text variant="label" weight={activeTab === 'gorunum' ? 'bold' : 'medium'} color={activeTab === 'gorunum' ? 'primary' : 'textSecondary'} style={styles.tabMenuText}>Görünüm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabMenuItem, activeTab === 'bildirimler' && styles.tabMenuItemActive]} onPress={() => setActiveTab('bildirimler')}>
                <Icon name="bell" size={18} color={activeTab === 'bildirimler' ? colors.primary : colors.textSecondary} />
                <Text variant="label" weight={activeTab === 'bildirimler' ? 'bold' : 'medium'} color={activeTab === 'bildirimler' ? 'primary' : 'textSecondary'} style={styles.tabMenuText}>Bildirimler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabMenuItem, activeTab === 'abonelik' && styles.tabMenuItemActive]} onPress={() => setActiveTab('abonelik')}>
                <Icon name="star" size={18} color={activeTab === 'abonelik' ? colors.primary : colors.textSecondary} />
                <Text variant="label" weight={activeTab === 'abonelik' ? 'bold' : 'medium'} color={activeTab === 'abonelik' ? 'primary' : 'textSecondary'} style={styles.tabMenuText}>Abonelik & Pro</Text>
            </TouchableOpacity>
            
            <View style={styles.tabMenuDivider} />
            
            <TouchableOpacity style={styles.tabMenuItem} onPress={handleLogout}>
                <Icon name="log-out" size={18} color={colors.error} />
                <Text variant="label" weight="bold" color="error" style={styles.tabMenuText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'hesap':
                return (
                    <View style={styles.contentSection}>
                        <Text variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>Genel Profil</Text>
                        <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.xs }}>E-posta Adresi</Text>
                        <TextInput style={styles.input} value={profile?.email || "immanuel@kant.com"} editable={false} />
                        
                        <Text variant="label" color="textSecondary" style={{ marginBottom: spacing.xs, marginTop: spacing.md }}>Kullanıcı Adı</Text>
                        <TextInput style={styles.input} value={username} onChangeText={setUsername} onBlur={handleSaveProfile} />
                        
                        <View style={styles.divider} />
                        
                        <Text variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>Gizlilik</Text>
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text variant="body" weight="bold">Gizli Profil</Text>
                                <Text variant="caption" color="textSecondary">Profilini sadece takipçilerin görebilir.</Text>
                            </View>
                            <Switch value={privateProfile} onValueChange={(val) => handleToggle(setPrivateProfile, val, 'Gizlilik ayarları güncellendi.')} trackColor={{ true: colors.primary, false: colors.border }} />
                        </View>
                        
                        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text variant="body" weight="bold">Aktivite Durumu</Text>
                                <Text variant="caption" color="textSecondary">Çevrimiçi olduğunu diğer kullanıcılara göster.</Text>
                            </View>
                            <Switch value={activeStatus} onValueChange={(val) => handleToggle(setActiveStatus, val, 'Aktivite durumu güncellendi.')} trackColor={{ true: colors.primary, false: colors.border }} />
                        </View>
                    </View>
                );
            case 'gorunum':
                return (
                    <View style={styles.contentSection}>
                        <Text variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>Tema Tercihi</Text>
                        
                        <View style={styles.themeOptions}>
                            <TouchableOpacity style={[styles.themeBox, !darkMode && styles.themeBoxActive]} onPress={() => handleThemeChange(false)}>
                                <View style={[styles.themePreview, { backgroundColor: '#f8fafc' }]}>
                                    <View style={{ width: '80%', height: 10, backgroundColor: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                                    <View style={{ width: '60%', height: 10, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
                                </View>
                                <Text variant="label" weight="bold" style={{ marginTop: spacing.sm }}>Açık Tema</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.themeBox, darkMode && styles.themeBoxActive]} onPress={() => handleThemeChange(true)}>
                                <View style={[styles.themePreview, { backgroundColor: '#0f172a' }]}>
                                    <View style={{ width: '80%', height: 10, backgroundColor: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
                                    <View style={{ width: '60%', height: 10, backgroundColor: '#1e293b', borderRadius: 4 }} />
                                </View>
                                <Text variant="label" weight="bold" style={{ marginTop: spacing.sm }}>Karanlık Tema</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 'bildirimler':
                return (
                    <View style={styles.contentSection}>
                        <Text variant="h3" weight="bold" style={{ marginBottom: spacing.lg }}>Bildirim Tercihleri</Text>
                        
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text variant="body" weight="bold">Anlık Bildirimler (Push)</Text>
                                <Text variant="caption" color="textSecondary">Münazara davetleri ve mesajlar için bildirim al.</Text>
                            </View>
                            <Switch value={notifications} onValueChange={(val) => handleToggle(setNotifications, val, 'Bildirim tercihleri güncellendi.')} trackColor={{ true: colors.primary, false: colors.border }} />
                        </View>
                        
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text variant="body" weight="bold">E-Posta Bülteni</Text>
                                <Text variant="caption" color="textSecondary">Haftalık özetler ve trend tartışmalar.</Text>
                            </View>
                            <Switch value={emailAlerts} onValueChange={(val) => handleToggle(setEmailAlerts, val, 'E-posta bülteni tercihleri güncellendi.')} trackColor={{ true: colors.primary, false: colors.border }} />
                        </View>
                        
                        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text variant="body" weight="bold">Yeni Takipçiler</Text>
                                <Text variant="caption" color="textSecondary">Seni biri takip ettiğinde haber ver.</Text>
                            </View>
                            <Switch value={newFollowersAlert} onValueChange={(val) => handleToggle(setNewFollowersAlert, val, 'Takipçi bildirimleri güncellendi.')} trackColor={{ true: colors.primary, false: colors.border }} />
                        </View>
                    </View>
                );
            case 'abonelik':
                return (
                    <View style={styles.contentSection}>
                        <LinearGradient
                            colors={['#8b5cf6', '#c0aede']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.proBanner}
                        >
                            <Icon name="star" size={32} color="white" />
                            <Text variant="h2" weight="bold" color="surface" style={{ marginTop: spacing.sm }}>Mentis Pro</Text>
                            <Text variant="body" color="surface" style={{ opacity: 0.9, marginTop: spacing.xs }}>
                                Altın lige yüksel ve sınırsız arena katılımı kazan.
                            </Text>
                        </LinearGradient>
                        
                        <View style={{ marginTop: spacing.lg }}>
                            <Text variant="h3" weight="bold" style={{ marginBottom: spacing.md }}>Abonelik Durumu</Text>
                            <View style={styles.planCard}>
                                <View>
                                    <Text variant="label" color="textSecondary">Mevcut Plan</Text>
                                    <Text variant="h3" weight="bold" color="primary">Ücretsiz (Standart)</Text>
                                </View>
                                <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
                                    <Text variant="label" weight="bold" color="surface">Yükselt</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <Screen backgroundColor="background" withSafeTop hideRightSidebar={true}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text variant="h2" weight="bold" color="textPrimary">
                        {profile?.username || 'Kullanıcı'}
                    </Text>
                    <Text variant="body" color="textSecondary" style={{ marginTop: spacing.xs }}>
                        @{profile?.username || 'kullanici'}
                    </Text>
                </View>

                <View style={styles.layoutGrid}>
                    <View style={styles.sidebar}>
                        {renderTabMenu()}
                    </View>
                    <View style={styles.mainContent}>
                        {renderContent()}
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.xl,
        maxWidth: 1000,
        marginHorizontal: 'auto',
        width: '100%',
    },
    header: {
        marginBottom: spacing.xl,
    },
    layoutGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: spacing.xl,
    },
    sidebar: {
        width: Platform.OS === 'web' ? 240 : '100%',
    },
    mainContent: {
        flex: 1,
    },
    tabMenu: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        padding: spacing.sm,
    },
    tabMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        ...(Platform.OS === 'web' && { cursor: 'pointer' } as any),
    },
    tabMenuItemActive: {
        backgroundColor: colors.primaryLight || 'rgba(139, 92, 246, 0.1)',
    },
    tabMenuText: {
        marginLeft: spacing.sm,
    },
    tabMenuDivider: {
        height: 1,
        backgroundColor: colors.borderHighlight,
        marginVertical: spacing.sm,
    },
    contentSection: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        padding: spacing.xl,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderHighlight,
        marginVertical: spacing.xl,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
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
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
    },
    themePreview: {
        width: '100%',
        aspectRatio: 1.5,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        padding: spacing.md,
        justifyContent: 'center',
    },
    proBanner: {
        padding: spacing.xl,
        borderRadius: radius.lg,
        alignItems: 'center',
    },
    planCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.background,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    upgradeBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
    }
});
