import { supabase } from '../lib/supabase';

export interface ChatPartner {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    last_active_at: string | null;
}

export interface ChatListItem {
    id: string;
    last_message_at: string;
    conversation_type: string;
    partner: ChatPartner;
    last_message: {
        content: string;
        message_type: string;
        is_deleted: boolean;
        sender_id: string;
        created_at: string;
    } | null;
    unread_count: number;
}

export interface MentisMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: 'text' | 'image' | 'knowledge_card' | 'arena' | 'system';
    metadata: any;
    created_at: string;
    edited_at: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
}

export const messagingService = {
    /**
     * Get the active chat list for the user with unread counts
     */
    async getChatList(): Promise<ChatListItem[]> {
        const { data, error } = await supabase.rpc('get_chat_list');
        if (error) {
            console.error('Error fetching chat list:', error);
            throw error;
        }
        return data as ChatListItem[] || [];
    },

    /**
     * Start or get an existing direct conversation with another user
     */
    async getOrCreateDirectConversation(otherUserId: string): Promise<string> {
        const { data, error } = await supabase.rpc('get_or_create_conversation', { p_other_user_id: otherUserId });
        if (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
        return data as string;
    },

    /**
     * Fetch paginated messages for a conversation
     */
    async getMessages(conversationId: string, limit = 50, offset = 0): Promise<MentisMessage[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false }) // Get newest first
            .range(offset, offset + limit - 1);
            
        if (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
        return data as MentisMessage[];
    },

    /**
     * Send a new message
     */
    async sendMessage(conversationId: string, senderId: string, content: string, type: string = 'text', metadata: any = {}): Promise<MentisMessage | null> {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content: content,
                message_type: type,
                metadata: metadata
            })
            .select('*')
            .single();

        if (error) {
            console.error('Error sending message:', error);
            throw error;
        }
        return data as MentisMessage;
    },

    /**
     * Soft delete a message
     */
    async deleteMessage(messageId: string): Promise<boolean> {
        const { error } = await supabase
            .from('messages')
            .update({ 
                is_deleted: true, 
                content: '[deleted]', 
                deleted_at: new Date().toISOString() 
            })
            .eq('id', messageId);

        if (error) {
            console.error('Error deleting message:', error);
            return false;
        }
        return true;
    },

    /**
     * Mark a message as read
     */
    async markAsRead(messageId: string, userId: string): Promise<boolean> {
        const { error } = await supabase
            .from('message_reads')
            .upsert({ message_id: messageId, user_id: userId, read_at: new Date().toISOString() }, { onConflict: 'message_id, user_id' });

        if (error) {
            console.error('Error marking as read:', error);
            return false;
        }
        return true;
    },
    
    /**
     * Get read receipts for a set of messages
     */
    async getReadReceipts(messageIds: string[]): Promise<any[]> {
        if (!messageIds || messageIds.length === 0) return [];
        const { data, error } = await supabase
            .from('message_reads')
            .select('message_id, user_id, read_at')
            .in('message_id', messageIds);
            
        if (error) {
            console.error('Error fetching read receipts:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Send typing indicator via Supabase Broadcast
     */
    async sendTypingEvent(conversationId: string, userId: string, isTyping: boolean) {
        const channel = supabase.channel(`typing_${conversationId}_${Date.now()}`);
        await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: userId, is_typing: isTyping }
        });
    },

    /**
     * Upload an image to Supabase Storage using base64 (works perfectly on both Web and Mobile)
     */
    async uploadImage(base64Data: string, userId: string, extension: string = 'jpg'): Promise<string | null> {
        try {
            const fileName = `${userId}_${new Date().getTime()}.${extension}`;
            const filePath = `${fileName}`;
            
            // Need to import decode from base64-arraybuffer at the top of the file
            // but for simplicity we can just use Buffer or the native supabase base64 decode if available
            // Supabase supports base64 string directly if we specify contentType and decode:
            
            const { data, error } = await supabase.storage
                .from('chat_images')
                .upload(filePath, decodeURIComponent(escape(atob(base64Data))), {
                    contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
                    upsert: false
                });

            if (error) {
                // If it fails, let's try the arraybuffer approach
                const { decode } = require('base64-arraybuffer');
                const { data: d2, error: e2 } = await supabase.storage
                    .from('chat_images')
                    .upload(filePath, decode(base64Data), {
                        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
                        upsert: false
                    });
                
                if (e2) {
                    console.error('Error uploading image:', e2);
                    return null;
                }
            }

            const { data: publicUrlData } = supabase.storage
                .from('chat_images')
                .getPublicUrl(filePath);

            return publicUrlData.publicUrl;
        } catch (err) {
            console.error('Error in uploadImage:', err);
            return null;
        }
    }
};
