import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { colors } from '../../theme';

export interface IconProps {
    name: string; // Accepts kebab-case (legacy) or PascalCase
    size?: number;
    color?: keyof typeof colors | string;
    style?: StyleProp<ViewStyle>;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = 'textPrimary', style }) => {
    // Safely retrieve color from theme or use raw string
    const iconColor = (colors[color as keyof typeof colors] as string) || color;

    // Convert kebab-case (e.g. 'message-square') to PascalCase ('MessageSquare')
    const pascalName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    
    // @ts-ignore - dynamic access
    const LucideIcon = LucideIcons[pascalName] || LucideIcons[name] || LucideIcons.CircleHelp;

    return <LucideIcon size={size} color={iconColor} style={style} strokeWidth={1.75} />;
};
