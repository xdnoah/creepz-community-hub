import { useState, useEffect, useRef } from 'react';
import { Input95 } from '../ui/Input95';
import { Button95 } from '../ui/Button95';
import { validateMessage, countWords } from '../../lib/utils';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onTyping, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const validation = validateMessage(message);
  const wordCount = countWords(message);
  const canSend = validation.valid && !disabled && !sending;

  // Handle typing indicator
  useEffect(() => {
    if (message.length > 0) {
      onTyping?.(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
      }, 2000);
    } else {
      onTyping?.(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, onTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSend) return;

    setSending(true);
    setError('');
    onTyping?.(false); // Stop typing when sending

    try {
      await onSend(message);
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-terminal-black border-t-2 border-terminal-green p-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input95
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError('');
            }}
            placeholder="Type your message..."
            disabled={disabled || sending}
            className="flex-1 bg-black text-terminal-green border-terminal-green"
          />
          {canSend && (
            <Button95 type="submit" disabled={!canSend}>
              Send
            </Button95>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={`terminal-text ${wordCount > 20 ? 'text-red-500' : ''}`}>
            {wordCount}/20 words
          </span>
          {error && <span className="text-red-500">{error}</span>}
          {!validation.valid && validation.error && (
            <span className="text-red-500">{validation.error}</span>
          )}
        </div>
      </form>
    </div>
  );
}
