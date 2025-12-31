import { Window } from './Window';
import { useDMs } from '../../hooks/useDMs';
import { useWindowManager } from '../../contexts/WindowContext';
import { ConversationListSkeleton, LoadingState } from '../ui/LoadingSkeleton';
import type { WindowState } from '../../types';

interface DMListWindowProps {
  window: WindowState;
}

export function DMListWindow({ window }: DMListWindowProps) {
  const { conversations, loading, error, unreadCount, retry } = useDMs();
  const { openWindow } = useWindowManager();

  const handleConversationClick = (userId: string, username: string) => {
    openWindow('dm', { otherUserId: userId, otherUsername: username });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <ConversationListSkeleton />
          ) : error ? (
            <LoadingState error={error} onRetry={retry} />
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-8 text-gray-600">
                <div className="text-4xl mb-3">📬</div>
                <div className="font-bold mb-2">No messages yet</div>
                <div className="text-sm">Click on a user in "Who's Online" to start chatting!</div>
              </div>
            </div>
          ) : (
            <div>
              {conversations.map((conv) => (
                <div
                  key={conv.other_user_id}
                  className="flex items-start gap-3 p-3 hover:bg-win95-blue hover:text-white cursor-pointer border-b border-gray-300"
                  onClick={() => handleConversationClick(conv.other_user_id, conv.other_username)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold truncate">{conv.other_username}</div>
                      <div className="text-xs opacity-75 flex-shrink-0 ml-2">
                        {formatTime(conv.last_message_time)}
                      </div>
                    </div>
                    <div className="text-sm truncate opacity-75">
                      {conv.last_message}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="flex-shrink-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t-2 border-gray-400 p-2 bg-win95-gray">
          <div className="text-xs text-gray-700">
            {conversations.length} conversation(s)
          </div>
        </div>
      </div>
    </Window>
  );
}
