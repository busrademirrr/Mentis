export interface LeaderboardStats {
    user_id: string;
    username: string;
    avatar_url: string | null;
    arena_wins: number;
    arena_participation: number;
    quiz_correct_answers: number;
    quiz_completions: number;
    knowledge_cards_published: number;
    discussions_published: number;
    likes_received: number;
    saves_received: number;
}

export interface ScoredUser extends LeaderboardStats {
    total_score: number;
}

/**
 * Calculates the total score for a user based on their weekly stats.
 * Centralized here so we can easily tweak the formula without backend changes.
 */
export const calculateUserScore = (stats: LeaderboardStats): number => {
    return (
        (stats.arena_wins * 10) +
        (stats.arena_participation * 2) +
        (stats.quiz_correct_answers * 2) +
        (stats.quiz_completions * 5) +
        (stats.knowledge_cards_published * 3) +
        (stats.discussions_published * 3) +
        (stats.likes_received * 1) +
        (stats.saves_received * 2)
    );
};

/**
 * Sorts an array of user stats and returns the top N users with their computed scores.
 */
export const computeLeaderboard = (users: LeaderboardStats[], limit: number = 5): ScoredUser[] => {
    return users
        .map(user => ({
            ...user,
            total_score: calculateUserScore(user)
        }))
        .filter(user => user.total_score > 0) // Only show active users
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, limit);
};
