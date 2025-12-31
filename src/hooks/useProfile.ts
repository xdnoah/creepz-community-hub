import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, User } from '../types';

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  async function fetchProfile() {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const { data: historyData, error: historyError } = await supabase
        .from('username_history')
        .select('*')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false });

      if (historyError) throw historyError;

      setProfile({
        ...profileData,
        username_history: historyData || [],
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(updates: Partial<User>): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      await fetchProfile();
      return {};
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error: error.message || 'Failed to update profile' };
    }
  }

  async function changeUsername(newUsername: string, currentPassword: string): Promise<{ error?: string }> {
    try {
      // Verify password
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const email = user.email;
      if (!email) throw new Error('No email found');

      // Re-authenticate to verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Invalid password');

      // Get current username
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (!currentProfile) throw new Error('Profile not found');

      // Log username change to history
      const { error: historyError } = await supabase
        .from('username_history')
        .insert({
          user_id: userId,
          old_username: currentProfile.username,
          new_username: newUsername,
        });

      if (historyError) throw historyError;

      // Update username
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', userId);

      if (updateError) throw updateError;

      await fetchProfile();
      return {};
    } catch (error: any) {
      console.error('Error changing username:', error);
      return { error: error.message || 'Failed to change username' };
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<{ error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');

      // Re-authenticate to verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Invalid current password');

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      return {};
    } catch (error: any) {
      console.error('Error changing password:', error);
      return { error: error.message || 'Failed to change password' };
    }
  }

  return {
    profile,
    loading,
    updateProfile,
    changeUsername,
    changePassword,
  };
}
