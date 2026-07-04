import { supabase } from '../lib/supabase';

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    last_message_id?: string;
    created_at: string;
    updated_at: string;
    participants: any[];
    last_message?: any;
    unread_count?: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: 'text' | 'image' | 'system';
    created_at: string;
    sender?: any;
}

export const getConversations = async (): Promise<Conversation[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Fetch conversations where user is a member
        const { data: members, error: membersError } = await supabase
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', user.id);

        if (membersError || !members.length) return [];

        const conversationIds = members.map(m => m.conversation_id);

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                last_message:messages!conversations_last_message_id_fkey(*),
                participants:conversation_members(*, user:users(id, name, avatar, username, online_status))
            `)
            .in('id', conversationIds)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('getConversations error:', error);
        return [];
    }
};

export const getOrCreateDirectConversation = async (otherUserId: string): Promise<string | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Check if direct conversation already exists between these two users
        // This is a simplified check. A proper RPC or edge function is better.
        const { data: myMembers } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', user.id);
        const { data: otherMembers } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', otherUserId);
        
        if (myMembers && otherMembers) {
            const myIds = myMembers.map(m => m.conversation_id);
            const commonId = otherMembers.find(m => myIds.includes(m.conversation_id))?.conversation_id;
            
            if (commonId) return commonId;
        }

        // Create new
        const { data: conv, error: convError } = await supabase
            .from('conversations')
            .insert([{ type: 'direct' }])
            .select()
            .single();

        if (convError || !conv) return null;

        await supabase.from('conversation_members').insert([
            { conversation_id: conv.id, user_id: user.id },
            { conversation_id: conv.id, user_id: otherUserId }
        ]);

        return conv.id;
    } catch (error) {
        console.error('getOrCreateDirectConversation error:', error);
        return null;
    }
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:users(id, name, avatar)')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('getMessages error:', error);
        return [];
    }
};

export const sendMessage = async (conversationId: string, content: string): Promise<Message | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: conversationId,
                sender_id: user.id,
                content
            }])
            .select('*, sender:users(id, name, avatar)')
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('sendMessage error:', error);
        return null;
    }
};

export const subscribeToMessages = (conversationId: string, onNewMessage: (msg: Message) => void) => {
    const channel = supabase.channel(`conversation:${conversationId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
        }, async (payload) => {
            // Fetch sender info for the new message
            const { data: senderData } = await supabase.from('users').select('id, name, avatar').eq('id', payload.new.sender_id).single();
            const fullMessage = { ...payload.new, sender: senderData } as Message;
            onNewMessage(fullMessage);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
