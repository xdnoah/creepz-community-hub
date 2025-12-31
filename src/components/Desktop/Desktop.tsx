import { useEffect } from 'react';
import { DesktopIcon } from './DesktopIcon';
import { Taskbar } from './Taskbar';
import { useWindowManager } from '../../contexts/WindowContext';
import { usePresence } from '../../hooks/usePresence';
import { useDMs } from '../../hooks/useDMs';
import { useNotifications } from '../../hooks/useNotifications';
import { useSettings } from '../../hooks/useSettings';
import { AuthWindow } from '../Windows/AuthWindow';
import { ChatWindow } from '../Windows/ChatWindow';
import { ProfileWindow } from '../Windows/ProfileWindow';
import { MyProfileWindow } from '../Windows/MyProfileWindow';
import { SalesWindow } from '../Windows/SalesWindow';
import { TwitterWindow } from '../Windows/TwitterWindow';
import { OnlineUsersWindow } from '../Windows/OnlineUsersWindow';
import { DMListWindow } from '../Windows/DMListWindow';
import { DMWindow } from '../Windows/DMWindow';
import { SettingsWindow } from '../Windows/SettingsWindow';
import { RaidWindow } from '../Windows/RaidWindow';
import { NotificationContainer } from '../ui/NotificationToast';

interface DesktopProps {
  showAuthWindow?: boolean;
}

export function Desktop({ showAuthWindow = false }: DesktopProps) {
  const { windows, openWindow, closeWindow } = useWindowManager();
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Initialize settings (applies background color, font size, etc.)
  useSettings();

  // Initialize presence tracking (sets user online/offline)
  // Will gracefully fail if database tables not set up
  usePresence();

  // Track unread DMs for notifications
  // Will gracefully fail if database tables not set up
  const { unreadCount } = useDMs();

  useEffect(() => {
    if (showAuthWindow) {
      openWindow('auth');
    } else {
      // Close auth window when user logs in
      const authWindow = windows.find(w => w.type === 'auth');
      if (authWindow) {
        closeWindow(authWindow.id);
      }
    }
  }, [showAuthWindow, openWindow, closeWindow, windows]);

  // Show notification when new DM arrives
  useEffect(() => {
    if (unreadCount > 0) {
      addNotification('New Message', 'You have unread direct messages!');
    }
  }, [unreadCount, addNotification]);

  return (
    <div className="desktop-background">
      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <DesktopIcon
          icon="💬"
          label="Global Chat"
          onDoubleClick={() => openWindow('chat')}
        />
        <DesktopIcon
          icon="👤"
          label="My Profile"
          onDoubleClick={() => openWindow('myProfile')}
        />
        <DesktopIcon
          icon="👥"
          label="Who's Online"
          onDoubleClick={() => openWindow('onlineUsers')}
        />
        <DesktopIcon
          icon="📬"
          label="Messages"
          onDoubleClick={() => openWindow('dmList')}
        />
        <DesktopIcon
          icon="⚙️"
          label="Settings"
          onDoubleClick={() => openWindow('settings')}
        />
        <DesktopIcon
          icon="🚀"
          label="RAID"
          onDoubleClick={() => openWindow('raid')}
        />
      </div>

      {/* Windows */}
      {windows.map((window) => {
        switch (window.type) {
          case 'auth':
            return <AuthWindow key={window.id} window={window} />;
          case 'chat':
            return <ChatWindow key={window.id} window={window} />;
          case 'profile':
            return <ProfileWindow key={window.id} window={window} />;
          case 'myProfile':
            return <MyProfileWindow key={window.id} window={window} />;
          case 'sales':
            return <SalesWindow key={window.id} window={window} />;
          case 'twitter':
            return <TwitterWindow key={window.id} window={window} />;
          case 'onlineUsers':
            return <OnlineUsersWindow key={window.id} window={window} />;
          case 'dmList':
            return <DMListWindow key={window.id} window={window} />;
          case 'dm':
            return <DMWindow key={window.id} window={window} />;
          case 'settings':
            return <SettingsWindow key={window.id} window={window} />;
          case 'raid':
            return <RaidWindow key={window.id} window={window} />;
          default:
            return null;
        }
      })}

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
