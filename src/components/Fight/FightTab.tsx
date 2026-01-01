import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useWindowManager } from '../../contexts/WindowContext';

interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  rank_points: number;
  rank_tier: string;
  color: string;
}

interface FightTabProps {
  currentLizardId: string;
  currentLizardName: string;
}

export function FightTab({ currentLizardId }: FightTabProps) {
  const { openWindow } = useWindowManager();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('lizards')
        .select('id, name, level, rank_points, rank_tier, color')
        .order('rank_points', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setLeaderboard(data || []);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFightRandom = async () => {
    try {
      // Get a random lizard that's not the current user
      const { data, error: fetchError } = await supabase
        .from('lizards')
        .select('id, name')
        .neq('id', currentLizardId)
        .limit(100);

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        alert('No other lizards found to fight!');
        return;
      }

      // Pick a random one
      const randomIndex = Math.floor(Math.random() * data.length);
      const opponent = data[randomIndex];

      // Open fight window
      openWindow('lizardFight', {
        attacker: currentLizardId,
        defender: opponent.id,
      });
    } catch (err: any) {
      console.error('Error finding random opponent:', err);
      alert('Failed to find opponent: ' + err.message);
    }
  };

  const handleFightLizard = (defenderId: string) => {
    if (defenderId === currentLizardId) {
      alert("You can't fight yourself!");
      return;
    }

    openWindow('lizardFight', {
      attacker: currentLizardId,
      defender: defenderId,
    });
  };

  const getRankBadgeColor = (tier: string): string => {
    switch (tier) {
      case 'legend': return 'bg-purple-600';
      case 'diamond': return 'bg-cyan-500';
      case 'platinum': return 'bg-gray-300 text-gray-800';
      case 'gold': return 'bg-yellow-500 text-gray-900';
      case 'silver': return 'bg-gray-400 text-gray-900';
      default: return 'bg-orange-700';
    }
  };

  const currentUserRank = leaderboard.findIndex(entry => entry.id === currentLizardId) + 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header with Random Fight Button */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2">
              <span>⚔️</span>
              <span>Lizard Arena</span>
            </h2>
            <p className="text-sm text-gray-600">Challenge other lizards to battle!</p>
          </div>
          <button
            onClick={handleFightRandom}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-lg transition-all hover:scale-105"
          >
            🎲 Fight Random Lizard
          </button>
        </div>

        {currentUserRank > 0 && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-500 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-gray-700">
                Your Rank: <span className="text-2xl text-orange-600">#{currentUserRank}</span>
              </div>
              <div className="text-sm text-gray-600">
                Keep fighting to climb the ranks!
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 mb-4">
          <div className="text-red-700 font-bold">Error: {error}</div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-700">
            🏆 Top Fighters
          </h3>
          <button
            onClick={fetchLeaderboard}
            className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded font-bold"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-lg border-2 border-gray-300">
          {leaderboard.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">🦎</div>
                <div>No fighters yet</div>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Lizard</th>
                  <th className="px-4 py-3 text-center text-sm font-bold">Level</th>
                  <th className="px-4 py-3 text-center text-sm font-bold">Tier</th>
                  <th className="px-4 py-3 text-center text-sm font-bold">Points</th>
                  <th className="px-4 py-3 text-center text-sm font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.id === currentLizardId;
                  const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        isCurrentUser ? 'bg-yellow-50 font-bold' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700">#{index + 1}</span>
                          {rankEmoji && <span className="text-xl">{rankEmoji}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-2xl ${
                              entry.color === 'green' ? 'bg-green-200' :
                              entry.color === 'red' ? 'bg-red-200' :
                              entry.color === 'blue' ? 'bg-blue-200' :
                              entry.color === 'purple' ? 'bg-purple-200' :
                              entry.color === 'gold' ? 'bg-yellow-200' :
                              entry.color === 'pink' ? 'bg-pink-200' :
                              entry.color === 'cyan' ? 'bg-cyan-200' :
                              entry.color === 'orange' ? 'bg-orange-200' :
                              entry.color === 'indigo' ? 'bg-indigo-200' :
                              'bg-green-200'
                            } rounded-full p-1 border-2 ${
                              entry.color === 'green' ? 'border-green-500' :
                              entry.color === 'red' ? 'border-red-500' :
                              entry.color === 'blue' ? 'border-blue-500' :
                              entry.color === 'purple' ? 'border-purple-500' :
                              entry.color === 'gold' ? 'border-yellow-500' :
                              entry.color === 'pink' ? 'border-pink-500' :
                              entry.color === 'cyan' ? 'border-cyan-500' :
                              entry.color === 'orange' ? 'border-orange-500' :
                              entry.color === 'indigo' ? 'border-indigo-500' :
                              'border-green-500'
                            }`}
                          >
                            🦎
                          </div>
                          <span className="text-sm font-semibold">
                            {entry.name}
                            {isCurrentUser && <span className="text-yellow-600"> (You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                        {entry.level}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded font-bold ${getRankBadgeColor(entry.rank_tier)}`}>
                          {entry.rank_tier.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-purple-600">
                        {entry.rank_points.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isCurrentUser ? (
                          <span className="text-xs text-gray-500">-</span>
                        ) : (
                          <button
                            onClick={() => handleFightLizard(entry.id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded transition-colors"
                          >
                            ⚔️ Fight
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
