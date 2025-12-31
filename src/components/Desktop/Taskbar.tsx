import { useState, useEffect } from 'react';
import { TaskbarButton } from './TaskbarButton';
import { StartMenu } from './StartMenu';
import { Button95 } from '../ui/Button95';
import { useWindowManager } from '../../contexts/WindowContext';
import { useAuth } from '../../contexts/AuthContext';

export function Taskbar() {
  const { windows, restoreWindow } = useWindowManager();
  const { user, signOut } = useAuth();
  const [time, setTime] = useState(new Date());
  const [showStartMenu, setShowStartMenu] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const minimizedWindows = windows.filter((w) => w.isMinimized);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="taskbar">
      {/* Start Menu */}
      {showStartMenu && <StartMenu onClose={() => setShowStartMenu(false)} />}

      {/* Start Button */}
      <Button95
        className={`px-3 py-1 font-bold ${showStartMenu ? 'border-t-gray-800 border-l-gray-800 border-b-white border-r-white' : ''}`}
        onClick={() => setShowStartMenu(!showStartMenu)}
      >
        <span className="flex items-center gap-1">
          <span>🪟</span>
          <span>Start</span>
        </span>
      </Button95>

      {/* Minimized Windows */}
      <div className="flex-1 flex gap-1 overflow-x-auto">
        {minimizedWindows.map((window) => (
          <TaskbarButton
            key={window.id}
            title={window.title}
            onClick={() => restoreWindow(window.id)}
          />
        ))}
      </div>

      {/* User Info & Clock */}
      <div className="flex items-center gap-2">
        {user && (
          <>
            <span className="text-sm font-bold">{user.username}</span>
            <Button95 onClick={signOut} className="text-xs px-2 py-0">
              Logout
            </Button95>
          </>
        )}
        <div className="border-2 border-l-gray-600 border-t-gray-600 border-r-white border-b-white px-3 py-1 text-sm">
          {formatTime(time)}
        </div>
      </div>
    </div>
  );
}
