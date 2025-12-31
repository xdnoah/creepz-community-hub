import { useState, useRef, useEffect } from 'react';
import { Window } from './Window';
import { useDMs } from '../../hooks/useDMs';
import { useAuth } from '../../contexts/AuthContext';
import { Button95 } from '../ui/Button95';
import { MessageSkeleton, LoadingState } from '../ui/LoadingSkeleton';
import type { WindowState } from '../../types';

interface DMWindowProps {
  window: WindowState;
}

export function DMWindow({ window }: DMWindowProps) {
  const { user } = useAuth();
  const { otherUserId, otherUsername } = window.data || {};
  const { messages, loading, error, sendMessage, retry } = useDMs(otherUserId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    await sendMessage(input);
    setInput('');
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!otherUserId || !otherUsername) {
    return (
      <Window window={window} title="Direct Message">
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-gray-600">Error: Invalid conversation</div>
        </div>
      </Window>
    );
  }

  return (
    <Window window={window} title={`DM: ${otherUsername}`}>
      <div className="flex flex-col h-full bg-white">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <MessageSkeleton />
          ) : error ? (
            <LoadingState error={error} onRetry={retry} />
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-8 text-gray-600">
                <div className="text-4xl mb-3">💬</div>
                <div className="font-bold mb-2">No messages yet</div>
                <div className="text-sm">Say hello to {otherUsername}!</div>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {messages.map((message) => {
                const isMine = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded px-3 py-2 ${
                        isMine
                          ? 'bg-win95-blue text-white'
                          : 'bg-gray-200 text-black'
                      }`}
                    >
                      <div className="text-sm break-words whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isMine ? 'text-gray-200' : 'text-gray-600'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-gray-400 p-2 bg-win95-gray">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUsername}...`}
              className="flex-1 px-2 py-1 border-2 border-gray-600 resize-none"
              rows={2}
              maxLength={1000}
              disabled={sending || loading || !!error}
            />
            <Button95
              onClick={handleSend}
              disabled={!input.trim() || sending || loading || !!error}
              className="px-4"
            >
              Send
            </Button95>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {input.length}/1000 characters • Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </Window>
  );
}
