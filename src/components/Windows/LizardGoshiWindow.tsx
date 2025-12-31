import { useState, useEffect } from 'react';
import { Window } from './Window';
import { Button95 } from '../ui/Button95';
import { Input95 } from '../ui/Input95';
import { LoadingState } from '../ui/LoadingSkeleton';
import { useLizard, calculateLevelUpCost, calculateDailyReward } from '../../hooks/useLizard';
import type { WindowState, StatIncrease } from '../../types';

interface LizardGoshiWindowProps {
  window: WindowState;
}

export function LizardGoshiWindow({ window }: LizardGoshiWindowProps) {
  const {
    lizard,
    loading,
    error,
    goldPerSecond,
    feedCooldownRemaining,
    canClaimDailyReward,
    createLizard,
    levelUp,
    feedLizard,
    claimDailyReward,
  } = useLizard();

  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupGender, setSetupGender] = useState<'male' | 'female'>('male');
  const [setupError, setSetupError] = useState('');
  const [levelUpAnimation, setLevelUpAnimation] = useState<StatIncrease | null>(null);
  const [goldAnimation, setGoldAnimation] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !lizard && !error) {
      setShowSetup(true);
    }
  }, [loading, lizard, error]);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) {
      setSetupError('Please enter a name for your lizard');
      return;
    }

    const result = await createLizard(setupName.trim(), setupGender);
    if (result.error) {
      setSetupError(result.error);
    } else {
      setShowSetup(false);
    }
  };

  const handleLevelUp = async () => {
    const result = await levelUp();
    if (result.error) {
      alert(result.error);
    } else if (result.statIncrease) {
      // Show level up animation
      setLevelUpAnimation(result.statIncrease);
      setTimeout(() => setLevelUpAnimation(null), 3000);
    }
  };

  const handleFeed = async () => {
    const result = await feedLizard();
    if (result.error) {
      alert(result.error);
    }
  };

  const handleClaimDaily = async () => {
    const result = await claimDailyReward();
    if (result.error) {
      alert(result.error);
    } else if (result.reward) {
      setGoldAnimation(result.reward);
      setTimeout(() => setGoldAnimation(null), 2000);
    }
  };

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const formatStat = (stat: string, value: number): string => {
    if (stat.includes('rate') || stat.includes('damage')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(0);
  };

  if (loading) {
    return (
      <Window window={window}>
        <LoadingState message="Loading your lizard..." />
      </Window>
    );
  }

  if (error) {
    return (
      <Window window={window}>
        <div className="flex flex-col h-full items-center justify-center p-4 bg-white">
          <div className="text-red-600 font-bold mb-2">⚠️ Error</div>
          <div className="text-sm text-center">{error}</div>
        </div>
      </Window>
    );
  }

  // First-time setup
  if (showSetup) {
    return (
      <Window window={window}>
        <div className="flex flex-col h-full bg-white">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 border-b-2 border-gray-400">
            <div className="text-2xl font-bold mb-1">🦎 Welcome to LizardGoshi!</div>
            <div className="text-sm">Create your lizard companion</div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <form onSubmit={handleSetupSubmit} className="w-full max-w-md">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🦎</div>
                <div className="text-xl font-bold mb-2">Name Your Lizard</div>
                <div className="text-sm text-gray-600">
                  Your lizard will earn passive gold and grow stronger over time!
                </div>
              </div>

              <div className="field-row-stacked mb-4">
                <label className="font-bold">Lizard Name:</label>
                <Input95
                  type="text"
                  value={setupName}
                  onChange={(e) => {
                    setSetupName(e.target.value);
                    setSetupError('');
                  }}
                  placeholder="Enter a cool name..."
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div className="field-row-stacked mb-6">
                <label className="font-bold">Gender:</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="male"
                      checked={setupGender === 'male'}
                      onChange={(e) => setSetupGender(e.target.value as 'male' | 'female')}
                    />
                    <span>♂️ Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="female"
                      checked={setupGender === 'female'}
                      onChange={(e) => setSetupGender(e.target.value as 'male' | 'female')}
                    />
                    <span>♀️ Female</span>
                  </label>
                </div>
              </div>

              {setupError && (
                <div className="mb-4 text-sm text-red-600 bg-red-100 border border-red-400 p-2">
                  {setupError}
                </div>
              )}

              <Button95 type="submit" className="w-full font-bold">
                🎮 Create Lizard
              </Button95>
            </form>
          </div>
        </div>
      </Window>
    );
  }

  if (!lizard) return null;

  const levelUpCost = calculateLevelUpCost(lizard.level);
  const canLevelUp = lizard.gold >= levelUpCost;
  const nextDailyReward = lizard.login_streak < 7 ? calculateDailyReward(lizard.login_streak + 1) : calculateDailyReward(7);

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-3 border-b-2 border-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">
                🦎 {lizard.name} {lizard.gender === 'male' ? '♂️' : '♀️'}
              </div>
              <div className="text-xs opacity-90">Level {lizard.level} Lizard</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.floor(lizard.gold).toLocaleString()}</div>
              <div className="text-xs opacity-90">💰 Gold</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Gold Income Display */}
          <div className="bg-yellow-100 border-2 border-yellow-600 p-3 mb-4 relative">
            <div className="text-center">
              <div className="text-sm font-bold text-yellow-800 mb-1">
                Passive Income
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                +{goldPerSecond.toFixed(1)} 💰/s
              </div>
              {lizard.is_fed && feedCooldownRemaining > 0 && (
                <div className="text-xs text-green-700 font-bold mt-1">
                  🔥 2X BOOST ACTIVE! {formatTime(feedCooldownRemaining)}
                </div>
              )}
            </div>
            {goldAnimation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-green-600 animate-bounce">
                +{goldAnimation} 💰
              </div>
            )}
          </div>

          {/* Lizard Sprite */}
          <div className="text-center mb-4 relative">
            <div className="text-9xl mb-2 inline-block relative">
              🦎
              {levelUpAnimation && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-green-600 bg-green-100 border-2 border-green-600 px-3 py-1 rounded animate-bounce">
                  +{levelUpAnimation.amount} {levelUpAnimation.displayName}!
                </div>
              )}
            </div>
            <div className="text-xs text-gray-600">
              {lizard.level < 10 && 'Baby Lizard'}
              {lizard.level >= 10 && lizard.level < 25 && 'Young Lizard'}
              {lizard.level >= 25 && lizard.level < 50 && 'Adult Lizard'}
              {lizard.level >= 50 && lizard.level < 100 && 'Elder Lizard'}
              {lizard.level >= 100 && 'Ancient Lizard'}
            </div>
          </div>

          {/* Stats Panel */}
          <div className="border-2 border-gray-400 p-3 mb-4 bg-gray-50">
            <div className="font-bold text-sm mb-2 text-center border-b-2 border-gray-400 pb-1">
              📊 STATS
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="font-bold text-red-600">❤️ HP:</span>
                <span>{lizard.hp}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-blue-600">🛡️ DEF:</span>
                <span>{lizard.def}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-orange-600">⚔️ ATK:</span>
                <span>{lizard.atk}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-purple-600">💥 CRIT:</span>
                <span>{formatStat('rate', lizard.crit_rate)}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="font-bold text-purple-600">💢 CRIT DMG:</span>
                <span>{formatStat('damage', lizard.crit_damage)}</span>
              </div>
            </div>
          </div>

          {/* Level Up Section */}
          <div className="border-2 border-gray-400 p-3 mb-4 bg-gray-50">
            <div className="font-bold text-sm mb-2">⬆️ Level Up</div>
            <div className="mb-2">
              <div className="text-xs text-gray-600 mb-1">
                Cost: {levelUpCost.toLocaleString()} 💰
              </div>
              <div className="w-full bg-gray-300 h-4 border border-gray-600">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${Math.min((lizard.gold / levelUpCost) * 100, 100)}%` }}
                />
              </div>
            </div>
            <Button95
              onClick={handleLevelUp}
              disabled={!canLevelUp}
              className="w-full font-bold"
            >
              {canLevelUp ? '⬆️ LEVEL UP!' : '🔒 Need More Gold'}
            </Button95>
            <div className="text-xs text-gray-600 mt-1 text-center">
              Random stat will increase!
            </div>
          </div>

          {/* Feed Button */}
          <div className="border-2 border-gray-400 p-3 mb-4 bg-gray-50">
            <div className="font-bold text-sm mb-2">🍖 Feed Lizard</div>
            <Button95
              onClick={handleFeed}
              disabled={feedCooldownRemaining > 0}
              className="w-full font-bold"
            >
              {feedCooldownRemaining > 0
                ? `⏳ ${formatTime(feedCooldownRemaining)}`
                : '🍖 FEED (2X Income for 12h)'}
            </Button95>
            <div className="text-xs text-gray-600 mt-1 text-center">
              Doubles passive income for 12 hours!
            </div>
          </div>

          {/* Daily Login Streak */}
          <div className="border-2 border-gray-400 p-3 mb-4 bg-gradient-to-r from-purple-100 to-pink-100">
            <div className="font-bold text-sm mb-2">📅 Daily Login Streak</div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm">
                <span className="font-bold">Day {lizard.login_streak}</span> Streak
              </div>
              <div className="text-sm font-bold text-green-600">
                Next: +{nextDailyReward} 💰
              </div>
            </div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  className={`flex-1 h-8 border-2 flex items-center justify-center text-xs font-bold ${
                    day <= lizard.login_streak
                      ? 'bg-green-500 border-green-700 text-white'
                      : 'bg-gray-200 border-gray-400 text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <Button95
              onClick={handleClaimDaily}
              disabled={!canClaimDailyReward}
              className="w-full font-bold"
            >
              {canClaimDailyReward ? '🎁 CLAIM REWARD' : '✓ Claimed Today'}
            </Button95>
            <div className="text-xs text-gray-600 mt-1 text-center">
              Login daily to maintain streak! (Resets after 36h)
            </div>
          </div>

          {/* Stats Summary */}
          <div className="border-2 border-gray-400 p-3 bg-gray-50">
            <div className="font-bold text-sm mb-2">📈 Progress</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Total Gold Earned:</span>
                <div className="font-bold">{lizard.total_gold_earned.toLocaleString()} 💰</div>
              </div>
              <div>
                <span className="text-gray-600">Messages Sent:</span>
                <div className="font-bold">{lizard.messages_sent} 💬</div>
              </div>
              <div>
                <span className="text-gray-600">Total Levels:</span>
                <div className="font-bold">{lizard.total_levels_gained} ⬆️</div>
              </div>
              <div>
                <span className="text-gray-600">Lizard Power:</span>
                <div className="font-bold text-purple-600">
                  {(lizard.hp + lizard.def * 10 + lizard.atk * 20).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t-2 border-gray-400 p-2 bg-win95-gray">
          <div className="text-xs text-gray-700 text-center">
            💬 Send messages in chat to earn +100 gold each!
          </div>
        </div>
      </div>
    </Window>
  );
}
