import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { RaidedTweet } from '../types';

const MAX_RAIDED_TWEETS = 10;

export function useRaidTracking() {
  const { user } = useAuth();
  const [raidedTweets, setRaidedTweets] = useState<RaidedTweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's raided tweets
  const fetchRaidedTweets = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('raided_tweets')
        .select('*')
        .eq('user_id', user.id)
        .order('raided_at', { ascending: false })
        .limit(MAX_RAIDED_TWEETS);

      if (fetchError) throw fetchError;

      setRaidedTweets(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching raided tweets:', err);
      setError(err.message || 'Failed to load raided tweets');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark tweet as raided
  const markAsRaided = async (raidLinkId: string): Promise<{ error?: string; goldEarned?: number }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Check if already raided
      const { data: existing } = await supabase
        .from('raided_tweets')
        .select('id')
        .eq('user_id', user.id)
        .eq('raid_link_id', raidLinkId)
        .single();

      if (existing) {
        return { error: 'Already raided this tweet' };
      }

      // Add to raided tweets
      const { error: insertError } = await supabase
        .from('raided_tweets')
        .insert({
          user_id: user.id,
          raid_link_id: raidLinkId,
        });

      if (insertError) throw insertError;

      // Award 500 gold to user's lizard
      const { data: lizard } = await supabase
        .from('lizards')
        .select('gold, total_gold_earned')
        .eq('id', user.id)
        .single();

      if (lizard) {
        await supabase
          .from('lizards')
          .update({
            gold: Math.floor(lizard.gold + 500),
            total_gold_earned: Math.floor(lizard.total_gold_earned + 500),
          })
          .eq('id', user.id);
      }

      // Clean up old tweets if exceeded limit
      await cleanupOldRaidedTweets();

      // Refresh list
      await fetchRaidedTweets();

      return { goldEarned: 500 };
    } catch (err: any) {
      console.error('Error marking tweet as raided:', err);
      return { error: err.message || 'Failed to mark tweet as raided' };
    }
  };

  // Clean up old raided tweets (keep only latest 10)
  const cleanupOldRaidedTweets = async () => {
    if (!user) return;

    try {
      // Get all raided tweets
      const { data: allRaided } = await supabase
        .from('raided_tweets')
        .select('id')
        .eq('user_id', user.id)
        .order('raided_at', { ascending: false });

      if (!allRaided || allRaided.length <= MAX_RAIDED_TWEETS) return;

      // Get IDs to delete (everything after the 10th)
      const idsToDelete = allRaided.slice(MAX_RAIDED_TWEETS).map(rt => rt.id);

      if (idsToDelete.length > 0) {
        await supabase
          .from('raided_tweets')
          .delete()
          .in('id', idsToDelete);
      }
    } catch (err: any) {
      console.error('Error cleaning up old raided tweets:', err);
    }
  };

  // Check if a raid link is already raided
  const isRaided = (raidLinkId: string): boolean => {
    return raidedTweets.some(rt => rt.raid_link_id === raidLinkId);
  };

  // Fetch raided tweets on mount
  useEffect(() => {
    if (user) {
      fetchRaidedTweets();
    }
  }, [user, fetchRaidedTweets]);

  return {
    raidedTweets,
    loading,
    error,
    markAsRaided,
    isRaided,
    refresh: fetchRaidedTweets,
  };
}
