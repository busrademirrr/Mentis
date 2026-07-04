import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, radius } from '../../theme';
import { Text } from '../ui';
import { User } from '../../types/database.types';

interface ProfileIntelligenceScoreProps {
    user: User;
}

export const ProfileIntelligenceScore: React.FC<ProfileIntelligenceScoreProps> = ({ user }) => {
    const score = 87;
    const radiusSvg = 35;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radiusSvg;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <View style={styles.card}>
            <View style={styles.circleContainer}>
                <Svg height="80" width="80" viewBox="0 0 80 80">
                    <Circle
                        cx="40"
                        cy="40"
                        r={radiusSvg}
                        stroke="#1e293b"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <Circle
                        cx="40"
                        cy="40"
                        r={radiusSvg}
                        stroke="#10b981" // emerald green
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin="40, 40"
                    />
                </Svg>
                <View style={styles.scoreTextContainer}>
                    <Text variant="h2" weight="bold" color="surface">{score}</Text>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <Text variant="label" weight="bold" color="#38bdf8" style={styles.title}>
                    Cultural Intelligence Score
                </Text>
                <Text variant="caption" color="#cbd5e1" style={styles.desc}>
                    Kültürel zekan %92'lik dilimde. Harika bir analitik derinliğe sahipsin.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#0f172a',
        borderRadius: radius.xl,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.md,
        marginBottom: spacing.xl,
    },
    circleContainer: {
        position: 'relative',
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.lg,
    },
    scoreTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        flex: 1,
    },
    title: {
        marginBottom: spacing.xs,
    },
    desc: {
        lineHeight: 20,
    }
});
