import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface AnimatedPressableProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    scaleTo?: number;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({ 
    children, 
    style, 
    scaleTo = 0.95,
    onPressIn,
    onPressOut,
    disabled,
    ...props 
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: any) => {
        Animated.spring(scaleAnim, {
            toValue: scaleTo,
            useNativeDriver: true,
            speed: 50,
            bounciness: 10,
        }).start();
        if (onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: any) => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 10,
        }).start();
        if (onPressOut) onPressOut(e);
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            {...props}
        >
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }], opacity: disabled ? 0.5 : 1 }]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
