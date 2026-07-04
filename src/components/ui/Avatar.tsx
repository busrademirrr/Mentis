import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { colors } from '../../theme';

interface AvatarProps {
    url?: string | null;
    name: string;
    size?: number;
    style?: any;
}

export const Avatar = ({ url, name, size = 40, style }: AvatarProps) => {
    // Generate monogram (first letter of first and last name, or just first two letters)
    const getMonogram = (n: string) => {
        if (!n) return 'M';
        const parts = n.split(' ').filter(Boolean);
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return n.substring(0, 2).toUpperCase();
    };

    const monogram = getMonogram(name);

    // Generate a consistent gradient based on the name string length/char codes to give users unique colors
    const getColors = (str: string) => {
        const charSum = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const palettes = [
            ['#1A1A1A', '#333333'], // Graphite
            ['#7C3AED', '#6D28D9'], // Primary Purple
            ['#0F172A', '#1E293B'], // Slate
            ['#9D8063', '#B89B7B'], // Earth
            ['#3730A3', '#4338CA'], // Indigo
        ];
        return palettes[charSum % palettes.length];
    };

    const gradientColors = getColors(name);

    return (
        <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
            {url ? (
                <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
            ) : (
                <LinearGradient
                    colors={gradientColors}
                    style={styles.monogramContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text variant="body" weight="bold" color="surface" style={{ fontSize: size * 0.4 }}>
                        {monogram}
                    </Text>
                </LinearGradient>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    monogramContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
