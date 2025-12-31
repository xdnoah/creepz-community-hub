import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TypingUser {
  username: string;
  userId: string;
}

export function useTypingIndicator(channelName: string = 'global-chat') {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Create channel for typing indicators
    const typingChannel = supabase.channel(`typing:${channelName}`, {
      config: {
        broadcast: { self: false }, // Don't receive your own broadcasts
      },
    });

    // Listen for typing events
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { username, userId, isTyping } = payload;

        if (isTyping) {
          // Add user to typing list if not already there
          setTypingUsers((prev) => {
            if (prev.some((u) => u.userId === userId)) {
              return prev;
            }
            return [...prev, { username, userId }];
          });

          // Auto-remove after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
          }, 3000);
        } else {
          // Remove user from typing list
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }
      })
      .subscribe();

    setChannel(typingChannel);

    return () => {
      typingChannel.unsubscribe();
    };
  }, [user, channelName]);

  // Broadcast typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!channel || !user) return;

      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          username: user.username,
          userId: user.id,
          isTyping,
        },
      });
    },
    [channel, user]
  );

  return {
    typingUsers,
    setTyping,
  };
}
