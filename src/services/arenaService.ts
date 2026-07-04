import { supabase } from '../lib/supabase';
import { ArenaMatch, ArenaQuestion, MatchAnswer, User } from '../types/database.types';

// Using the mock user for now
export const CURRENT_USER_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Finds or creates a match using the atomic RPC function
 */
export const findOrCreateMatch = async (category: string): Promise<string | null> => {
    try {
        const { data: matchId, error } = await supabase.rpc('matchmake_user', {
            p_user_id: CURRENT_USER_ID,
            p_category: category
        });

        if (error) throw error;
        
        // If matchId is returned, we found an opponent and a match was created
        // If null, we were added to the queue
        return matchId as string | null;
    } catch (error) {
        console.error('Error in findOrCreateMatch:', error);
        return null;
    }
};

/**
 * Removes the user from the matchmaking queue
 */
export const leaveQueue = async () => {
    try {
        await supabase
            .from('match_queue')
            .delete()
            .eq('user_id', CURRENT_USER_ID);
    } catch (error) {
        console.error('Error leaving queue:', error);
    }
};

/**
 * Gets the match details including player profiles
 */
export const getMatchDetails = async (matchId: string): Promise<ArenaMatch | null> => {
    try {
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (matchError || !match) throw matchError;

        // Fetch user profiles for player1 and player2
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, full_name, avatar_type, avatar_value, level')
            .in('id', [match.player1_id, match.player2_id]);

        if (usersError || !users) throw usersError;

        const player1 = users.find(u => u.id === match.player1_id);
        const player2 = users.find(u => u.id === match.player2_id);

        return {
            ...match,
            player1: player1 as User,
            player2: player2 as User
        } as ArenaMatch;
    } catch (error) {
        console.error('Error getting match details:', error);
        return null;
    }
};

export const forfeitMatch = async (matchId: string) => {
    try {
        // Determine opponent
        const match = await getMatchDetails(matchId);
        if (!match) return;
        
        const opponentId = match.player1_id === CURRENT_USER_ID ? match.player2_id : match.player1_id;

        await supabase
            .from('matches')
            .update({ 
                status: 'forfeit', 
                finished_at: new Date().toISOString(),
                winner_id: opponentId // The other person wins by default
            })
            .eq('id', matchId);
    } catch (error) {
        console.error('Error forfeiting match:', error);
    }
};

export const submitAnswer = async (
    matchId: string, 
    questionId: string, 
    answer: number, 
    isCorrect: boolean, 
    timeTaken: number, 
    pointsEarned: number
) => {
    try {
        await supabase
            .from('match_answers')
            .insert({
                match_id: matchId,
                user_id: CURRENT_USER_ID,
                question_id: questionId,
                answer: answer,
                is_correct: isCorrect,
                time_taken: timeTaken,
                points_earned: pointsEarned
            });
            
        // Update the match score
        const { data: match } = await supabase.from('matches').select('player1_id').eq('id', matchId).single();
        if (match) {
            const isPlayer1 = match.player1_id === CURRENT_USER_ID;
            
            // This is a basic update; in a fully concurrent system, this might also be an RPC
            if (isPlayer1) {
                // Actually, due to RLS, it's safer to just let the client update their own score or compute it on finish.
                // We'll update it for simple tracking.
                await supabase.rpc('increment_match_score', { p_match_id: matchId, p_is_player1: true, p_points: pointsEarned });
            } else {
                await supabase.rpc('increment_match_score', { p_match_id: matchId, p_is_player1: false, p_points: pointsEarned });
            }
        }
    } catch (error) {
        console.error('Error submitting answer:', error);
    }
};

export const finishMatch = async (matchId: string, myScore: number, oppScore: number) => {
    try {
        const match = await getMatchDetails(matchId);
        if (!match) return;

        let winnerId = null;
        if (myScore > oppScore) winnerId = CURRENT_USER_ID;
        else if (oppScore > myScore) winnerId = match.player1_id === CURRENT_USER_ID ? match.player2_id : match.player1_id;

        // Ensure we only mark finished once (first one to reach the end marks it)
        await supabase
            .from('matches')
            .update({ 
                status: 'finished', 
                finished_at: new Date().toISOString(),
                winner_id: winnerId
            })
            .eq('id', matchId)
            .neq('status', 'finished');
            
    } catch (error) {
        console.error('Error finishing match:', error);
    }
};

export const fetchArenaQuestions = async (category: string, limit: number = 5): Promise<ArenaQuestion[]> => {
    try {
        const { data, error } = await supabase
            .from('arena_questions')
            .select('*')
            .eq('category', category)
            .limit(limit);

        if (error) throw error;
        return data as ArenaQuestion[];
    } catch (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
};
