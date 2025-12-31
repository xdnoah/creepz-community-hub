import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { DirectMessage, DMConversation } from '../types';

export function useDMs(otherUserId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch conversations list with timeout
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      const conversationsPromise = supabase.rpc('get_dm_conversations', {
        user_id: user.id
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Conversations fetch timeout')), 6000)
      );

      const { data, error } = await Promise.race([conversationsPromise, timeoutPromise]);

      if (error) {
        // Check if DM system not set up
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          console.warn('DM system not set up - run DM_PRESENCE_SETUP.sql in Supabase');
          setConversations([]);
          setError(null); // Don't show error to user
          return;
        }
        throw error;
      }

      setConversations(data || []);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setConversations([]);
    }
  }, [user]);

  // Fetch messages for a specific conversation with timeout
  const fetchMessages = useCallback(async () => {
    if (!user || !otherUserId) return;

    try {
      setError(null);

      const messagesPromise = supabase
        .from('direct_messages')
        .select(`
          *,
          sender:sender_id(username),
          receiver:receiver_id(username)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DM fetch timeout')), 6000)
      );

      const { data, error } = await Promise.race([messagesPromise, timeoutPromise]);

      if (error) {
        // Check if DM tables not set up
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.warn('DM system not set up - run DM_PRESENCE_SETUP.sql in Supabase');
          setMessages([]);
          setError(null); // Don't show error to user
          setLoading(false);
          return;
        }
        throw error;
      }

      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('read', false);

    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user, otherUserId]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_unread_dm_count', {
        user_id: user.id
      });

      if (error) {
        // Silently fail if DM system not set up
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          setUnreadCount(0);
          return;
        }
        throw error;
      }

      setUnreadCount(data || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Send a message
  const sendMessage = async (content: string) => {
    if (!user || !otherUserId || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          content: content.trim(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    if (otherUserId) {
      fetchMessages();
    } else {
      fetchConversations();
      setLoading(false);
    }

    // Subscribe to new DMs
    const subscription = supabase
      .channel('direct_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          if (otherUserId) {
            fetchMessages();
          } else {
            fetchConversations();
          }
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${user.id}`
        },
        () => {
          if (otherUserId) {
            fetchMessages();
          } else {
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, otherUserId, fetchMessages, fetchConversations, fetchUnreadCount]);

  const retry = () => {
    setLoading(true);
    setError(null);
    if (otherUserId) {
      fetchMessages();
    } else {
      fetchConversations();
    }
  };

  return {
    messages,
    conversations,
    loading,
    error,
    unreadCount,
    sendMessage,
    refreshConversations: fetchConversations,
    retry,
  };
}
