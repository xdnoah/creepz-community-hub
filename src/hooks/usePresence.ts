import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { UserPresence } from '../types';

export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update user's presence status
  const updatePresence = async (status: 'online' | 'offline') => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('update_user_presence', { status_val: status });
      if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
        // Silently fail if presence system not set up
        return;
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  // Fetch online users with timeout
  const fetchOnlineUsers = async () => {
    try {
      setError(null);

      // Add 6 second timeout
      const usersPromise = supabase.rpc('get_online_users');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Users fetch timeout')), 6000)
      );

      const { data, error } = await Promise.race([usersPromise, timeoutPromise]);

      if (error) {
        // Check if it's a "function does not exist" error
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          console.warn('Presence system not set up - run PRESENCE_SETUP.sql in Supabase');
          setOnlineUsers([]);
          setError(null); // Don't show error to user
          setLoading(false);
          return;
        }
        throw error;
      }

      setOnlineUsers(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching online users:', err);
      setError(err.message || 'Failed to load users');
      setOnlineUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Set user as online when component mounts
  useEffect(() => {
    if (!user) return;

    updatePresence('online');
    fetchOnlineUsers();

    // Subscribe to presence changes
    const subscription = supabase
      .channel('user_presence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    // Update presence every 30 seconds to keep status fresh
    const interval = setInterval(() => {
      updatePresence('online');
    }, 30000);

    // Set user as offline when they leave
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      updatePresence('offline');
      subscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchOnlineUsers();
  };

  return {
    onlineUsers,
    loading,
    error,
    updatePresence,
    retry,
  };
}
