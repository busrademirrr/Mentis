import React from 'react';
import { View, StyleSheet } from 'react-native';
import Toast, { BaseToastProps, ToastConfig } from 'react-native-toast-message';
import { colors, radius, spacing } from '../../theme';
import { Text, Icon } from '../ui';

const BaseToast = ({ text1, text2, type, icon }: { text1?: string, text2?: string, type: 'success' | 'error' | 'info', icon: string }) => {
    const bgColor = type === 'error' ? colors.error : (type === 'success' ? colors.success : colors.surface);
    const textColor = type === 'info' ? colors.textPrimary : colors.surface;
    
    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={styles.iconWrap}>
                <Icon name={icon as any} size={20} color={textColor} />
            </View>
            <View style={styles.textWrap}>
                <Text variant="label" weight="bold" color={type === 'info' ? 'textPrimary' : 'surface'}>
                    {text1}
                </Text>
                {text2 ? (
                    <Text variant="caption" color={type === 'info' ? 'textSecondary' : 'surface'} style={{ opacity: 0.9 }}>
                        {text2}
                    </Text>
                ) : null}
            </View>
        </View>
    );
};

export const toastConfig: ToastConfig = {
    success: (props: BaseToastProps) => (
        <BaseToast text1={props.text1} text2={props.text2} type="success" icon="check-circle" />
    ),
    error: (props: BaseToastProps) => (
        <BaseToast text1={props.text1} text2={props.text2} type="error" icon="alert-circle" />
    ),
    info: (props: BaseToastProps) => (
        <BaseToast text1={props.text1} text2={props.text2} type="info" icon="info" />
    ),
};

const styles = StyleSheet.create({
    container: {
        width: '90%',
        maxWidth: 400,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconWrap: {
        marginRight: spacing.md,
    },
    textWrap: {
        flex: 1,
    }
});
