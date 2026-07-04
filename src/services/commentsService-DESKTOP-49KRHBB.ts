import { supabase } from '../lib/supabase';

export interface CommentV4 {
    id: string;
    post_id: string;
    parent_id: string | null;
    content: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    is_hidden: boolean;
    report_count: number;
    author_id: string;
    author_username: string;
    author_avatar_url: string;
    author_full_name: string;
    likes_count: number;
    liked_by_me: boolean;
    replies_count: number;
    is_edited: boolean;
    is_deleted: boolean;
    // For local threading:
    replies?: CommentV4[];
}

export const getThreadedComments = async (postId: string, userId?: string): Promise<CommentV4[]> => {
    const { data, error } = await supabase.rpc('get_threaded_comments_v4', {
        p_post_id: postId,
        p_user_id: userId || null
    });
    if (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
    return data || [];
};

export const createComment = async (postId: string, content: string, parentId?: string, mentionedIds: string[] = []): Promise<any> => {
    const { data, error } = await supabase.rpc('create_comment_v4', {
        p_post_id: postId,
        p_content: content,
        p_parent_id: parentId || null,
        p_mentioned_user_ids: mentionedIds
    });
    if (error) throw error;
    return data;
};

export const toggleCommentLike = async (commentId: string): Promise<number> => {
    const { data, error } = await supabase.rpc('toggle_comment_like_v4', {
        p_comment_id: commentId
    });
    if (error) throw error;
    return data;
};

export const editComment = async (commentId: string, content: string): Promise<any> => {
    const { data, error } = await supabase.rpc('edit_comment_v4', {
        p_comment_id: commentId,
        p_content: content
    });
    if (error) throw error;
    return data;
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('delete_comment_v4', {
        p_comment_id: commentId
    });
    if (error) throw error;
    return data;
};
