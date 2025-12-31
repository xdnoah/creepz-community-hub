import { Button95 } from '../ui/Button95';
import { useAuth } from '../../contexts/AuthContext';

export function MobileHeader() {
  const { user, signOut } = useAuth();

  return (
    <div className="bg-win95-gray border-b-2 border-gray-800 p-3 flex items-center justify-between">
      <div className="font-bold text-sm">Creepz Hub</div>
      {user && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{user.username}</span>
          <Button95 onClick={signOut} className="text-xs px-2 py-1">
            Logout
          </Button95>
        </div>
      )}
    </div>
  );
}
