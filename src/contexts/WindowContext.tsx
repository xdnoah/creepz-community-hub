import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { WindowState, WindowType } from '../types';
import { WINDOW_DEFAULTS } from '../types';

interface WindowContextType {
  windows: WindowState[];
  openWindow: (type: WindowType, data?: any) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export function WindowProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);

  function getWindowTitle(type: WindowType, data?: any): string {
    switch (type) {
      case 'auth':
        return 'Login';
      case 'chat':
        return 'Global Chat';
      case 'myProfile':
        return 'My Profile';
      case 'profile':
        return data?.username ? `${data.username}'s Profile` : 'Profile';
      case 'sales':
        return 'Creepz Sales';
      case 'twitter':
        return 'X - @CreepzNFT';
      case 'onlineUsers':
        return "Who's Online";
      case 'dmList':
        return 'Messages';
      case 'dm':
        return data?.username ? `DM: ${data.username}` : 'Direct Message';
      case 'settings':
        return 'Settings';
      case 'raid':
        return '🚀 RAID PARTY';
      case 'lizardgoshi':
        return '🦎 LizardGoshi';
      case 'activity':
        return '📊 Activity Monitor';
      case 'lizardFight':
        return '⚔️ Lizard Fight';
      case 'howItWorks':
        return '📖 How It Works';
      case 'casino':
        return '🎰 Casino';
      default:
        return 'Window';
    }
  }

  const openWindow = useCallback((type: WindowType, data?: any) => {
    setWindows(prev => {
      // If opening a profile window, close any existing profile window first
      if (type === 'profile') {
        const filtered = prev.filter(w => w.type !== 'profile');

        const config = WINDOW_DEFAULTS[type];
        const newWindow: WindowState = {
          id: `${type}-${Date.now()}-${Math.random()}`,
          type,
          title: getWindowTitle(type, data),
          isMinimized: false,
          isMaximized: false,
          zIndex: nextZIndex,
          position: { x: config.x, y: config.y },
          size: { width: config.width, height: config.height },
          data,
        };

        setNextZIndex(n => n + 1);
        return [...filtered, newWindow];
      }

      // Check if window of this type already exists
      const existing = prev.find(w => w.type === type);
      if (existing) {
        // Don't create duplicate, just return current state
        // The focusWindow will be called separately
        return prev;
      }

      const config = WINDOW_DEFAULTS[type];

      // LizardGoshi should open maximized by default
      const shouldMaximize = type === 'lizardgoshi';

      const newWindow: WindowState = {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type,
        title: getWindowTitle(type, data),
        isMinimized: false,
        isMaximized: shouldMaximize,
        zIndex: nextZIndex,
        position: { x: config.x, y: config.y },
        size: { width: config.width, height: config.height },
        data,
      };

      setNextZIndex(n => n + 1);
      return [...prev, newWindow];
    });
  }, [nextZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id === id && !w.isMaximized) {
          // Store current position and size before maximizing
          return {
            ...w,
            isMaximized: true,
            previousPosition: w.position,
            previousSize: w.size,
            position: { x: 0, y: 0 },
            size: { width: window.innerWidth, height: window.innerHeight - 48 }, // Account for taskbar
          };
        }
        return w;
      })
    );
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id === id) {
          if (w.isMaximized) {
            // Restore from maximized state
            return {
              ...w,
              isMaximized: false,
              position: w.previousPosition || w.position,
              size: w.previousSize || w.size,
              previousPosition: undefined,
              previousSize: undefined,
              zIndex: nextZIndex,
            };
          } else {
            // Restore from minimized state
            return { ...w, isMinimized: false, zIndex: nextZIndex };
          }
        }
        return w;
      })
    );
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id === id) {
          return { ...w, zIndex: nextZIndex };
        }
        return w;
      })
    );
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, position: { x, y } } : w))
    );
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows(prev =>
      prev.map(w => (w.id === id ? { ...w, size: { width, height } } : w))
    );
  }, []);

  return (
    <WindowContext.Provider
      value={{
        windows,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        restoreWindow,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
      }}
    >
      {children}
    </WindowContext.Provider>
  );
}

export function useWindowManager() {
  const context = useContext(WindowContext);
  if (context === undefined) {
    throw new Error('useWindowManager must be used within a WindowProvider');
  }
  return context;
}
