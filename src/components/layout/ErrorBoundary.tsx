import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from '../ui';
import { colors, spacing, radius } from '../../theme';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Icon name="alert-triangle" size={48} color={colors.error} />
                    <Text variant="h2" weight="bold" style={styles.title}>
                        Beklenmeyen Bir Hata Oluştu
                    </Text>
                    <Text variant="body" color="textSecondary" style={styles.description}>
                        Bunu en kısa sürede düzelteceğiz. Lütfen sayfayı yenilemeyi deneyin.
                    </Text>
                    {this.state.error && (
                        <View style={styles.errorBox}>
                            <Text variant="caption" color="error">
                                {this.state.error.toString()}
                            </Text>
                        </View>
                    )}
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
        backgroundColor: colors.background,
    },
    title: {
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    description: {
        textAlign: 'center',
        marginBottom: spacing.xl,
        maxWidth: 400,
    },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: spacing.md,
        borderRadius: radius.md,
        maxWidth: 600,
    }
});
