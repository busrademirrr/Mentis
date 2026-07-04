import React from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';

export class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('GLOBAL ERROR:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 50 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.error, marginBottom: 10 }}>Uygulama Çöktü!</Text>
                    <Text style={{ fontSize: 16, color: colors.textPrimary, marginBottom: 20 }}>Lütfen aşağıdaki hata mesajını kopyalayıp asistana gönderin:</Text>
                    <ScrollView style={{ flex: 1, backgroundColor: colors.surface, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: colors.error, fontWeight: 'bold' }}>
                            {this.state.error?.toString()}
                        </Text>
                        <Text style={{ fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: colors.textSecondary, marginTop: 10 }}>
                            {this.state.error?.stack}
                        </Text>
                    </ScrollView>
                </View>
            );
        }
        return this.props.children;
    }
}
