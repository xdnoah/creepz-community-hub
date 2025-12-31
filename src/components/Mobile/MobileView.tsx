import { useState } from 'react';
import { MobileNav, MobileView as MobileViewType } from './MobileNav';
import { MobileProvider } from '../../contexts/MobileContext';
import { ChatMessages } from '../Chat/ChatMessages';
import { ChatInput } from '../Chat/ChatInput';
import { TypingIndicator } from '../Chat/TypingIndicator';
import { MyProfileWindow } from '../Windows/MyProfileWindow';
import { OnlineUsersWindow } from '../Windows/OnlineUsersWindow';
import { DMListWindow } from '../Windows/DMListWindow';
import { RaidWindow } from '../Windows/RaidWindow';
import { ActivityWindow } from '../Windows/ActivityWindow';
import { LizardGoshiWindow } from '../Windows/LizardGoshiWindow';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import { useWindowManager } from '../../contexts/WindowContext';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useLizard } from '../../hooks/useLizard';
import { useDMs } from '../../hooks/useDMs';

export function MobileView() {
  const [activeView, setActiveView] = useState<MobileViewType>('chat');
  const { messages, loading, error, sendMessage, retry } = useChat();
  const { user } = useAuth();
  const { openWindow } = useWindowManager();
  const { typingUsers, setTyping } = useTypingIndicator('global-chat');
  const { addMessageGold } = useLizard();
  const { unreadCount } = useDMs();

  const handleSend = async (content: string) => {
    if (!user) return;
    setTyping(false);
    const result = await sendMessage(content, user.id);
    if (result.error) {
      throw new Error(result.error);
    }
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

  // Create mock window state for components that need it
  const mockWindow = {
    id: 'mobile-view',
    type: activeView as any,
    title: '',
    isMinimized: false,
    isMaximized: false,
    zIndex: 1,
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
  };

  return (
    <MobileProvider isMobile={true}>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
        <MobileNav
          activeView={activeView}
          onViewChange={setActiveView}
          unreadDMCount={unreadCount}
        />

      {/* Content Area - starts below the nav (approx 120px) */}
      <div className="flex-1 overflow-hidden" style={{ marginTop: '120px' }}>
        {/* Global Chat */}
        {activeView === 'chat' && (
          <div className="h-full flex flex-col bg-white">
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
        )}

        {/* My Profile */}
        {activeView === 'myProfile' && (
          <div className="h-full overflow-y-auto">
            <MyProfileWindow window={mockWindow} />
          </div>
        )}

        {/* Online Users */}
        {activeView === 'onlineUsers' && (
          <div className="h-full overflow-y-auto">
            <OnlineUsersWindow window={mockWindow} />
          </div>
        )}

        {/* Messages */}
        {activeView === 'messages' && (
          <div className="h-full overflow-y-auto">
            <DMListWindow window={mockWindow} />
          </div>
        )}

        {/* Raid */}
        {activeView === 'raid' && (
          <div className="h-full overflow-y-auto">
            <RaidWindow window={mockWindow} />
          </div>
        )}

        {/* Activity */}
        {activeView === 'activity' && (
          <div className="h-full overflow-y-auto">
            <ActivityWindow window={mockWindow} />
          </div>
        )}

        {/* LizardGoshi */}
        {activeView === 'lizardgoshi' && (
          <div className="h-full overflow-y-auto">
            <LizardGoshiWindow window={mockWindow} />
          </div>
        )}
      </div>
    </div>
    </MobileProvider>
  );
}
