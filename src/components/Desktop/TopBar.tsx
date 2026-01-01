import { useLizard } from '../../hooks/useLizard';
import { useAuth } from '../../contexts/AuthContext';

export function TopBar() {
  const { user } = useAuth();
  const { lizard, loading } = useLizard();

  if (!user || loading || !lizard) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-b-4 border-gray-800 shadow-lg z-50 flex items-center justify-between px-6">
      {/* Left Side - Lizard Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-1.5 rounded-full border-2 border-white border-opacity-30">
          <span className="text-2xl">🦎</span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">{lizard.name}</span>
            <span className="text-xs text-white text-opacity-80">Level {lizard.level}</span>
          </div>
        </div>
      </div>

      {/* Center - Gold Display */}
      <div className="flex items-center gap-2 bg-yellow-400 px-6 py-2 rounded-full border-2 border-yellow-600 shadow-lg">
        <span className="text-2xl">💰</span>
        <div className="flex flex-col items-center">
          <span className="text-lg font-black text-yellow-900 leading-none">
            {Math.floor(lizard.gold).toLocaleString()}
          </span>
          <span className="text-[10px] text-yellow-800 font-bold">GOLD</span>
        </div>
      </div>

      {/* Right Side - Rank Display */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm px-4 py-1.5 rounded-full border-2 border-white border-opacity-30">
          <span className="text-2xl">🏆</span>
          <div className="flex flex-col">
            <span className="text-xs text-white text-opacity-80 leading-none">Rank Points</span>
            <span className="text-sm font-bold text-white">{lizard.rank_points.toLocaleString()}</span>
          </div>
        </div>

        <div className={`px-4 py-1.5 rounded-full border-2 font-bold text-sm ${
          lizard.rank_tier === 'legend' ? 'bg-purple-500 border-purple-700 text-white' :
          lizard.rank_tier === 'diamond' ? 'bg-cyan-400 border-cyan-600 text-gray-900' :
          lizard.rank_tier === 'platinum' ? 'bg-gray-300 border-gray-500 text-gray-900' :
          lizard.rank_tier === 'gold' ? 'bg-yellow-400 border-yellow-600 text-gray-900' :
          lizard.rank_tier === 'silver' ? 'bg-gray-400 border-gray-600 text-gray-900' :
          'bg-orange-600 border-orange-800 text-white'
        }`}>
          {lizard.rank_tier.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
