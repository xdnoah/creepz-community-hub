import { useState } from 'react';

export type MobileView = 'chat' | 'myProfile' | 'onlineUsers' | 'messages' | 'raid' | 'activity' | 'lizardgoshi';

interface MobileNavProps {
  activeView: MobileView;
  onViewChange: (view: MobileView) => void;
  unreadDMCount?: number;
}

export function MobileNav({ activeView, onViewChange, unreadDMCount = 0 }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems: { id: MobileView; label: string; icon: string }[] = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'myProfile', label: 'Profile', icon: '👤' },
    { id: 'onlineUsers', label: 'Online', icon: '🟢' },
    { id: 'messages', label: 'Messages', icon: '📨' },
    { id: 'raid', label: 'Raid', icon: '🚀' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'lizardgoshi', label: 'LizardGoshi', icon: '🦎' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🦎</div>
          <div className="text-white font-bold text-lg">Creepz Hub</div>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Current View Indicator */}
      <div className="bg-white bg-opacity-20 px-3 py-2 flex items-center gap-2">
        <span className="text-white text-lg">
          {navItems.find(item => item.id === activeView)?.icon}
        </span>
        <span className="text-white font-semibold">
          {navItems.find(item => item.id === activeView)?.label}
        </span>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="bg-white border-t-2 border-gray-300 shadow-xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-4 border-b border-gray-200 transition-colors ${
                activeView === item.id
                  ? 'bg-blue-100 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-gray-800">{item.label}</span>
              {item.id === 'messages' && unreadDMCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadDMCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
