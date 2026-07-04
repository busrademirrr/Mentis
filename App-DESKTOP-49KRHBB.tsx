import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { NotificationDevTools } from './src/components/notifications/NotificationDevTools';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ui/ToastConfig';
import { GlobalErrorBoundary } from './src/components/GlobalErrorBoundary';

export default function App() {
  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider style={{ flex: 1 }}>
        <StatusBar style="light" />
        <AuthProvider>
          <PreferencesProvider>
            <NotificationProvider>
              <RootNavigator />
              <NotificationDevTools />
            </NotificationProvider>
          </PreferencesProvider>
        </AuthProvider>
        <Toast config={toastConfig} position="top" topOffset={50} visibilityTime={2500} />
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}
