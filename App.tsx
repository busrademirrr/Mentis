import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ui/ToastConfig';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
      <Toast config={toastConfig} position="top" topOffset={50} visibilityTime={2500} />
    </SafeAreaProvider>
  );
}
