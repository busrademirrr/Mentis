import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Animated, Platform, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { Text } from './Text';

interface BottomSheetAction {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
    destructive?: boolean;
}

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    actions: BottomSheetAction[];
}

const { height } = Dimensions.get('window');

export const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, actions }) => {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    if (!visible && slideAnim.addListener === undefined) return null; // React Native Web fallback

    // Web fallback for simple popover style if prefered, but we will use the unified style
    const isWeb = Platform.OS === 'web';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlayContainer}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>
                
                <Animated.View 
                    style={[
                        styles.sheetContainer,
                        { transform: [{ translateY: slideAnim }] },
                        isWeb && styles.webSheetContainer
                    ]}
                >
                    <View style={styles.handleIndicator} />
                    
                    <View style={styles.content}>
                        {actions.map((action, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[
                                    styles.actionButton, 
                                    index < actions.length - 1 && styles.actionDivider
                                ]}
                                onPress={() => {
                                    onClose();
                                    setTimeout(() => action.onPress(), 300); // Wait for animation
                                }}
                            >
                                {action.icon && (
                                    <View style={styles.iconContainer}>{action.icon}</View>
                                )}
                                <Text 
                                    variant="body" 
                                    weight="bold" 
                                    color={action.destructive ? 'error' : 'textPrimary'}
                                >
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <View style={styles.cancelContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text variant="body" weight="bold" color="textSecondary">İptal</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sheetContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        paddingTop: spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    webSheetContainer: {
        maxWidth: 400,
        alignSelf: 'center',
        borderBottomLeftRadius: radius.xl,
        borderBottomRightRadius: radius.xl,
        marginBottom: spacing.xl,
    },
    handleIndicator: {
        width: 40,
        height: 5,
        backgroundColor: colors.borderHighlight,
        borderRadius: radius.pill,
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    content: {
        paddingHorizontal: spacing.lg,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    actionDivider: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderHighlight,
    },
    iconContainer: {
        marginRight: spacing.md,
        width: 24,
        alignItems: 'center',
    },
    cancelContainer: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.sm,
    },
    cancelButton: {
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderHighlight,
    }
});
