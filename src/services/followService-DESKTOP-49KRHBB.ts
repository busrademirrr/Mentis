import { supabase } from '../lib/supabase';

const getUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id;
};

export type FollowStatus = 'none' | 'pending' | 'accepted';

export const followService = {
    async getFollowStatus(targetUserId: string): Promise<FollowStatus> {
        try {
            const userId = await getUserId();
            if (!userId || userId === targetUserId) return 'none';

            // Bypass status column schema cache error
            const { data, error } = await supabase
                .from('followers')
                .select('created_at')
                .eq('follower_id', userId)
                .eq('following_id', targetUserId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching follow status:', error);
                return 'none';
            }

            if (data) {
                // If row exists, we check if target is private to determine pending vs accepted
                const { data: profile } = await supabase.from('user_profiles').select('is_private').eq('user_id', targetUserId).maybeSingle();
                return profile?.is_private ? 'pending' : 'accepted';
            }
            return 'none';
        } catch (e) {
            console.error('Exception in getFollowStatus:', e);
            return 'none';
        }
    },

    async requestFollow(targetUserId: string): Promise<{ success: boolean; newStatus: FollowStatus }> {
        try {
            const userId = await getUserId();
            if (!userId || userId === targetUserId) return { success: false, newStatus: 'none' };

            // Check if target profile is private
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('is_private')
                .eq('user_id', targetUserId)
                .maybeSingle();

            const isPrivate = profile?.is_private || false;
            const newStatus: FollowStatus = isPrivate ? 'pending' : 'accepted';

            const { error } = await supabase
                .from('followers')
                .insert({
                    follower_id: userId,
                    following_id: targetUserId
                });

            if (error) {
                if (error.code === '23505') {
                    // Already exists, just return success
                    return { success: true, newStatus };
                }
                throw error;
            }
            return { success: true, newStatus };
        } catch (e: any) {
            console.error('Error requesting follow:', e);
            return { success: false, newStatus: 'none', error: e.message || e };
        }
    },

    async unfollow(targetUserId: string): Promise<boolean> {
        try {
            const userId = await getUserId();
            if (!userId) return false;

            const { error } = await supabase
                .from('followers')
                .delete()
                .eq('follower_id', userId)
                .eq('following_id', targetUserId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Error unfollowing:', e);
            return false;
        }
    },

    async acceptRequest(followerId: string): Promise<boolean> {
        try {
            const userId = await getUserId();
            if (!userId) return false;

            const { error } = await supabase
                .from('followers')
                .update({ 
                    // status: 'accepted'
                })
                .eq('follower_id', followerId)
                .eq('following_id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Error accepting follow request:', e);
            return false;
        }
    },

    async rejectRequest(followerId: string): Promise<boolean> {
        try {
            const userId = await getUserId();
            if (!userId) return false;

            const { error } = await supabase
                .from('followers')
                .delete()
                .eq('follower_id', followerId)
                .eq('following_id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Error rejecting follow request:', e);
            return false;
        }
    },

    async removeFollower(followerId: string): Promise<boolean> {
        try {
            const userId = await getUserId();
            if (!userId) return false;

            const { error } = await supabase
                .from('followers')
                .delete()
                .eq('follower_id', followerId)
                .eq('following_id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Error removing follower:', e);
            return false;
        }
    },

    async getFollowers(userId?: string) {
        try {
            const targetUserId = userId || await getUserId();
            if (!targetUserId) return [];
            
            // Step 1: Fetch follower IDs (avoiding 'status' column if it's causing schema cache errors)
            const { data: followersData, error: followersError } = await supabase
                .from('followers')
                .select('follower_id, created_at')
                .eq('following_id', targetUserId);
                
            if (followersError) throw followersError;
            if (!followersData || followersData.length === 0) return [];

            const followerIds = followersData.map(f => f.follower_id);

            // Step 2: Fetch profiles manually to avoid Foreign Key Join issues
            const { data: profiles, error: profilesError } = await supabase
                .from('users')
                .select('id, username, full_name, avatar_value')
                .in('id', followerIds);

            if (profilesError) throw profilesError;

            return followersData.map(f => ({
                ...f,
                follower: profiles?.find(p => p.id === f.follower_id)
            }));
        } catch (e) {
            console.error('Error fetching followers:', e);
            return [];
        }
    },

    async getFollowing(userId?: string) {
        try {
            const targetUserId = userId || await getUserId();
            if (!targetUserId) return [];
            
            const { data: followingData, error: followingError } = await supabase
                .from('followers')
                .select('following_id, created_at')
                .eq('follower_id', targetUserId);
                
            if (followingError) throw followingError;
            if (!followingData || followingData.length === 0) return [];

            const followingIds = followingData.map(f => f.following_id);

            const { data: profiles, error: profilesError } = await supabase
                .from('users')
                .select('id, username, full_name, avatar_value')
                .in('id', followingIds);

            if (profilesError) throw profilesError;

            return followingData.map(f => ({
                ...f,
                following: profiles?.find(p => p.id === f.following_id)
            }));
        } catch (e) {
            console.error('Error fetching following:', e);
            return [];
        }
    }
};
