import { useState, useEffect } from 'react';
import { Window } from './Window';
import { Button95 } from '../ui/Button95';
import { Input95 } from '../ui/Input95';
import { LoadingState } from '../ui/LoadingSkeleton';
import { useLizard, calculateLevelUpCost, calculateDailyReward } from '../../hooks/useLizard';
import { ShopTab } from '../Equipment/ShopTab';
import { EquipmentTab } from '../Equipment/EquipmentTab';
import { StatsTab } from '../Equipment/StatsTab';
import { useAuth } from '../../contexts/AuthContext';
import type { WindowState, StatIncrease } from '../../types';

interface LizardGoshiWindowProps {
  window: WindowState;
}

interface StatChangePopup {
  stat: StatIncrease;
  oldValue: number;
  newValue: number;
}

export function LizardGoshiWindow({ window }: LizardGoshiWindowProps) {
  const { user } = useAuth();
  const {
    lizard,
    loading,
    error,
    goldPerSecond,
    feedCooldownRemaining,
    canClaimDailyReward,
    equipmentStats,
    totalStats,
    createLizard,
    levelUp,
    feedLizard,
    claimDailyReward,
    updateLizardColor,
  } = useLizard();

  const [activeTab, setActiveTab] = useState<'game' | 'shop' | 'equipment' | 'stats' | 'customize'>('game');
  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupGender, setSetupGender] = useState<'male' | 'female'>('male');
  const [setupError, setSetupError] = useState('');
  const [statChangePopup, setStatChangePopup] = useState<StatChangePopup | null>(null);
  const [goldAnimation, setGoldAnimation] = useState<number | null>(null);
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  const [animatedGold, setAnimatedGold] = useState<number>(0);
  const [goldIncrement, setGoldIncrement] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !lizard && !error) {
      setShowSetup(true);
    }
  }, [loading, lizard, error]);

  // Animated gold counter
  useEffect(() => {
    if (!lizard) return;

    const targetGold = Math.floor(lizard.gold);
    const currentGold = Math.floor(animatedGold);

    if (targetGold === currentGold) return;

    const diff = targetGold - currentGold;
    const increment = diff > 0 ? Math.ceil(diff / 10) : Math.floor(diff / 10);

    const timer = setTimeout(() => {
      setAnimatedGold((prev) => {
        const next = prev + increment;
        return diff > 0 ? Math.min(next, targetGold) : Math.max(next, targetGold);
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [lizard?.gold, animatedGold]);

  // Show gold increment animation
  useEffect(() => {
    if (!lizard) return;
    setAnimatedGold(Math.floor(lizard.gold));
  }, [lizard?.id]);

  // Gold increment popup
  useEffect(() => {
    if (!lizard) return;

    const interval = setInterval(() => {
      const increment = goldPerSecond;
      if (increment > 0) {
        setGoldIncrement(increment);
        setTimeout(() => setGoldIncrement(null), 1000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [goldPerSecond]);

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
    if (!lizard) return;

    const oldStats = {
      hp: lizard.hp,
      def: lizard.def,
      atk: lizard.atk,
      crit_rate: lizard.crit_rate,
      crit_damage: lizard.crit_damage,
    };

    const result = await levelUp();

    if (result.error) {
      alert(result.error);
    } else if (result.statIncrease) {
      // Show level up effect
      setShowLevelUpEffect(true);
      setTimeout(() => setShowLevelUpEffect(false), 1500);

      // Calculate new value and show popup
      const oldValue = oldStats[result.statIncrease.stat];
      const newValue = oldValue + result.statIncrease.amount;

      setStatChangePopup({
        stat: result.statIncrease,
        oldValue,
        newValue,
      });

      setTimeout(() => setStatChangePopup(null), 4000);
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

  const handleColorChange = async (color: string) => {
    const result = await updateLizardColor(color);
    if (result.error) {
      alert(result.error);
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

  const getLizardStage = (level: number): string => {
    if (level < 10) return 'Baby';
    if (level < 25) return 'Young';
    if (level < 50) return 'Adult';
    if (level < 100) return 'Elder';
    return 'Ancient';
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
        <div className="flex flex-col h-full bg-gradient-to-br from-green-50 to-teal-50">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 border-b-2 border-gray-400">
            <div className="text-2xl font-bold mb-1">🦎 Welcome to LizardGoshi!</div>
            <div className="text-sm">Create your lizard companion</div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <form onSubmit={handleSetupSubmit} className="w-full max-w-md">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">🦎</div>
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
                      name="gender"
                      value="male"
                      checked={setupGender === 'male'}
                      onChange={(e) => setSetupGender(e.target.value as 'male' | 'female')}
                    />
                    <span>♂️ Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
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
  const lizardStage = getLizardStage(lizard.level);
  const lizardPower = Math.floor(totalStats.hp + totalStats.def * 10 + totalStats.atk * 20);

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {/* Tab Navigation */}
        <div className="flex border-b-2 border-gray-400 bg-white">
          <button
            onClick={() => setActiveTab('game')}
            className={`flex-1 px-3 py-2 font-bold text-xs border-r border-gray-400 ${
              activeTab === 'game'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            🦎 Game
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={`flex-1 px-3 py-2 font-bold text-xs border-r border-gray-400 ${
              activeTab === 'customize'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            🎨 Custom
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 px-3 py-2 font-bold text-xs border-r border-gray-400 ${
              activeTab === 'shop'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            🏪 Shop
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 px-3 py-2 font-bold text-xs border-r border-gray-400 ${
              activeTab === 'equipment'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ⚔️ Equip
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-3 py-2 font-bold text-xs ${
              activeTab === 'stats'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            📊 Stats
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'game' && (
          <div className="flex-1 relative overflow-hidden">
            {/* Level up effect overlay */}
            {showLevelUpEffect && (
              <div className="absolute inset-0 bg-yellow-400 animate-ping opacity-20 z-50 pointer-events-none" />
            )}

        {/* Stat Change Popup */}
        {statChangePopup && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-yellow-600 p-4 rounded-lg shadow-2xl animate-bounce">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">⭐ LEVEL UP! ⭐</div>
                <div className="text-xl font-bold text-yellow-900 mb-1">
                  {statChangePopup.stat.displayName}
                </div>
                <div className="flex items-center justify-center gap-2 text-lg font-bold">
                  <span className="text-red-700">{formatStat(statChangePopup.stat.stat, statChangePopup.oldValue)}</span>
                  <span className="text-green-700 text-2xl">→</span>
                  <span className="text-green-700">{formatStat(statChangePopup.stat.stat, statChangePopup.newValue)}</span>
                </div>
                <div className="text-sm text-green-800 mt-1">
                  +{formatStat(statChangePopup.stat.stat, statChangePopup.stat.amount)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-2 border-b-2 border-gray-400 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-3xl">{lizard.gender === 'male' ? '♂️' : '♀️'}</div>
              <div>
                <div className="font-bold text-lg leading-tight flex items-center gap-2">
                  {lizard.name}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                    lizard.rank_tier === 'legend' ? 'bg-purple-600' :
                    lizard.rank_tier === 'diamond' ? 'bg-cyan-500' :
                    lizard.rank_tier === 'platinum' ? 'bg-gray-300 text-gray-800' :
                    lizard.rank_tier === 'gold' ? 'bg-yellow-500 text-gray-900' :
                    lizard.rank_tier === 'silver' ? 'bg-gray-400 text-gray-900' :
                    'bg-orange-700'
                  }`}>
                    {lizard.rank_tier.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs opacity-90">
                  Lv.{lizard.level} {lizardStage} • ⚡{lizardPower.toLocaleString()} • 🏆{lizard.rank_points}
                </div>
              </div>
            </div>
            <div className="text-right relative">
              <div className="text-2xl font-bold leading-tight">{animatedGold.toLocaleString()}</div>
              <div className="text-xs opacity-90">💰 Gold</div>
              {goldIncrement && (
                <div className="absolute -top-4 right-0 text-sm font-bold text-yellow-300 animate-bounce">
                  +{goldIncrement.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3">
            {/* LEFT COLUMN */}
            <div className="space-y-3">
              {/* Lizard Display */}
              <div className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-100 to-teal-100 p-3 rounded shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-2 py-1 text-xs font-bold rounded-bl">
                  {lizardStage}
                </div>
                <div className="text-center">
                  <div
                    className={`text-7xl mb-1 transform hover:scale-110 transition-transform cursor-pointer inline-block p-2 rounded-full ${
                      lizard.color === 'green' ? 'bg-green-200 border-2 border-green-500' :
                      lizard.color === 'red' ? 'bg-red-200 border-2 border-red-500' :
                      lizard.color === 'blue' ? 'bg-blue-200 border-2 border-blue-500' :
                      lizard.color === 'purple' ? 'bg-purple-200 border-2 border-purple-500' :
                      lizard.color === 'gold' ? 'bg-yellow-200 border-2 border-yellow-500' :
                      lizard.color === 'pink' ? 'bg-pink-200 border-2 border-pink-500' :
                      lizard.color === 'cyan' ? 'bg-cyan-200 border-2 border-cyan-500' :
                      lizard.color === 'orange' ? 'bg-orange-200 border-2 border-orange-500' :
                      lizard.color === 'indigo' ? 'bg-indigo-200 border-2 border-indigo-500' :
                      'bg-green-200 border-2 border-green-500'
                    }`}
                  >
                    🦎
                  </div>
                  <div className="text-xs font-bold text-emerald-800">
                    +{goldPerSecond.toFixed(1)} 💰/sec
                    {lizard.is_fed && feedCooldownRemaining > 0 && (
                      <div className="text-orange-600 mt-1">🔥 2X BOOST!</div>
                    )}
                  </div>
                </div>
                {goldAnimation && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-yellow-600 animate-ping">
                    +{goldAnimation}💰
                  </div>
                )}
              </div>

              {/* Stats Panel */}
              <div className="border-2 border-gray-400 bg-white p-2 rounded shadow">
                <div className="text-xs font-bold mb-2 text-center border-b border-gray-300 pb-1">
                  📊 COMBAT STATS
                </div>
                <div className="space-y-1 text-xs">
                  <div className="bg-red-50 px-2 py-1 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-red-600">❤️ HP</span>
                      <span className="font-bold text-green-700">{Math.floor(totalStats.hp)}</span>
                    </div>
                    {equipmentStats.hp > 0 && (
                      <div className="text-gray-500 text-[10px] flex justify-between">
                        <span>{Math.floor(lizard.hp)} + {Math.floor(equipmentStats.hp)}</span>
                        <span>⚔️</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-blue-50 px-2 py-1 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-600">🛡️ DEF</span>
                      <span className="font-bold text-green-700">{Math.floor(totalStats.def)}</span>
                    </div>
                    {equipmentStats.def > 0 && (
                      <div className="text-gray-500 text-[10px] flex justify-between">
                        <span>{Math.floor(lizard.def)} + {Math.floor(equipmentStats.def)}</span>
                        <span>⚔️</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-orange-50 px-2 py-1 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-orange-600">⚔️ ATK</span>
                      <span className="font-bold text-green-700">{Math.floor(totalStats.atk)}</span>
                    </div>
                    {equipmentStats.atk > 0 && (
                      <div className="text-gray-500 text-[10px] flex justify-between">
                        <span>{Math.floor(lizard.atk)} + {Math.floor(equipmentStats.atk)}</span>
                        <span>⚔️</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-purple-50 px-2 py-1 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-600">💥 CRIT</span>
                      <span className="font-bold text-green-700">{formatStat('rate', totalStats.crit_rate)}</span>
                    </div>
                    {equipmentStats.crit_rate > 0 && (
                      <div className="text-gray-500 text-[10px] flex justify-between">
                        <span>{formatStat('rate', lizard.crit_rate)} + {formatStat('rate', equipmentStats.crit_rate)}</span>
                        <span>⚔️</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-purple-50 px-2 py-1 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-600">💢 C.DMG</span>
                      <span className="font-bold text-green-700">{formatStat('damage', totalStats.crit_damage)}</span>
                    </div>
                    {equipmentStats.crit_damage > 0 && (
                      <div className="text-gray-500 text-[10px] flex justify-between">
                        <span>{formatStat('damage', lizard.crit_damage)} + {formatStat('damage', equipmentStats.crit_damage)}</span>
                        <span>⚔️</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="border-2 border-gray-400 bg-gradient-to-br from-purple-50 to-pink-50 p-2 rounded shadow">
                <div className="text-xs font-bold mb-2 text-center border-b border-gray-300 pb-1">
                  📈 PROGRESS
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="text-center bg-white p-1 rounded">
                    <div className="text-gray-600">Total Gold</div>
                    <div className="font-bold text-yellow-700">{lizard.total_gold_earned.toLocaleString()}</div>
                  </div>
                  <div className="text-center bg-white p-1 rounded">
                    <div className="text-gray-600">Messages</div>
                    <div className="font-bold text-blue-700">{lizard.messages_sent}</div>
                  </div>
                  <div className="text-center bg-white p-1 rounded">
                    <div className="text-gray-600">Levels</div>
                    <div className="font-bold text-green-700">{lizard.total_levels_gained}</div>
                  </div>
                  <div className="text-center bg-white p-1 rounded">
                    <div className="text-gray-600">Streak</div>
                    <div className="font-bold text-purple-700">{lizard.login_streak}/7</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3">
              {/* Level Up Card */}
              <div className={`border-2 ${canLevelUp ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' : 'border-gray-400 bg-gray-50'} p-2 rounded shadow`}>
                <div className="text-xs font-bold mb-2 flex items-center justify-between">
                  <span>⬆️ LEVEL UP</span>
                  <span className="text-yellow-700">{levelUpCost.toLocaleString()} 💰</span>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-300 h-3 border border-gray-600 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all ${canLevelUp ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-yellow-400 to-orange-400'}`}
                      style={{ width: `${Math.min((lizard.gold / levelUpCost) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-center mt-1 text-gray-600">
                    {Math.floor(lizard.gold)} / {levelUpCost}
                  </div>
                </div>
                <Button95
                  onClick={handleLevelUp}
                  disabled={!canLevelUp}
                  className="w-full font-bold text-sm"
                >
                  {canLevelUp ? '⭐ LEVEL UP!' : '🔒 Need Gold'}
                </Button95>
                <div className="text-xs text-gray-600 mt-1 text-center">
                  Random stat boost + 0.1 💰/s
                </div>
              </div>

              {/* Feed Card */}
              <div className={`border-2 ${feedCooldownRemaining > 0 ? 'border-gray-400 bg-gray-50' : 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50'} p-2 rounded shadow`}>
                <div className="text-xs font-bold mb-2">
                  🍖 FEED LIZARD
                </div>
                <Button95
                  onClick={handleFeed}
                  disabled={feedCooldownRemaining > 0}
                  className="w-full font-bold text-sm"
                >
                  {feedCooldownRemaining > 0
                    ? `⏳ ${formatTime(feedCooldownRemaining)}`
                    : '🍖 FEED NOW'}
                </Button95>
                <div className="text-xs text-gray-600 mt-1 text-center">
                  2X income for 12 hours
                </div>
              </div>

              {/* Daily Streak Card */}
              <div className="border-2 border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 p-2 rounded shadow">
                <div className="text-xs font-bold mb-2 flex items-center justify-between">
                  <span>📅 DAILY STREAK</span>
                  <span className="text-green-700">+{nextDailyReward} 💰</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                      key={day}
                      className={`flex-1 h-6 border flex items-center justify-center text-xs font-bold rounded ${
                        day <= lizard.login_streak
                          ? 'bg-gradient-to-b from-green-400 to-green-600 border-green-700 text-white'
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
                  className="w-full font-bold text-sm"
                >
                  {canClaimDailyReward ? '🎁 CLAIM!' : '✓ Claimed'}
                </Button95>
                <div className="text-xs text-gray-600 mt-1 text-center">
                  Resets after 36h inactivity
                </div>
              </div>
            </div>
          </div>
        </div>

            {/* Footer Info */}
            <div className="border-t-2 border-gray-400 p-1 bg-gradient-to-r from-emerald-100 to-teal-100">
              <div className="text-xs text-gray-700 text-center font-bold">
                💬 Chat messages = +100 gold each! | 💤 Gold accumulates offline
              </div>
            </div>
          </div>
        )}

        {/* Shop Tab */}
        {activeTab === 'shop' && user && (
          <ShopTab userId={user.id} userGold={lizard.gold} />
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && user && (
          <EquipmentTab userId={user.id} userGold={lizard.gold} />
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && user && (
          <StatsTab userId={user.id} />
        )}

        {/* Customize Tab */}
        {activeTab === 'customize' && (
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Color Selection */}
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-pink-300">
                <div className="text-lg font-bold mb-3 text-pink-700 flex items-center gap-2">
                  <span>🎨</span> Lizard Color
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { name: 'Green', value: 'green', bg: 'bg-green-500', border: 'border-green-600' },
                    { name: 'Red', value: 'red', bg: 'bg-red-500', border: 'border-red-600' },
                    { name: 'Blue', value: 'blue', bg: 'bg-blue-500', border: 'border-blue-600' },
                    { name: 'Purple', value: 'purple', bg: 'bg-purple-500', border: 'border-purple-600' },
                    { name: 'Gold', value: 'gold', bg: 'bg-yellow-500', border: 'border-yellow-600' },
                    { name: 'Pink', value: 'pink', bg: 'bg-pink-500', border: 'border-pink-600' },
                    { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-600' },
                    { name: 'Orange', value: 'orange', bg: 'bg-orange-500', border: 'border-orange-600' },
                    { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-600' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorChange(color.value)}
                      className={`${color.bg} ${color.border} ${
                        lizard.color === color.value ? 'ring-4 ring-yellow-400' : ''
                      } border-4 rounded-lg p-4 font-bold text-white text-sm shadow-lg hover:scale-105 transition-transform flex flex-col items-center gap-2`}
                    >
                      <div className="text-3xl">🦎</div>
                      <div>{color.name}</div>
                      {lizard.color === color.value && (
                        <div className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded">
                          ✓ Active
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-gray-600 text-center bg-pink-50 p-2 rounded">
                  💡 Choose your lizard's color! More customization options coming soon...
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-6 rounded-lg shadow-md border-4 border-emerald-400">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-700 mb-2">Preview</div>
                  <div
                    className={`text-9xl inline-block p-4 rounded-full ${
                      lizard.color === 'green' ? 'bg-green-200' :
                      lizard.color === 'red' ? 'bg-red-200' :
                      lizard.color === 'blue' ? 'bg-blue-200' :
                      lizard.color === 'purple' ? 'bg-purple-200' :
                      lizard.color === 'gold' ? 'bg-yellow-200' :
                      lizard.color === 'pink' ? 'bg-pink-200' :
                      lizard.color === 'cyan' ? 'bg-cyan-200' :
                      lizard.color === 'orange' ? 'bg-orange-200' :
                      lizard.color === 'indigo' ? 'bg-indigo-200' :
                      'bg-green-200'
                    } shadow-xl border-4 ${
                      lizard.color === 'green' ? 'border-green-500' :
                      lizard.color === 'red' ? 'border-red-500' :
                      lizard.color === 'blue' ? 'border-blue-500' :
                      lizard.color === 'purple' ? 'border-purple-500' :
                      lizard.color === 'gold' ? 'border-yellow-500' :
                      lizard.color === 'pink' ? 'border-pink-500' :
                      lizard.color === 'cyan' ? 'border-cyan-500' :
                      lizard.color === 'orange' ? 'border-orange-500' :
                      lizard.color === 'indigo' ? 'border-indigo-500' :
                      'border-green-500'
                    }`}
                  >
                    🦎
                  </div>
                  <div className="mt-4 text-xl font-bold text-gray-800">{lizard.name}</div>
                  <div className="text-sm text-gray-600">Level {lizard.level} • {lizardStage}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Window>
  );
}
