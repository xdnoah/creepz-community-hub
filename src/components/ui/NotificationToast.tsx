import { useEffect } from 'react';
import type { Notification } from '../../types';

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div
      className="bg-win95-gray border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-lg w-80 animate-slide-in"
      style={{
        boxShadow: '4px 4px 10px rgba(0,0,0,0.5)'
      }}
    >
      {/* Title Bar */}
      <div className="bg-win95-blue text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>📬</span>
          <span className="font-bold text-sm">{notification.title}</span>
        </div>
        <button
          onClick={() => onClose(notification.id)}
          className="text-white hover:bg-red-600 w-5 h-5 flex items-center justify-center font-bold"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-3 bg-white border-2 border-gray-400">
        <div className="text-sm">{notification.message}</div>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export function NotificationContainer({ notifications, onClose }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-12 right-4 z-[10000] space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast notification={notification} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
