import { supabase } from '../lib/supabase';
import { Post, DebateVote, RoomMember, DebateMessage } from '../types/database.types';

export const debateService = {
  /**
   * Get the hero debate (featured or most active).
   */
  async getHeroDebate(): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(*), likes:post_interactions(count)')
      .eq('type', 'debate')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching hero debate:', error);
      return null;
    }
    return data;
  },

  /**
   * Get trending debates.
   */
  async getTrendingDebates(limit: number = 5): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users(*), likes:post_interactions(count)')
      .eq('type', 'debate')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending debates:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Get joined rooms for a specific user.
   */
  async getJoinedRooms(userId: string): Promise<RoomMember[]> {
    const { data, error } = await supabase
      .from('room_members')
      .select('*, room:posts(*)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching joined rooms:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Get weekly leaderboard (sampleing for now, adjust based on your query).
   */
  async getLeaderboard(): Promise<any[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, avatar_value, avatar_type, xp')
      .order('xp', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Join a debate room.
   */
  async joinRoom(roomId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('room_members')
      .upsert({ room_id: roomId, user_id: userId });

    if (error) {
      console.error('Error joining room:', error);
      return false;
    }
    return true;
  },

  /**
   * Get messages for a debate room.
   */
  async getMessages(debateId: string): Promise<DebateMessage[]> {
    const { data, error } = await supabase
      .from('debate_messages')
      .select('*, user:users(*)')
      .eq('debate_id', debateId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Send a message to a debate room.
   */
  async sendMessage(debateId: string, userId: string, message: string): Promise<boolean> {
    const { error } = await supabase
      .from('debate_messages')
      .insert({ debate_id: debateId, user_id: userId, message });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }
    return true;
  },

  /**
   * Subscribe to new messages.
   */
  subscribeToMessages(debateId: string, callback: (message: DebateMessage) => void) {
    return supabase
      .channel(`debate_messages:${debateId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'debate_messages',
          filter: `debate_id=eq.${debateId}`,
        },
        async (payload) => {
          // Fetch user details for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.new.user_id)
            .single();
            
          const enrichedMessage = {
             ...payload.new,
             user: userData
          } as DebateMessage;
            
          callback(enrichedMessage);
        }
      )
      .subscribe();
  },
  
  /**
   * Subscribe to room stats (votes, members)
   */
  subscribeToStats(debateId: string, callback: () => void) {
    return supabase
      .channel(`debate_stats:${debateId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debate_votes', filter: `post_id=eq.${debateId}` }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${debateId}` }, callback)
      .subscribe();
  }
};
