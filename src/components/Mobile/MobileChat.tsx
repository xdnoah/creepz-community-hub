import { MobileHeader } from './MobileHeader';
import { ChatMessages } from '../Chat/ChatMessages';
import { ChatInput } from '../Chat/ChatInput';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';

export function MobileChat() {
  const { messages, loading, sendMessage } = useChat();
  const { user } = useAuth();

  const handleSend = async (content: string) => {
    if (!user) return;
    const result = await sendMessage(content, user.id);
    if (result.error) {
      throw new Error(result.error);
    }
  };

  return (
    <div className="mobile-container">
      <MobileHeader />
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 mobile-chat-messages">
          <ChatMessages
            messages={messages}
            loading={loading}
            // No username click handler on mobile - profiles not available
          />
        </div>
        <div className="mobile-chat-input">
          <ChatInput onSend={handleSend} disabled={!user} />
        </div>
      </div>
    </div>
  );
}
