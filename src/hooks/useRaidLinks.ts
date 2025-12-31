import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RaidLink {
  id: string;
  user_id: string;
  username: string;
  tweet_url: string;
  description: string | null;
  created_at: string;
}

export function useRaidLinks() {
  const [links, setLinks] = useState<RaidLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();

    // Subscribe to new links
    const channel: RealtimeChannel = supabase
      .channel('raid_links_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'raid_links',
        },
        async (payload) => {
          // Fetch the username for the new link
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();

          if (profile) {
            const newLink: RaidLink = {
              ...payload.new,
              username: profile.username,
            } as RaidLink;

            setLinks((prev) => [newLink, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'raid_links',
        },
        (payload) => {
          setLinks((prev) => prev.filter((link) => link.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  async function fetchLinks() {
    try {
      setLoading(true);
      setError(null);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Raid links fetch timeout')), 8000)
      );

      const linksPromise = supabase
        .from('raid_links')
        .select(`
          *,
          profiles:user_id (
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error: fetchError } = await Promise.race([linksPromise, timeoutPromise]);

      if (fetchError) {
        // Check if table doesn't exist
        if (fetchError.message?.includes('relation') && fetchError.message?.includes('does not exist')) {
          console.warn('[RaidLinks] raid_links table not set up - run RAID_SETUP.sql in Supabase');
          setLinks([]);
          setError(null);
          setLoading(false);
          return;
        }
        throw fetchError;
      }

      const formattedLinks = (data || []).map((link: any) => ({
        ...link,
        username: link.profiles?.username || 'Unknown',
      }));

      setLinks(formattedLinks);
      setError(null);
    } catch (err: any) {
      console.error('[RaidLinks] Error fetching links:', err);
      setError(err.message || 'Failed to load raid links');
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }

  async function addLink(tweetUrl: string, description: string | null, userId: string) {
    try {
      const { error: insertError } = await supabase.from('raid_links').insert({
        user_id: userId,
        tweet_url: tweetUrl,
        description: description || null,
      });

      if (insertError) throw insertError;

      return {};
    } catch (err: any) {
      console.error('[RaidLinks] Error adding link:', err);
      return { error: err.message || 'Failed to add raid link' };
    }
  }

  async function deleteLink(linkId: string) {
    try {
      const { error: deleteError } = await supabase
        .from('raid_links')
        .delete()
        .eq('id', linkId);

      if (deleteError) throw deleteError;

      return {};
    } catch (err: any) {
      console.error('[RaidLinks] Error deleting link:', err);
      return { error: err.message || 'Failed to delete raid link' };
    }
  }

  return {
    links,
    loading,
    error,
    addLink,
    deleteLink,
    retry: fetchLinks,
  };
}
