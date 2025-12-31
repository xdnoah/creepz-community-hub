import { Window } from './Window';
import { ChatMessages } from '../Chat/ChatMessages';
import { ChatInput } from '../Chat/ChatInput';
import { TypingIndicator } from '../Chat/TypingIndicator';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import { useWindowManager } from '../../contexts/WindowContext';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useLizard } from '../../hooks/useLizard';
import type { WindowState } from '../../types';

interface ChatWindowProps {
  window: WindowState;
}

export function ChatWindow({ window }: ChatWindowProps) {
  const { messages, loading, error, sendMessage, retry } = useChat();
  const { user } = useAuth();
  const { openWindow } = useWindowManager();
  const { typingUsers, setTyping } = useTypingIndicator('global-chat');
  const { addMessageGold } = useLizard();

  const handleSend = async (content: string) => {
    if (!user) return;
    setTyping(false); // Stop typing when sending
    const result = await sendMessage(content, user.id);
    if (result.error) {
      throw new Error(result.error);
    }
    // Reward user with gold for sending message (silently fails if no lizard)
    try {
      await addMessageGold();
    } catch (err) {
      console.log('Gold reward skipped: User may not have a lizard yet');
    }
  };

  const handleUsernameClick = (userId: string, username: string) => {
    openWindow('profile', { userId, username });
  };

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping);
  };

  return (
    <Window window={window}>
      <div className="flex flex-col h-full p-0">
        <div className="flex-1 overflow-hidden">
          <ChatMessages
            messages={messages}
            loading={loading}
            error={error}
            onUsernameClick={handleUsernameClick}
            onRetry={retry}
          />
        </div>
        <TypingIndicator typingUsers={typingUsers} />
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          disabled={!user || loading || !!error}
        />
      </div>
    </Window>
  );
}
