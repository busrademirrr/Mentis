import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../screens/LoadingScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    const prefix = Linking.createURL('/');
    
    const linking: LinkingOptions<any> = {
        prefixes: [prefix, 'http://localhost:8081', 'https://mentis.app'],
        config: {
            // Configure linking for both Auth and App flows to prevent crashes when deep linking
            screens: {
                AuthFlow: {
                    screens: {
                        Login: 'login',
                        Register: 'register'
                    }
                },
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
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
                {!isAuthenticated ? (
                    <Stack.Screen name="AuthFlow" component={AuthNavigator} />
                ) : (
                    <Stack.Screen name="AppFlow" component={AppNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
