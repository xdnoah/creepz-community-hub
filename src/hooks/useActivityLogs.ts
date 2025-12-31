import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ActivityLog, ActivityType } from '../types';

const MAX_LOGS = 100;

export function useActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial activity logs
  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(MAX_LOGS);

        if (fetchError) throw fetchError;

        setLogs(data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching activity logs:', err);
        setError(err.message || 'Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('activity_logs_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
        },
        (payload) => {
          const newLog = payload.new as ActivityLog;
          setLogs((prev) => [newLog, ...prev].slice(0, MAX_LOGS));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Log an activity
  const logActivity = async (
    activityType: ActivityType,
    metadata?: Record<string, any>
  ): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error: insertError } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          username: user.username,
          activity_type: activityType,
          metadata: metadata || null,
        });

      if (insertError) throw insertError;

      return {};
    } catch (err: any) {
      console.error('Error logging activity:', err);
      return { error: err.message || 'Failed to log activity' };
    }
  };

  return {
    logs,
    loading,
    error,
    logActivity,
  };
}
