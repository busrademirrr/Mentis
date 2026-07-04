import { supabase } from '../lib/supabase';
import { User, UserStats, UserSocial, UserActivity, UserBadge } from '../types/database.types';
import { toggleSave as savedServiceToggleSave } from './savedService';
import { toggleLike as feedServiceToggleLike } from './feedService';

const getUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id;
};

export const getUserProfile = async (userId?: string) => {
    try {
        const viewerId = await getUserId();
        const targetUserId = userId || viewerId;
        if (!targetUserId || !viewerId) throw new Error("No user ID provided or logged in");

        // PHASE 2: Single Source of Truth RPC (get_profile_v5)
        const { data, error } = await supabase.rpc('get_profile_v5', {
            p_target_user_id: targetUserId,
            p_viewer_user_id: viewerId
        });

        if (error) {
            console.error('get_profile_v5 RPC Error:', error);
            throw error;
        }

        if (!data) return null;

        // Fetch overrides from user_profiles (Single Source of Truth)
        try {
            const { followService } = require('./followService');
            const followStatus = await followService.getFollowStatus(targetUserId);
            data.relationship.follow_status = followStatus;

            const { data: upData } = await supabase
                .from('user_profiles')
                .select('bio, location, avatar_url, username, full_name') // Removed: is_private, message_privacy
                .eq('user_id', targetUserId)
                .neq('username', `cache_bust_${Date.now()}`) // FORCE NETWORK FETCH (Bypass React Native GET Cache)
                .single();
                
            if (upData) {
                if (upData.bio !== null && upData.bio !== '') data.profile.bio = upData.bio;
                if (upData.location !== null && upData.location !== '') data.profile.location = upData.location;
                if (upData.avatar_url !== null) data.profile.avatar_url = upData.avatar_url;
                if (upData.username) data.profile.username = upData.username;
                if (upData.full_name) {
                    data.profile.full_name = upData.full_name;
                    data.profile.name = upData.full_name;
                }
            }
        } catch (e) {
            console.warn('Could not fetch user_profiles override:', e);
        }

        return data; // Returns { profile, stats, relationship, badges, recent_activity }
    } catch (error) {
        console.error('Error fetching real profile data:', error);
        return null;
    }
};



export const updateProfileInfo = async (updates: { 
    bio?: string,
    location?: string,
    is_private?: boolean,
    message_privacy?: 'everyone' | 'followers' | 'nobody',
    push_enabled?: boolean
}) => {
    try {
        const userId = await getUserId();
        console.log("updateProfileInfo START - UserId:", userId, "Updates:", updates);
        
        if (!userId) return null;
        
        // Fetch base user data to satisfy NOT NULL constraints in user_profiles
        const { data: baseUser } = await supabase.from('users').select('username, full_name').eq('id', userId).single();
        
        // Upsert into user_profiles
        console.log("updateProfileInfo - Sending UPSERT to user_profiles table...");
        const upsertPayload: any = { 
            user_id: userId, 
            username: baseUser?.username || `user_${userId.substring(0,6)}`,
            full_name: baseUser?.full_name || 'User',
        };
        
        if (updates.bio !== undefined) upsertPayload.bio = updates.bio;
        if (updates.location !== undefined) upsertPayload.location = updates.location;
        // Temporarily comment out these fields because they crash the upsert if SQL migration is missing
        // if (updates.is_private !== undefined) upsertPayload.is_private = updates.is_private;
        // if (updates.message_privacy !== undefined) upsertPayload.message_privacy = updates.message_privacy;
        // if (updates.push_enabled !== undefined) upsertPayload.push_enabled = updates.push_enabled;
        
        const { data, error: profileError } = await supabase
            .from('user_profiles')
            .upsert(upsertPayload, { onConflict: 'user_id' })
            .select();

        // FALLBACK: Also update the base users table to guarantee the data persists!
        const usersUpdatePayload: any = {};
        if (updates.bio !== undefined) usersUpdatePayload.bio = updates.bio;
        if (updates.location !== undefined) usersUpdatePayload.location = updates.location;
        
        if (Object.keys(usersUpdatePayload).length > 0) {
            await supabase.from('users').update(usersUpdatePayload).eq('id', userId);
        }
            
        await fetch('http://localhost:9999/log', { method: 'POST', body: JSON.stringify({ action: 'updateProfileInfo', data, error: profileError }) }).catch(()=>console.log('logger failed'));
            
        console.log("updateProfileInfo - Supabase Response Data:", data);
        console.log("updateProfileInfo - Supabase Error:", profileError);
            
        if (profileError) {
            console.error("updateProfileInfo - EXACT ERROR:", profileError);
            throw profileError;
        }

        console.log("updateProfileInfo - SUCCESS");
        return true;
    } catch (error: any) {
        console.error('Error updating profile info - CATCH BLOCK:', error);
        await fetch('http://localhost:9999/log', { method: 'POST', body: JSON.stringify({ action: 'updateProfileInfo_catch', error: error?.message || error }) }).catch(()=>console.log('logger failed'));
        throw error;
    }
};

export const updateAvatar = async (url: string) => {
    try {
        const userId = await getUserId();
        console.log("updateAvatar START - UserId:", userId, "URL:", url);

        if (!userId) return null;
        
        // Fetch base user data
        const { data: baseUser } = await supabase.from('users').select('username, full_name').eq('id', userId).single();

        // Upsert into user_profiles
        console.log("updateAvatar - Sending UPSERT to user_profiles table...");
        const upsertPayload = { 
            user_id: userId, 
            username: baseUser?.username || `user_${userId.substring(0,6)}`,
            full_name: baseUser?.full_name || 'User',
            avatar_url: url 
        };
        const { data, error: profileError } = await supabase
            .from('user_profiles')
            .upsert(upsertPayload, { onConflict: 'user_id' })
            .select();
            
        await fetch('http://localhost:9999/log', { method: 'POST', body: JSON.stringify({ action: 'updateAvatar', data, error: profileError }) }).catch(()=>console.log('logger failed'));
            
        console.log("updateAvatar - Supabase Response Data:", data);
        console.log("updateAvatar - Supabase Error:", profileError);
            
        if (profileError) {
            console.error("updateAvatar - EXACT ERROR:", profileError);
            throw profileError;
        }

        console.log("updateAvatar - SUCCESS");
        return true;
    } catch (error) {
        console.error('Error updating avatar - CATCH BLOCK:', error);
        await fetch('http://localhost:9999/log', { method: 'POST', body: JSON.stringify({ action: 'updateAvatar_catch', error: error?.message || error }) }).catch(()=>console.log('logger failed'));
        return null;
    }
};

export const addSocialLink = async (platform: string, url: string) => {
    try {
        const userId = await getUserId();
        if (!userId) return null;
        
        const { data, error } = await supabase
            .from('user_socials')
            .insert({ user_id: userId, platform, url })
            .select()
            .single();
            
        if (error) throw error;
        return data as UserSocial;
    } catch (error) {
        console.error('Error adding social link:', error);
        return null;
    }
};

export const deleteSocialLink = async (id: string) => {
    try {
        const userId = await getUserId();
        if (!userId) return false;
        
        await supabase
            .from('user_socials')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        return true;
    } catch (error) {
        console.error('Error deleting social link:', error);
        return false;
    }
};

// Fallback user initialization for testing if stats don't exist
export const ensureUserStats = async (userId?: string) => {
    try {
        const targetUserId = userId || await getUserId();
        if (!targetUserId) return;
        
        const { data } = await supabase.from('user_stats').select('user_id').eq('user_id', targetUserId).maybeSingle();
        if (!data) {
            await supabase.from('user_stats').insert({
                user_id: targetUserId,
                followers_count: 0,
                following_count: 0,
                argument_votes: 0,
                arena_wins: 0,
                duel_wins: 0,
                quiz_count: 0,
                content_count: 0
            });
        }
    } catch (error) {
        console.warn('Supabase offline, skipping ensureUserStats');
    }
};

export const toggleLikePost = async (postId: string) => {
    try {
        const { isLiked } = await checkPostInteractions(postId);
        await feedServiceToggleLike(postId, isLiked);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const toggleSavePost = async (postId: string) => {
    try {
        await savedServiceToggleSave(postId);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const checkPostInteractions = async (postId: string) => {
    try {
        const userId = await getUserId();
        
        const [interactionsRes, savesRes] = await Promise.all([
            supabase.from('post_interactions').select('user_id, type', { count: 'exact' }).eq('post_id', postId).eq('type', 'like'),
            supabase.from('post_interactions').select('user_id', { count: 'exact' }).eq('post_id', postId).eq('type', 'save')
        ]);
        
        const likes = interactionsRes.data || [];
        const saves = savesRes.data || [];
        
        const isLiked = userId ? likes.some(l => l.user_id === userId) : false;
        const isSaved = userId ? saves.some(s => s.user_id === userId) : false;
        
        return {
            likeCount: likes.length,
            saveCount: saves.length,
            isLiked,
            isSaved
        };
    } catch (e) {
        return { likeCount: 0, saveCount: 0, isLiked: false, isSaved: false };
    }
};
