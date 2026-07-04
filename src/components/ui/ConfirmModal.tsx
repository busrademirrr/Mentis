import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    isDestructive = false,
    onConfirm,
    onCancel
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableWithoutFeedback onPress={onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalContent}>
                            <Text variant="h2" weight="bold" color="textPrimary" style={styles.title}>
                                {title}
                            </Text>
                            <Text variant="body" color="textSecondary" style={styles.message}>
                                {message}
                            </Text>
                            <View style={styles.buttonRow}>
                                <View style={{ flex: 1, marginRight: spacing.sm }}>
                                    <Button 
                                        title={cancelText} 
                                        variant="outline" 
                                        onPress={onCancel} 
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                    <Button 
                                        title={confirmText} 
                                        variant={isDestructive ? 'danger' : 'primary'} 
                                        onPress={onConfirm}
                                    />
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        ...(Platform.OS === 'web' && { backdropFilter: 'blur(4px)' } as any),
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: colors.borderHighlight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        marginBottom: spacing.sm,
        fontSize: 20,
    },
    message: {
        marginBottom: spacing.xl,
        lineHeight: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    }
});
