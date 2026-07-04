import React from 'react';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import { Icon, Text } from '../components/ui';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

// App Screens
import { FeedScreen } from '../screens/FeedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreatorScreen } from '../screens/CreatorScreen';
import { ArenaScreen } from '../screens/ArenaScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { DebateRoomScreen } from '../screens/DebateRoomScreen';
import { DebateCreateScreen } from '../screens/DebateCreateScreen';
import { InboxScreen } from '../screens/InboxScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { CommentsScreen } from '../screens/CommentsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProUpgradeScreen } from '../screens/ProUpgradeScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { BadgesScreen } from '../screens/BadgesScreen';
import { KnowledgeDetailScreen } from '../screens/KnowledgeDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
    const { isDesktop } = useResponsive();
    const { unreadCount } = useNotifications();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: isDesktop ? { display: 'none' } : styles.tabBar,
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.borderHighlight }]} />
                    )
                ),
                tabBarActiveTintColor: '#7C3AED',
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tab.Screen
                name="Akış"
                component={FeedScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <View style={styles.iconContainer}>
                            <Icon name="layers" size={24} color={color} />
                            <Text variant="caption" color={focused ? "textPrimary" : "textSecondary"} weight={focused ? "bold" : "regular"} style={{ fontSize: 10, marginTop: 4, color }}>Akış</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Arena"
                component={ArenaScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <View style={styles.iconContainer}>
                            <Icon name="award" size={24} color={color} />
                            <Text variant="caption" color={focused ? "textPrimary" : "textSecondary"} weight={focused ? "bold" : "regular"} style={{ fontSize: 10, marginTop: 4, color }}>Arena</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Üret"
                component={CreatorScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <View style={styles.iconContainer}>
                            <Icon name="plus-square" size={24} color={color} />
                            <Text variant="caption" color={focused ? "textPrimary" : "textSecondary"} weight={focused ? "bold" : "regular"} style={{ fontSize: 10, marginTop: 4, color }}>Üret</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Mesajlar"
                component={MessagesScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <View style={styles.iconContainer}>
                            <Icon name="message-square" size={24} color={color} />
                            <Text variant="caption" color={focused ? "textPrimary" : "textSecondary"} weight={focused ? "bold" : "regular"} style={{ fontSize: 10, marginTop: 4, color }}>Mesajlar</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Ayarlar"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <View style={styles.iconContainer}>
                            <Icon name="settings" size={24} color={color} />
                            <Text variant="caption" color={focused ? "textPrimary" : "textSecondary"} weight={focused ? "bold" : "regular"} style={{ fontSize: 10, marginTop: 4, color }}>Ayarlar</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Bildirimler"
                component={NotificationsScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <View style={styles.iconContainer}>
                            <View style={{ position: 'relative' }}>
                                <Icon name="bell" size={24} color={color} />
                                {unreadCount > 0 && (
                                    <View style={styles.tabBadge}>
                                        <Text variant="caption" weight="bold" color="surface" style={{ fontSize: 9 }}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text variant="caption" color={focused ? "textPrimary" : "textSecondary"} weight={focused ? "bold" : "regular"} style={{ fontSize: 10, marginTop: 4, color }}>Bildirimler</Text>
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Profil"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <View style={styles.iconContainer}>
                            <Icon name="user" size={24} color={color} />
                            <Text variant="caption" color={focused ? "textPrimary" : "textSecondary"} weight={focused ? "bold" : "regular"} style={{ fontSize: 10, marginTop: 4, color }}>Profil</Text>
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Check if onboarding is completed based on user metadata
    const hasCompletedOnboarding = user?.user_metadata?.onboarding_completed === true;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                // --- AUTHENTICATION FLOW ---
                <Stack.Group>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </Stack.Group>
            ) : !hasCompletedOnboarding ? (
                // --- ONBOARDING FLOW ---
                <Stack.Group>
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    {/* Allow them to go to Main manually if needed, but defaults to Onboarding */}
                    <Stack.Screen name="Main" component={MainTabs} />
                </Stack.Group>
            ) : (
                // --- MAIN APP FLOW ---
                <Stack.Group>
                    <Stack.Screen name="Main" component={MainTabs} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="Inbox" component={InboxScreen} />
                    <Stack.Screen name="Chat" component={ChatScreen} />
                    <Stack.Screen name="Comments" component={CommentsScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="Saved" component={SavedScreen} />
                    <Stack.Screen name="Activity" component={ActivityScreen} />
                    <Stack.Screen name="Badges" component={BadgesScreen} />
                    <Stack.Screen name="DebateRoom" component={DebateRoomScreen} />
                    <Stack.Screen name="DebateCreate" component={DebateCreateScreen} />
                    <Stack.Screen name="PostDetail" component={KnowledgeDetailScreen} />
                    <Stack.Screen name="ProUpgrade" component={ProUpgradeScreen} options={{ presentation: 'modal' }} />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        borderTopWidth: 1,
        borderTopColor: colors.borderHighlight, 
        backgroundColor: 'transparent',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: 60,
    },
    tabBadge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: colors.primary,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: colors.background,
    }
});
