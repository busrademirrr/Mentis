import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Platform, Image } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Props {
    visible: boolean;
    onClose: () => void;
    anchorRect?: { x: number, y: number, width: number, height: number } | null;
}

export const ProfileDropdown = ({ visible, onClose, anchorRect }: Props) => {
    const { user, signOut } = useAuth();
    const navigation = useNavigation<any>();

    const handleLogout = async () => {
        onClose();
        await signOut();
    };

    // sample profile data for display since user might not have full metadata
    const profile = {
        name: user?.user_metadata?.full_name || 'Kullanıcı',
        username: user?.email?.split('@')[0] || 'kullanici',
        league: 'Altın Lig',
        xp: '12.5K',
        followers: 256,
        avatar: user?.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=11'
    };

    const handleNavigate = (route: string) => {
        onClose();
        navigation.navigate(route);
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View 
                    style={[
                        styles.dropdown, 
                        anchorRect ? { 
                            top: anchorRect.y + anchorRect.height + 8, 
                            right: Platform.OS === 'web' ? window.innerWidth - (anchorRect.x + anchorRect.width) : spacing.lg 
                        } : { top: 70, right: 20 }
                    ]}
                >
                    {/* Header - Mini Dashboard */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                            <View style={styles.userInfo}>
                                <Text variant="body" weight="bold" color="textPrimary">{profile.name}</Text>
                                <Text variant="caption" color="textSecondary">@{profile.username}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text variant="caption" color="textSecondary">XP</Text>
                                <Text variant="body" weight="bold" color="primary">{profile.xp}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text variant="caption" color="textSecondary">Takipçi</Text>
                                <Text variant="body" weight="bold" color="textPrimary">{profile.followers}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text variant="caption" color="textSecondary">Lig</Text>
                                <Text variant="body" weight="bold" color="warning">{profile.league}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    {/* Menu Items */}
                    <View style={styles.menu}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Profil')}>
                            <Icon name="user" size={16} color={colors.textSecondary} />
                            <Text variant="body" color="textPrimary" style={styles.menuText}>Profili Görüntüle</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Saved')}>
                            <Icon name="bookmark" size={16} color={colors.textSecondary} />
                            <Text variant="body" color="textPrimary" style={styles.menuText}>Kaydedilenler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Settings')}>
                            <Icon name="settings" size={16} color={colors.textSecondary} />
                            <Text variant="body" color="textPrimary" style={styles.menuText}>Ayarlar</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.separator} />

                    {/* Footer */}
                    <View style={styles.menu}>
                        <TouchableOpacity style={styles.menuItem}>
                            <Icon name="help-circle" size={16} color={colors.textSecondary} />
                            <Text variant="body" color="textPrimary" style={styles.menuText}>Yardım Merkezi</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); logout(); }}>
                            <Icon name="log-out" size={16} color={colors.error} />
                            <Text variant="body" color="error" style={styles.menuText}>Çıkış Yap</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    dropdown: {
        position: 'absolute',
        width: 280,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        ...shadows.lg,
        elevation: 8,
    },
    header: {
        padding: spacing.lg,
        backgroundColor: colors.background,
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: spacing.md,
    },
    userInfo: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    },
    statBox: {
        alignItems: 'center',
    },
    separator: {
        height: 1,
        backgroundColor: colors.borderHighlight,
    },
    menu: {
        padding: spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        ...(Platform.OS === 'web' && { cursor: 'pointer', transition: 'background-color 0.2s' } as any),
    },
    menuText: {
        marginLeft: spacing.md,
        fontSize: 14,
    }
});
