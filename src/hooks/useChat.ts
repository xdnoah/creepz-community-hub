import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastMessageTime = useRef<number>(0);

  useEffect(() => {
    // Fetch initial messages with timeout (Promise.race handles timeout)
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          fetchMessageWithProfile(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMessages() {
    try {
      setError(null);

      // Add 8 second timeout to prevent infinite loading
      const messagesPromise = supabase
        .from('messages')
        .select(`
          *,
          profiles (
            username
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Messages fetch timeout')), 8000)
      );

      const { data, error } = await Promise.race([messagesPromise, timeoutPromise]);

      if (error) throw error;

      // Reverse to show oldest first
      setMessages((data || []).reverse());
      setError(null);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
      // Still set empty array so UI can render
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessageWithProfile(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (
            username
          )
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      if (data) {
        setMessages(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error fetching new message:', error);
    }
  }

  async function sendMessage(content: string, userId: string): Promise<{ error?: string }> {
    // Rate limiting: 1 message per 2 seconds
    const now = Date.now();
    if (now - lastMessageTime.current < 2000) {
      return { error: 'Please wait 2 seconds between messages' };
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          content: content.trim(),
        });

      if (error) throw error;

      lastMessageTime.current = now;
      return {};
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { error: error.message || 'Failed to send message' };
    }
  }

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchMessages();
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    retry,
  };
}
