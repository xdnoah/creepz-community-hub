import { useWindowManager } from '../../contexts/WindowContext';
import { useAuth } from '../../contexts/AuthContext';

interface StartMenuProps {
  onClose: () => void;
}

const CREEPZ_CONTRACT = '0xfe8c6d19365453d26af321d0e8c910428c23873f';

export function StartMenu({ onClose }: StartMenuProps) {
  const { openWindow } = useWindowManager();
  const { user, signOut } = useAuth();

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank');
    onClose();
  };

  const handleOpenWindow = (windowType: 'chat' | 'myProfile' | 'onlineUsers' | 'dmList' | 'settings' | 'lizardgoshi' | 'sales' | 'twitter' | 'raid' | 'activity' | 'howItWorks' | 'casino') => {
    openWindow(windowType);
    onClose();
  };

  const handleLogout = () => {
    signOut();
    onClose();
  };

  return (
    <>
      {/* Invisible overlay to close menu when clicking outside */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Start Menu */}
      <div
        className="absolute bottom-10 left-1 bg-win95-gray border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800"
        style={{
          width: '280px',
          zIndex: 9999,
          boxShadow: '2px 2px 10px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="flex">
          <div
            className="w-8 flex items-end pb-2 px-1"
            style={{
              background: 'linear-gradient(to bottom, #000080, #1084d0)',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed'
            }}
          >
            <span className="text-white font-bold text-lg tracking-wider">
              Creepz 95
            </span>
          </div>

          {/* Menu Items */}
          <div className="flex-1">
            {/* Programs Section */}
            <div className="border-b border-gray-400">
              <MenuSection label="Apps" />
              <MenuItem
                icon="🦎"
                label="LizardGoshi"
                onClick={() => handleOpenWindow('lizardgoshi')}
              />
              <MenuItem
                icon="💬"
                label="Global Chat"
                onClick={() => handleOpenWindow('chat')}
              />
              <MenuItem
                icon="👥"
                label="Who's Online"
                onClick={() => handleOpenWindow('onlineUsers')}
              />
              <MenuItem
                icon="📬"
                label="Messages"
                onClick={() => handleOpenWindow('dmList')}
              />
              <MenuItem
                icon="👤"
                label="My Profile"
                onClick={() => handleOpenWindow('myProfile')}
              />
              <MenuItem
                icon="💰"
                label="Creepz Sales"
                onClick={() => handleOpenWindow('sales')}
              />
              <MenuItem
                icon="🐦"
                label="X - @CreepzNFT"
                onClick={() => handleOpenWindow('twitter')}
              />
              <MenuItem
                icon="🚀"
                label="RAID Party"
                onClick={() => handleOpenWindow('raid')}
              />
              <MenuItem
                icon="📊"
                label="Activity Monitor"
                onClick={() => handleOpenWindow('activity')}
              />
              <MenuItem
                icon="❓"
                label="How It Works"
                onClick={() => handleOpenWindow('howItWorks')}
              />
              <MenuItem
                icon="🎰"
                label="Casino"
                onClick={() => handleOpenWindow('casino')}
              />
              <MenuItem
                icon="⚙️"
                label="Settings"
                onClick={() => handleOpenWindow('settings')}
              />
            </div>

            {/* Websites Section */}
            <div className="border-b border-gray-400">
              <MenuSection label="Websites" />
              <MenuItem
                icon="🌐"
                label="Creepz.co"
                onClick={() => handleOpenLink('https://creepz.co')}
              />
              <MenuItem
                icon="👑"
                label="Overlord.xyz"
                onClick={() => handleOpenLink('https://overlord.xyz')}
              />
            </div>

            {/* Socials Section */}
            <div className="border-b border-gray-400">
              <MenuSection label="Socials" />
              <MenuItem
                icon="🐦"
                label="X (Twitter) @creepz"
                onClick={() => handleOpenLink('https://twitter.com/creepz')}
              />
              <MenuItem
                icon="💬"
                label="Discord"
                onClick={() => handleOpenLink('https://discord.com/invite/overlordxyz')}
              />
            </div>

            {/* Where to Buy Section */}
            <div className="border-b border-gray-400">
              <MenuSection label="Where to Buy" />
              <MenuItem
                icon="⚡"
                label="Blur"
                onClick={() => handleOpenLink(`https://blur.io/collection/${CREEPZ_CONTRACT}`)}
              />
              <MenuItem
                icon="🌊"
                label="OpenSea"
                onClick={() => handleOpenLink(`https://opensea.io/collection/creepz`)}
              />
            </div>

            {/* User Info */}
            {user && (
              <div className="px-3 py-2 text-xs border-b border-gray-400 bg-white">
                <div className="font-bold">{user.username}</div>
                <div className="text-gray-600">Logged in</div>
              </div>
            )}

            {/* Logout Section */}
            <MenuItem
              icon="🚪"
              label="Log Out"
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>
    </>
  );
}

interface MenuSectionProps {
  label: string;
}

function MenuSection({ label }: MenuSectionProps) {
  return (
    <div className="px-3 py-1 bg-gray-300">
      <span className="text-xs font-bold text-gray-700">{label}</span>
    </div>
  );
}

interface MenuItemProps {
  icon: string;
  label: string;
  onClick: () => void;
}

function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 hover:bg-win95-blue hover:text-white cursor-pointer transition-colors"
      onClick={onClick}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
