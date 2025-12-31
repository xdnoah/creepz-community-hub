import { formatTimestamp } from '../../lib/utils';
import type { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
  onUsernameClick?: (userId: string, username: string) => void;
}

export function ChatMessage({ message, onUsernameClick }: ChatMessageProps) {
  const username = message.profiles?.username || 'Unknown';
  const time = formatTimestamp(message.created_at);

  return (
    <div className="terminal-text">
      <span className="text-gray-400">[{time}]</span>{' '}
      {onUsernameClick ? (
        <span
          className="terminal-username"
          onClick={() => onUsernameClick(message.user_id, username)}
        >
          {username}
        </span>
      ) : (
        <span className="terminal-text">{username}</span>
      )}
      : {message.content}
    </div>
  );
}
