import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { LoadingScreen } from '../screens/LoadingScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { UpdatePasswordScreen } from '../screens/auth/UpdatePasswordScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
    const { isAuthenticated, isLoading, profile, isPasswordRecovery } = useAuth();
    const { preferences } = usePreferences();

    if (isLoading) {
        return <LoadingScreen />;
    }

    const prefix = Linking.createURL('/');
    
    const linking: LinkingOptions<any> = {
        prefixes: [prefix, 'mentis://', 'http://localhost:8081', 'http://localhost:8082', 'https://mentis.app'],
        config: {
            // Configure linking for both Auth and App flows to prevent crashes when deep linking
            screens: {
                AuthFlow: {
                    screens: {
                        Login: 'login',
                        Register: 'register',
                        ForgotPassword: 'forgot-password'
                    }
                },
                UpdatePassword: 'reset-password',
                AppFlow: {
                    screens: {
                        Main: {
                            screens: {
                                Akış: 'feed',
                                Üret: 'create',
                                Arena: 'arena',
                                Profil: 'profile',
                            }
                        },
                        Saved: 'saved',
                        Settings: 'settings',
                        Activity: 'activity',
                        Badges: 'badges',
                        Notifications: 'notifications',
                        Inbox: 'inbox',
                        Chat: 'chat/:id',
                        Comments: 'comments/:id',
                        ProUpgrade: 'pro',
                    }
                }
            }
        }
    };

    return (
        <NavigationContainer linking={linking} key={preferences.theme}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
                {isPasswordRecovery ? (
                    <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
                ) : !isAuthenticated ? (
                    <Stack.Screen name="AuthFlow" component={AuthNavigator} />
                ) : profile && profile.onboarding_completed === false ? (
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                ) : (
                    <Stack.Screen name="AppFlow" component={AppNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
