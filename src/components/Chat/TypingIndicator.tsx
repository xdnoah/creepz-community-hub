interface TypingIndicatorProps {
  typingUsers: Array<{ username: string; userId: string }>;
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${typingUsers[2].username} are typing...`;
    } else {
      return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${typingUsers.length - 2} others are typing...`;
    }
  };

  return (
    <div className="px-3 py-1 text-xs text-gray-600 italic border-t border-gray-300 bg-gray-50 flex items-center gap-2">
      <span className="inline-flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
      </span>
      <span>{getTypingText()}</span>
    </div>
  );
}
