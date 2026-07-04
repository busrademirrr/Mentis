import { supabase } from '../lib/supabase';

const leaderboardCache: Record<string, { timestamp: number, data: any[] }> = {};

// Types
export interface ArenaMatch {
    id: string;
    player1_id: string;
    player2_id: string;
    category: string;
    status: 'starting' | 'playing' | 'finished' | 'cancelled';
    winner_id?: string;
    player1_score: number;
    player2_score: number;
    player1?: any;
    player2?: any;
    isBotMatch?: boolean;
}

export interface ArenaQuestion {
    id: string;
    category: string;
    question: string;
    options: string[];
    correct_answer: number;
    difficulty: string;
}

export const arenaService = {
    async getCurrentUserId() {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    },

    async joinQueue(category: string): Promise<{ match: any, matched_with: string, bot_details?: any } | null> {
        const userId = await this.getCurrentUserId();
        if (!userId) throw new Error("Not authenticated");

        try {
            // Call the matchmaking edge function
            // This function handles queue insertion, ELO expansion, and Bot fallback
            const { data, error } = await supabase.functions.invoke('arena-matchmaking', {
                body: { category, user_id: userId }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            if (data.matched_with === 'user' && data.match) {
                import('./notificationService').then(m => {
                    const opponentId = data.match.player1_id === userId ? data.match.player2_id : data.match.player1_id;
                    if (opponentId) {
                        m.createNotification(
                            opponentId,
                            userId,
                            'arena_match_found',
                            'Yeni Düello!',
                            `${category} kategorisinde seninle eşleşti.`,
                            data.match.id
                        );
                    }
                });
            }

            return data;
        } catch (error) {
            console.error('Error joining queue:', error);
            throw error;
        }
    },

    async leaveQueue() {
        const userId = await this.getCurrentUserId();
        if (!userId) return;

        try {
            await supabase
                .from('arena_queue')
                .delete()
                .eq('user_id', userId);
        } catch (error) {
            console.error('Error leaving queue:', error);
        }
    },

    async getMatchDetails(matchId: string): Promise<ArenaMatch | null> {
        try {
            const { data: match, error: matchError } = await supabase
                .from('arena_matches')
                .select('*')
                .eq('id', matchId)
                .single();

            if (matchError || !match) throw matchError;

            // Fetch player 1 (Always a real user)
            const { data: p1, error: p1Error } = await supabase
                .from('users')
                .select('id, username, full_name, avatar_url, arena_elo, arena_league')
                .eq('id', match.player1_id)
                .single();

            let player2Data = null;
            let isBot = false;

            // Check if player2 is a bot or real user
            // We can determine this by checking if the ID exists in users table first
            const { data: p2User } = await supabase
                .from('users')
                .select('id, username, full_name, avatar_url, arena_elo, arena_league')
                .eq('id', match.player2_id)
                .single();

            if (p2User) {
                player2Data = p2User;
            } else {
                // Must be a bot
                const { data: bot } = await supabase
                    .from('arena_bots')
                    .select('*')
                    .eq('id', match.player2_id)
                    .single();
                
                if (bot) {
                    const randomBotId = Math.floor(Math.random() * 999) + 1;
                    player2Data = {
                        id: bot.id,
                        username: `Mentis Rakip #${randomBotId}`,
                        full_name: `Mentis Rakip #${randomBotId}`,
                        avatar_url: bot.avatar_url,
                        arena_elo: bot.elo,
                        arena_league: 'Arena Bot'
                    };
                    isBot = true;
                }
            }

            return {
                ...match,
                player1: p1,
                player2: player2Data,
                isBotMatch: isBot
            } as ArenaMatch;
        } catch (error) {
            console.error('Error getting match details:', error);
            return null;
        }
    },

    async forfeitMatch(matchId: string) {
        const userId = await this.getCurrentUserId();
        if (!userId) return;

        try {
            const match = await this.getMatchDetails(matchId);
            if (!match) return;
            
            const opponentId = match.player1_id === userId ? match.player2_id : match.player1_id;

            await supabase
                .from('arena_matches')
                .update({ 
                    status: 'cancelled', 
                    winner_id: opponentId 
                })
                .eq('id', matchId);
        } catch (error) {
            console.error('Error forfeiting match:', error);
        }
    },

    async submitAnswer(
        matchId: string, 
        questionId: string, 
        answerIndex: number, 
        isCorrect: boolean, 
        timeTakenMs: number, 
        pointsEarned: number
    ) {
        const userId = await this.getCurrentUserId();
        if (!userId) return;

        try {
            await supabase
                .from('arena_answers')
                .insert({
                    match_id: matchId,
                    user_id: userId,
                    question_id: questionId,
                    answer: answerIndex,
                    answer_time_ms: timeTakenMs,
                    points: pointsEarned
                });
            
            // Fetch current match to update score safely
            const { data: match } = await supabase.from('arena_matches').select('player1_id, player1_score, player2_score').eq('id', matchId).single();
            if (match) {
                const isPlayer1 = match.player1_id === userId;
                if (isPlayer1) {
                    await supabase.from('arena_matches').update({ player1_score: match.player1_score + pointsEarned }).eq('id', matchId);
                } else {
                    await supabase.from('arena_matches').update({ player2_score: match.player2_score + pointsEarned }).eq('id', matchId);
                }
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
    },

    async finishMatch(matchId: string, myScore: number, oppScore: number) {
        const userId = await this.getCurrentUserId();
        if (!userId) return;

        try {
            const match = await this.getMatchDetails(matchId);
            if (!match) return;

            let winnerId = null;
            
            // Tie breaker logic
            if (myScore > oppScore) {
                winnerId = userId;
            } else if (oppScore > myScore) {
                winnerId = match.player1_id === userId ? match.player2_id : match.player1_id;
            } else {
                // Tie breaker #1: Fastest average answer time (from arena_answers)
                const { data: p1Answers } = await supabase.from('arena_answers').select('answer_time_ms, points').eq('match_id', matchId).eq('user_id', match.player1_id);
                const { data: p2Answers } = await supabase.from('arena_answers').select('answer_time_ms, points').eq('match_id', matchId).eq('user_id', match.player2_id);
                
                const p1Stats = {
                    correct: p1Answers?.filter(a => a.points >= 100).length || 0,
                    avgTime: p1Answers?.length ? p1Answers.reduce((sum, a) => sum + a.answer_time_ms, 0) / p1Answers.length : 10000,
                    totalScore: p1Answers?.reduce((sum, a) => sum + a.points, 0) || 0
                };
                
                const p2Stats = {
                    correct: p2Answers?.filter(a => a.points >= 100).length || 0,
                    avgTime: p2Answers?.length ? p2Answers.reduce((sum, a) => sum + a.answer_time_ms, 0) / p2Answers.length : 10000,
                    totalScore: p2Answers?.reduce((sum, a) => sum + a.points, 0) || 0
                };

                // Re-evaluate based on strict rules:
                // Primary: Most correct answers
                if (p1Stats.correct > p2Stats.correct) winnerId = match.player1_id;
                else if (p2Stats.correct > p1Stats.correct) winnerId = match.player2_id;
                else {
                    // Tie breaker #1: Fastest average answer time
                    if (p1Stats.avgTime < p2Stats.avgTime) winnerId = match.player1_id;
                    else if (p2Stats.avgTime < p1Stats.avgTime) winnerId = match.player2_id;
                    else {
                        // Tie breaker #2: Highest total score
                        if (p1Stats.totalScore > p2Stats.totalScore) winnerId = match.player1_id;
                        else if (p2Stats.totalScore > p1Stats.totalScore) winnerId = match.player2_id;
                        else winnerId = null; // Absolute tie
                    }
                }
            }

            await supabase
                .from('arena_matches')
                .update({ 
                    status: 'finished', 
                    winner_id: winnerId
                })
                .eq('id', matchId)
                .neq('status', 'finished');
                
            // Add the actual match score (myScore) to the total score (arena_elo)
            const { data: myProfile, error: profileError } = await supabase.from('users').select('arena_elo').eq('id', userId).single();
            
            if (profileError) {
                console.error('Error fetching profile for ELO update:', profileError);
            }
            
            if (myProfile) {
                const currentElo = myProfile.arena_elo || 1200;
                const eloChange = myScore; // The user wants their match score points to be added to their total score points
                
                // Use RPC to bypass RLS restrictions on the users table
                const { error: rpcError } = await supabase.rpc('update_arena_elo', {
                    p_user_id: userId,
                    p_elo_change: eloChange
                });
                
                if (rpcError) {
                    console.error('Error updating ELO via RPC:', rpcError);
                    
                    // Fallback to direct update if RPC doesn't exist yet
                    let newElo = currentElo + eloChange;
                    const { error: updateError } = await supabase.from('users').update({ arena_elo: newElo }).eq('id', userId);
                    if (updateError) console.error('Fallback direct ELO update failed:', updateError);
                } else {
                    console.log(`[arenaService] Successfully updated ELO via RPC with +${eloChange}`);
                }
            }
            
        } catch (error) {
            console.error('Error finishing match:', error);
        }
    },

    async fetchArenaQuestions(category: string, limit: number = 10): Promise<ArenaQuestion[]> {
        let dbCategory = category;
        if (category.includes('Tarih')) dbCategory = 'Tarih';
        else if (category.includes('Felsefe')) dbCategory = 'Felsefe';
        else if (category.includes('Edebiyat')) dbCategory = 'Edebiyat';
        else if (category.includes('Sanat')) dbCategory = 'Sanat';
        else if (category.includes('Bilim')) dbCategory = 'Bilim';

        console.log(`[arenaService] Fetching questions for category: ${category} (Normalized to: ${dbCategory}), limit: ${limit}`);

        try {
            // Create a timeout promise (3 seconds max for Supabase)
            const timeoutPromise = new Promise<{data: any, error: any}>((_, reject) => 
                setTimeout(() => reject(new Error('Supabase query timed out after 3 seconds')), 3000)
            );

            // Fetch exactly 10 random questions for the category
            const fetchPromise = supabase
                .from('arena_questions')
                .select('*')
                .eq('category', dbCategory)
                .limit(limit);

            // Race them!
            const result = await Promise.race([fetchPromise, timeoutPromise]) as { data: any, error: any };
            
            if (result.error) {
                console.error('[arenaService] Error fetching questions:', result.error);
                throw result.error;
            }

            console.log(`[arenaService] Fetched ${result.data?.length || 0} questions from DB.`);

            const mappedData = (result.data && result.data.length > 0 ? result.data : []).map((q: any) => ({
                id: q.id,
                category: q.category,
                question: q.question_text || q.question, 
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                correct_answer: q.correct_option !== undefined ? q.correct_option : q.correct_answer,
                difficulty: q.difficulty
            }));

            if (mappedData.length < limit) {
                console.warn(`[arenaService] Found only ${mappedData.length} questions in DB for ${category}. Need ${limit}.`);
                // Do not inject fake questions anymore! Return what we have or empty.
            }

            return mappedData as ArenaQuestion[];
        } catch (error) {
            console.error('[arenaService] Fatal error or timeout in fetchArenaQuestions:', error);
            // On timeout or error, return empty so QuizView can show "Kategori soruları yüklenemedi"
            return [];
        }
    },

    getKnowledgeRank(wins: number): string {
        if (wins < 5) return 'Beginner';
        if (wins < 15) return 'Researcher';
        if (wins < 30) return 'Scholar';
        if (wins < 60) return 'Expert';
        if (wins < 100) return 'Master';
        return 'Grandmaster';
    },

    async getUserArenaStats(userId: string) {
        try {
            const { data: matches } = await supabase
                .from('arena_matches')
                .select('id, winner_id')
                .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
                .eq('status', 'finished');

            const totalDuels = matches?.length || 0;
            const duelsWon = matches?.filter(m => m.winner_id === userId).length || 0;

            const { data: answers } = await supabase
                .from('arena_answers')
                .select('points')
                .eq('user_id', userId);

            const totalAnswers = answers?.length || 0;
            const correctAnswers = answers?.filter(a => a.points > 0).length || 0;
            const correctRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

            return { totalDuels, duelsWon, correctRate };
        } catch (err) {
            console.error('Error fetching user arena stats:', err);
            return { totalDuels: 0, duelsWon: 0, correctRate: null };
        }
    },

    async getArenaLeaderboard(timeframe: 'all-time' | 'weekly', category: string | null = null) {
        const cacheKey = `leaderboard_${timeframe}_${category || 'all'}`;
        const cached = leaderboardCache[cacheKey];
        if (cached && Date.now() - cached.timestamp < 60000) {
            return cached.data;
        }

        try {
            const { data, error } = await supabase.rpc('get_arena_leaderboard', {
                timeframe,
                p_category: category
            });

            if (error) throw error;

            leaderboardCache[cacheKey] = {
                timestamp: Date.now(),
                data: data || []
            };

            return data || [];
        } catch (err) {
            console.error('Error fetching arena leaderboard:', err);
            return [];
        }
    }
};
