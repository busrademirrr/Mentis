export type PostType = 'hero' | 'quiz' | 'article' | 'discussion' | 'challenge' | 'premium_lock';

export interface User {
    id: string;
    username: string;
    full_name: string | null;
    avatar_type: 'preset' | 'upload';
    avatar_value: string;
    bio: string | null;
    level: number;
    xp: number;
    league: string | null;
    is_premium: boolean;
    created_at?: string;
}

export interface Post {
    id: string;
    type: PostType;
    title: string | null;
    content: string | null;
    short_description: string | null;
    category: string | null;
    image_url: string | null;
    is_premium: boolean;
    is_featured: boolean;
    created_at: string;
    author_id: string | null;
    
    // JSON Payload for specific data (quiz options, debate sides, etc)
    payload: {
        xp_reward?: number;
        questions?: string[];
        options?: string[];
        correct_option?: number;
        side_a?: string;
        side_b?: string;
        info_box_text?: string;
        [key: string]: any;
    };
    
    // Supabase Joined Relations
    author?: User;
    likes?: { count: number }[] | number; 
    comments?: { count: number }[] | number;
    
    // Mapped on the client
    user_has_liked?: boolean;
    user_has_saved?: boolean;
    user_quiz_answer?: any;
    user_debate_vote?: any;
}

export interface Like {
    id: string;
    user_id: string;
    post_id: string;
    created_at: string;
}

export interface SavedPost {
    id: string;
    user_id: string;
    post_id: string;
    created_at: string;
}

export interface Comment {
    id: string;
    user_id: string;
    post_id: string;
    content: string;
    created_at: string;
    user?: User;
}

export interface QuizAnswer {
    id: string;
    user_id: string;
    quiz_id: string;
    selected_answer: number;
    is_correct: boolean;
    created_at: string;
}

export interface DebateVote {
    id: string;
    user_id: string;
    debate_id: string;
    selected_option: 'A' | 'B';
    created_at: string;
}

export interface RoomMember {
    id: string;
    room_id: string;
    user_id: string;
    joined_at: string;
    user?: User;
}

export interface DebateMessage {
    id: string;
    debate_id: string;
    user_id: string;
    message: string;
    upvotes: number;
    created_at: string;
    user?: User;
}


export interface ArenaQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
    category: string;
    difficulty: number;
}

export interface ArenaMatch {
    id: string;
    player1_id: string;
    player2_id: string | null;
    status: 'waiting' | 'matched' | 'playing' | 'finished' | 'cancelled' | 'forfeit';
    category: string;
    current_question_index: number;
    player1_score: number;
    player2_score: number;
    winner_id: string | null;
    started_at: string | null;
    finished_at: string | null;
    
    // Mapped on client
    player1?: User;
    player2?: User;
}

export interface MatchAnswer {
    id: string;
    match_id: string;
    user_id: string;
    question_id: string;
    answer: number;
    is_correct: boolean;
    time_taken: number;
    points_earned: number;
}

export interface MatchQueue {
    user_id: string;
    category: string;
    status: 'waiting' | 'matched';
    matched_with: string | null;
    created_at: string;
}

// PROFILE SYSTEM TYPES
export interface UserStats {
    user_id: string;
    followers_count: number;
    following_count: number;
    argument_votes: number;
    arena_wins: number;
    duel_wins: number;
    quiz_count: number;
    content_count: number;
}

export interface UserSocial {
    id: string;
    user_id: string;
    platform: string;
    url: string;
    created_at?: string;
}

export interface UserActivity {
    id: string;
    user_id: string;
    type: 'post' | 'save' | 'debate_win' | 'arena_win' | 'badge_earn' | 'quiz_completion' | 'level_up' | 'streak';
    entity_id: string;
    entity_type?: string;
    action?: string;
    metadata: Record<string, any>;
    created_at: string;
}

export interface UserReputation {
    user_id: string;
    knowledge_score: number;
    debate_score: number;
    trust_score: number;
    influence_score: number;
    reading_score: number;
    updated_at: string;
}

export interface UserCognitiveTrait {
    user_id: string;
    trait_key: string;
    score: number;
    updated_at: string;
}

export interface SavedContent {
    id: string;
    user_id: string;
    content_id: string;
    type: 'post' | 'quiz' | 'debate';
    created_at: string;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    condition_type: string;
    condition_value: number;
    unlock_condition?: string;
    gradient_start?: string;
    gradient_end?: string;
    xp_reward?: number;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    progress: number;
    created_at: string;
    badge?: Badge;
    is_featured?: boolean;
    unlocked_at?: string;
}

// ==========================================
// INTELLECTUAL SOCIETIES TYPES
// ==========================================

export interface Society {
    id: string;
    name: string;
    description: string;
    emblem_url?: string;
    prestige_tier: 'elite' | 'standard' | 'academic';
    created_at: string;
    
    // Virtual mapping for UI
    memberCount?: number;
    onlineCount?: number;
    activeDebatesCount?: number;
    currentDebate?: LiveDebate;
}

export interface SocietyMember {
    id: string;
    society_id: string;
    user_id: string;
    role: 'member' | 'thinker' | 'moderator';
    joined_at: string;
    
    user?: User;
    society?: Society;
}

export interface LiveDebate {
    id: string;
    society_id: string;
    title: string;
    category: string;
    thesis: string;
    heat_score: number;
    is_active: boolean;
    created_at: string;
    
    // Virtual mapping
    participantsCount?: number;
    lastMessage?: string;
    society?: Society;
}

export interface LivePresence {
    id: string;
    user_id: string;
    society_id?: string;
    debate_id?: string;
    status: 'online' | 'typing' | 'reading';
    last_seen: string;
    
    user?: User;
}
