import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface StatsTabProps {
  userId: string;
}

interface FightRecord {
  id: string;
  attacker_id: string;
  attacker_name: string;
  defender_id: string;
  defender_name: string;
  winner_id: string;
  winner_name: string;
  created_at: string;
}

export function StatsTab({ userId }: StatsTabProps) {
  const [fights, setFights] = useState<FightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  useEffect(() => {
    async function fetchFightHistory() {
      if (!userId) return;

      try {
        setLoading(true);

        // Fetch last 10 fights where user was involved
        const { data, error } = await supabase
          .from('fight_history')
          .select('*')
          .or(`attacker_id.eq.${userId},defender_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setFights(data || []);

        // Calculate wins and losses
        if (data) {
          const userWins = data.filter((f) => f.winner_id === userId).length;
          const userLosses = data.filter((f) => f.winner_id !== userId).length;
          setWins(userWins);
          setLosses(userLosses);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching fight history:', err);
        setLoading(false);
      }
    }

    fetchFightHistory();
  }, [userId]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading fight history...</div>
      </div>
    );
  }

  const winRate = fights.length > 0 ? ((wins / fights.length) * 100).toFixed(0) : '0';

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
          <span>⚔️</span>
          <span>Battle Statistics</span>
        </h2>
        <p className="text-sm text-gray-600">
          Your lizard battle history and performance
        </p>
      </div>

      {/* Win/Loss Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-700">{wins}</div>
          <div className="text-xs font-semibold text-green-600 mt-1">WINS</div>
        </div>

        <div className="bg-gradient-to-br from-red-100 to-orange-100 border-2 border-red-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-700">{losses}</div>
          <div className="text-xs font-semibold text-red-600 mt-1">LOSSES</div>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-700">{winRate}%</div>
          <div className="text-xs font-semibold text-purple-600 mt-1">WIN RATE</div>
        </div>
      </div>

      {/* Recent Fights */}
      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>📜</span>
          <span>Recent Battles ({fights.length}/10)</span>
        </h3>

        {fights.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-5xl mb-3">🦎⚔️</div>
            <div className="font-semibold">No battles yet!</div>
            <div className="text-sm mt-1">Challenge other players to start fighting</div>
          </div>
        ) : (
          <div className="space-y-2">
            {fights.map((fight) => {
              const isWin = fight.winner_id === userId;
              const isAttacker = fight.attacker_id === userId;

              return (
                <div
                  key={fight.id}
                  className={`border-2 rounded-lg p-3 ${
                    isWin
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400'
                      : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Fight Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">
                          {isWin ? '🏆' : '💀'}
                        </span>
                        <span className={`font-bold text-sm ${isWin ? 'text-green-700' : 'text-red-700'}`}>
                          {isWin ? 'VICTORY' : 'DEFEAT'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">{fight.attacker_name}</span>
                        {' vs '}
                        <span className="font-semibold">{fight.defender_name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {isAttacker ? 'You attacked' : 'You defended'} • Winner: {fight.winner_name}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-xs text-gray-500 ml-2">
                      {formatDate(fight.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
