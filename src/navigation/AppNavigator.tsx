import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import { Icon } from '../components/ui/Icon';
import { Text } from '../components/ui/Text';
import { useResponsive } from '../hooks/useResponsive';

// Screens
import { FeedScreen } from '../screens/FeedScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CreatorScreen } from '../screens/CreatorScreen';
import { ArenaScreen } from '../screens/ArenaScreen';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
    const { isDesktop } = useResponsive();

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
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(250, 249, 246, 0.95)', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }]} />
                    )
                ),
                tabBarActiveTintColor: '#8b5cf6',
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
                name="Üret"
                component={CreatorScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.fabWrapper}>
                            <LinearGradient
                                colors={['#8b5cf6', '#f472b6', '#fb923c']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={[styles.createButtonDiamond, focused && styles.createButtonFocused]}
                            >
                                <View style={styles.fabInner}>
                                    <Icon name="plus" size={28} color="surface" />
                                </View>
                            </LinearGradient>
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
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Inbox" component={InboxScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="Comments" component={CommentsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Saved" component={SavedScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Activity" component={ActivityScreen} />
            <Stack.Screen name="Badges" component={BadgesScreen} />
            <Stack.Screen name="DebateRoom" component={DebateRoomScreen} />
            <Stack.Screen name="DebateCreate" component={DebateCreateScreen} />
            <Stack.Screen name="ProUpgrade" component={ProUpgradeScreen} options={{ presentation: 'modal' }} />
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
        borderTopColor: colors.border, 
        backgroundColor: 'transparent',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: 60,
    },
    fabWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    createButtonDiamond: {
        width: 56,
        height: 56,
        borderRadius: 16,
        top: -15, 
        transform: [{ rotate: '45deg' }], 
        shadowColor: '#f472b6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-45deg' }], 
    },
    createButtonFocused: {
        shadowColor: '#8b5cf6',
        shadowOpacity: 0.6,
    }
});
