import { useTalents } from '../../hooks/useTalents';

const TALENT_DATA = {
  money_tree: {
    name: '💰 Money Tree',
    color: 'from-yellow-500 to-green-500',
    levels: [
      { cost: 1, bonus: '+1 Gold/s' },
      { cost: 2, bonus: '+2 Gold/s' },
      { cost: 3, bonus: '+5 Gold/s' },
      { cost: 4, bonus: '+10 Gold/s' },
      { cost: 5, bonus: '+20 Gold/s' },
      { cost: 6, bonus: '+100 Gold/s' },
      { cost: 7, bonus: '+500 Gold/s' },
      { cost: 8, bonus: '+1000 Gold/s' },
      { cost: 9, bonus: '+5000 Gold/s' },
      { cost: 10, bonus: '+10000 Gold/s' },
    ],
  },
  shop_tree: {
    name: '🏪 Shop Tree',
    color: 'from-purple-500 to-pink-500',
    levels: [
      { cost: 1, bonus: '+1 shop item' },
      { cost: 2, bonus: '+1 shop item' },
      { cost: 3, bonus: '2x legendary odds' },
      { cost: 4, bonus: '-1min shop cooldown' },
      { cost: 5, bonus: '2x epic/leg/myth odds' },
      { cost: 6, bonus: 'Higher level gear' },
      { cost: 7, bonus: 'No gear below lvl 10' },
      { cost: 8, bonus: '-30s shop cooldown' },
      { cost: 9, bonus: '2x epic/leg/myth odds' },
      { cost: 10, bonus: '2x epic/leg/myth odds' },
    ],
  },
  def_build: {
    name: '🛡️ Defense Build',
    color: 'from-blue-500 to-cyan-500',
    levels: [
      { cost: 1, bonus: '+10 DEF, +10 HP' },
      { cost: 2, bonus: '+100 HP, +10 Regen/s' },
      { cost: 3, bonus: '+250 HP, +20 DEF' },
      { cost: 4, bonus: '+500 HP, +200 DEF' },
      { cost: 5, bonus: '+1000 HP, +200 DEF, +50 Regen/s' },
      { cost: 6, bonus: 'Divine Shield (reflect)' },
      { cost: 7, bonus: '+4000 HP' },
      { cost: 8, bonus: '+200 DEF' },
      { cost: 9, bonus: '+50 Regen/s' },
      { cost: 10, bonus: '+10000 HP, +1000 DEF' },
    ],
  },
  dmg_build: {
    name: '⚔️ Damage Build',
    color: 'from-red-500 to-orange-500',
    levels: [
      { cost: 1, bonus: '+10 ATK, +10% Crit Rate' },
      { cost: 2, bonus: '+15 ATK, +20% Crit DMG' },
      { cost: 3, bonus: '+20 ATK, +20% Crit DMG' },
      { cost: 4, bonus: '+35 ATK, +5% Crit Rate' },
      { cost: 5, bonus: '+40 ATK, +20% Crit DMG, +5% Crit Rate' },
      { cost: 6, bonus: '10% Double Hit chance' },
      { cost: 7, bonus: '+20% Attack Speed' },
      { cost: 8, bonus: '+50 ATK' },
      { cost: 9, bonus: '+50% Crit DMG' },
      { cost: 10, bonus: '+50% Crit DMG, +15% Crit Rate' },
    ],
  },
};

export function TalentsTab() {
  const { talents, availablePoints, loading, allocateTalentPoint, resetAllTalents, getTalentStats } = useTalents();

  const stats = getTalentStats();

  const handleAllocate = async (tree: string) => {
    const result = await allocateTalentPoint(tree as any);
    if (result.error) {
      alert(result.error);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset ALL talents? You will get all points back.')) return;
    const result = await resetAllTalents();
    if (result.error) {
      alert(result.error);
    }
  };

  if (loading || !talents) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading talents...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
            <span>🌳</span>
            <span>Talent Tree</span>
          </h2>
          <p className="text-sm text-gray-600">Customize your lizard's abilities!</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="text-xs">Available Points</div>
            <div className="text-3xl font-black">{availablePoints}</div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition-colors text-sm"
          >
            🔄 Reset All Talents
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 border-2 border-purple-300">
        <div className="text-sm font-bold mb-2 text-purple-700">📊 Talent Bonuses</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {stats.gold_per_second > 0 && <div>💰 +{stats.gold_per_second}/s</div>}
          {stats.hp > 0 && <div>❤️ +{stats.hp} HP</div>}
          {stats.def > 0 && <div>🛡️ +{stats.def} DEF</div>}
          {stats.atk > 0 && <div>⚔️ +{stats.atk} ATK</div>}
          {stats.crit_rate > 0 && <div>🎯 +{(stats.crit_rate * 100).toFixed(0)}% Crit Rate</div>}
          {stats.crit_damage > 0 && <div>💥 +{(stats.crit_damage * 100).toFixed(0)}% Crit DMG</div>}
          {stats.regeneration > 0 && <div>💚 +{stats.regeneration}/s Regen</div>}
          {stats.attack_speed > 0 && <div>⚡ +{(stats.attack_speed * 100).toFixed(0)}% Speed</div>}
        </div>
      </div>

      {/* Talent Trees */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4">
        {Object.entries(TALENT_DATA).map(([key, tree]) => {
          const currentLevel = talents[`${key}_level` as keyof typeof talents] as number;
          const totalCost = tree.levels.slice(0, currentLevel).reduce((sum, l) => sum + l.cost, 0);

          return (
            <div key={key} className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-300">
              <div className={`text-lg font-bold mb-3 bg-gradient-to-r ${tree.color} text-white p-2 rounded`}>
                {tree.name}
              </div>
              <div className="text-xs text-gray-600 mb-3">
                Level {currentLevel}/10 • {totalCost} points spent
              </div>

              <div className="space-y-2">
                {tree.levels.map((level, idx) => {
                  const isUnlocked = idx < currentLevel;
                  const isNext = idx === currentLevel;
                  const canAfford = availablePoints >= level.cost;

                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded border-2 ${
                        isUnlocked ? 'bg-green-100 border-green-500' :
                        isNext && canAfford ? 'bg-yellow-100 border-yellow-500' :
                        'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex-1">
                          <div className="font-bold">Lvl {idx + 1}</div>
                          <div className="text-gray-700">{level.bonus}</div>
                        </div>
                        <div>
                          {isUnlocked ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : isNext ? (
                            <button
                              onClick={() => handleAllocate(key)}
                              disabled={!canAfford}
                              className={`px-2 py-1 rounded font-bold text-xs ${
                                canAfford
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                              }`}
                            >
                              {level.cost}pt
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">🔒 {level.cost}pt</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
