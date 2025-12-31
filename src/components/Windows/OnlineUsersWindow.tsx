import { Window } from './Window';
import { usePresence } from '../../hooks/usePresence';
import { useWindowManager } from '../../contexts/WindowContext';
import { UserListSkeleton, LoadingState } from '../ui/LoadingSkeleton';
import type { WindowState } from '../../types';

interface OnlineUsersWindowProps {
  window: WindowState;
}

export function OnlineUsersWindow({ window }: OnlineUsersWindowProps) {
  const { onlineUsers, loading, error, retry } = usePresence();
  const { openWindow } = useWindowManager();

  const handleUserClick = (userId: string, username: string) => {
    openWindow('dm', { otherUserId: userId, otherUsername: username });
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <UserListSkeleton />
          ) : error ? (
            <LoadingState error={error} onRetry={retry} />
          ) : onlineUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-4 text-gray-600">
                <div className="text-2xl mb-2">👥</div>
                <div>No users found</div>
                <div className="text-xs mt-2">Be patient, users will appear soon!</div>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {onlineUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-2 p-2 hover:bg-win95-blue hover:text-white cursor-pointer border border-gray-300"
                  onClick={() => handleUserClick(user.user_id, user.username)}
                  title="Click to send a message"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: user.status === 'online' ? '#00ff00' : '#808080'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{user.username}</div>
                    <div className="text-xs opacity-75">
                      {user.status === 'online' ? 'Online' : `Last seen ${formatLastSeen(user.last_seen)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t-2 border-gray-400 p-2 bg-win95-gray">
          <div className="text-xs text-gray-700">
            {onlineUsers.filter(u => u.status === 'online').length} user(s) online
          </div>
        </div>
      </div>
    </Window>
  );
}
