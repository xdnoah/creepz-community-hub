import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import type { Message } from '../../types';

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  error?: string | null;
  onUsernameClick?: (userId: string, username: string) => void;
  onRetry?: () => void;
}

export function ChatMessages({ messages, loading, error, onUsernameClick, onRetry }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="terminal flex flex-col items-center justify-center h-full gap-3">
        <div className="text-4xl animate-pulse">⌛</div>
        <div className="terminal-text">Loading messages...</div>
        <div className="text-xs opacity-75">Connecting to chat server...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal flex flex-col items-center justify-center h-full gap-3">
        <div className="text-4xl">⚠️</div>
        <div className="text-red-500 font-bold">Failed to load messages</div>
        <div className="text-xs opacity-75">{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-terminal-green text-black px-4 py-2 font-bold border-2 border-terminal-green hover:bg-green-400 mt-2"
          >
            🔄 Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="terminal h-full flex flex-col">
      {messages.length === 0 ? (
        <div className="terminal-text">No messages yet. Be the first to say something!</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onUsernameClick={onUsernameClick}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
