import { useLizard } from '../../hooks/useLizard';
import { useAuth } from '../../contexts/AuthContext';

export function TopBar() {
  const { user } = useAuth();
  const { lizard, loading } = useLizard();

  if (!user || loading || !lizard) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-10 bg-win95-gray border-b-2 border-t-white border-l-white border-r-gray-800 border-b-gray-800 z-50 flex items-center justify-between px-3" style={{ boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.7), inset -1px -1px 0px rgba(0,0,0,0.3)' }}>
      {/* Left Side - Lizard Info */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white border-2 border-t-gray-800 border-l-gray-800 border-r-white border-b-white px-3 py-1" style={{ boxShadow: 'inset -1px -1px 0px rgba(255,255,255,0.7), inset 1px 1px 0px rgba(0,0,0,0.5)' }}>
          <span className="text-lg">🦎</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{lizard.name}</span>
            <span className="text-xs text-gray-600">Lv.{lizard.level}</span>
          </div>
        </div>
      </div>

      {/* Center - Gold Display */}
      <div className="flex items-center gap-2 bg-white border-2 border-t-gray-800 border-l-gray-800 border-r-white border-b-white px-4 py-1" style={{ boxShadow: 'inset -1px -1px 0px rgba(255,255,255,0.7), inset 1px 1px 0px rgba(0,0,0,0.5)' }}>
        <span className="text-lg">💰</span>
        <span className="text-sm font-bold text-gray-900">
          {Math.floor(lizard.gold).toLocaleString()}
        </span>
        <span className="text-xs text-gray-600">G</span>
      </div>

      {/* Right Side - Rank Display */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white border-2 border-t-gray-800 border-l-gray-800 border-r-white border-b-white px-3 py-1" style={{ boxShadow: 'inset -1px -1px 0px rgba(255,255,255,0.7), inset 1px 1px 0px rgba(0,0,0,0.5)' }}>
          <span className="text-lg">🏆</span>
          <span className="text-xs text-gray-600">RP:</span>
          <span className="text-sm font-bold text-gray-900">{lizard.rank_points.toLocaleString()}</span>
        </div>

        <div className="bg-win95-gray border-2 border-t-white border-l-white border-r-gray-800 border-b-gray-800 px-3 py-1">
          <span className={`text-xs font-bold ${
            lizard.rank_tier === 'legend' ? 'text-purple-700' :
            lizard.rank_tier === 'diamond' ? 'text-cyan-600' :
            lizard.rank_tier === 'platinum' ? 'text-gray-600' :
            lizard.rank_tier === 'gold' ? 'text-yellow-700' :
            lizard.rank_tier === 'silver' ? 'text-gray-500' :
            'text-orange-700'
          }`}>
            {lizard.rank_tier.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
