import { useState, useEffect, useRef } from 'react';
import { Window } from './Window';
import { supabase } from '../../lib/supabase';
import type { WindowState, Lizard } from '../../types';

interface LizardFightWindowProps {
  window: WindowState;
}

interface FighterStats {
  lizard: Lizard;
  currentHp: number;
  maxHp: number;
  position: number;
}

interface DamageNumber {
  id: number;
  amount: number;
  x: number;
  y: number;
  isCrit: boolean;
}

export function LizardFightWindow({ window }: LizardFightWindowProps) {
  const attackerId = window.data?.attacker;
  const defenderId = window.data?.defender;

  const [attacker, setAttacker] = useState<FighterStats | null>(null);
  const [defender, setDefender] = useState<FighterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fightStarted, setFightStarted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const damageIdRef = useRef(0);

  // Fetch both lizards with equipment stats
  useEffect(() => {
    async function fetchFighters() {
      if (!attackerId || !defenderId) return;

      try {
        // Fetch both lizards
        const { data: lizards, error } = await supabase
          .from('lizards')
          .select('*')
          .in('id', [attackerId, defenderId]);

        if (error) throw error;

        if (!lizards || lizards.length !== 2) {
          throw new Error('Could not load both lizards');
        }

        // Fetch equipment for both lizards
        const { data: equipment, error: eqError } = await supabase
          .from('user_equipment')
          .select('*')
          .in('user_id', [attackerId, defenderId])
          .eq('is_equipped', true);

        if (eqError) throw eqError;

        // Calculate stats with equipment
        const calculateTotalStats = (lizard: Lizard) => {
          const eqStats = {
            hp: 0,
            atk: 0,
            def: 0,
            crit_rate: 0,
            crit_damage: 0,
            attack_speed: 0,
            regeneration: 0,
          };

          (equipment || [])
            .filter((eq) => eq.user_id === lizard.id)
            .forEach((item) => {
              item.stats.forEach((stat: any) => {
                eqStats[stat.type as keyof typeof eqStats] += stat.value;
              });
            });

          return {
            ...lizard,
            hp: lizard.hp + eqStats.hp,
            atk: lizard.atk + eqStats.atk,
            def: lizard.def + eqStats.def,
            crit_rate: lizard.crit_rate + eqStats.crit_rate,
            crit_damage: lizard.crit_damage + eqStats.crit_damage,
            attack_speed: lizard.attack_speed + eqStats.attack_speed,
            regeneration: lizard.regeneration + eqStats.regeneration,
          };
        };

        const attackerLizard = calculateTotalStats(
          lizards.find((l) => l.id === attackerId)!
        );
        const defenderLizard = calculateTotalStats(
          lizards.find((l) => l.id === defenderId)!
        );

        setAttacker({
          lizard: attackerLizard,
          currentHp: attackerLizard.hp,
          maxHp: attackerLizard.hp,
          position: 0,
        });

        setDefender({
          lizard: defenderLizard,
          currentHp: defenderLizard.hp,
          maxHp: defenderLizard.hp,
          position: 0,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading fighters:', err);
        setLoading(false);
      }
    }

    fetchFighters();
  }, [attackerId, defenderId]);

  // Start fight automatically when both loaded
  useEffect(() => {
    if (attacker && defender && !fightStarted) {
      setFightStarted(true);
    }
  }, [attacker, defender, fightStarted]);

  // Fight logic
  useEffect(() => {
    if (!fightStarted || !attacker || !defender || winner) return;

    // Calculate attack intervals (attacks per minute to milliseconds)
    const attackerInterval = (60 * 1000) / attacker.lizard.attack_speed;
    const defenderInterval = (60 * 1000) / defender.lizard.attack_speed;

    // Calculate regeneration per second
    const attackerRegenPerSec = attacker.lizard.regeneration / 60;
    const defenderRegenPerSec = defender.lizard.regeneration / 60;

    let attackerNextAttack = Date.now() + attackerInterval;
    let defenderNextAttack = Date.now() + defenderInterval;

    const calculateDamage = (
      attacker: FighterStats,
      defender: FighterStats,
      isAttackerSide: boolean
    ): number => {
      const baseDamage = Math.max(1, attacker.lizard.atk - defender.lizard.def * 0.5);
      const isCrit = Math.random() < attacker.lizard.crit_rate;
      const damage = isCrit
        ? baseDamage * (1 + attacker.lizard.crit_damage)
        : baseDamage;

      // Add damage number
      const newDamage: DamageNumber = {
        id: damageIdRef.current++,
        amount: Math.floor(damage),
        x: isAttackerSide ? 65 : 35,
        y: 40 + Math.random() * 20,
        isCrit,
      };

      setDamageNumbers((prev) => [...prev, newDamage]);

      // Remove damage number after animation
      setTimeout(() => {
        setDamageNumbers((prev) => prev.filter((d) => d.id !== newDamage.id));
      }, 1000);

      return damage;
    };

    const gameLoop = setInterval(() => {
      const now = Date.now();

      setAttacker((prev) => {
        if (!prev || !defender) return prev;

        let newHp = prev.currentHp;
        let newPos = prev.position;

        // Regeneration
        if (attackerRegenPerSec > 0) {
          newHp = Math.min(prev.maxHp, newHp + attackerRegenPerSec / 10);
        }

        // Check if can attack
        if (now >= attackerNextAttack) {
          const damage = calculateDamage(prev, defender, true);

          // Attack animation
          newPos = 10;
          setTimeout(() => {
            setAttacker((p) => p ? { ...p, position: 0 } : null);
          }, 200);

          // Deal damage to defender
          setDefender((d) => {
            if (!d) return d;
            const newDefenderHp = Math.max(0, d.currentHp - damage);
            if (newDefenderHp === 0) {
              setTimeout(() => setWinner(prev.lizard.name), 2000);
            }
            return { ...d, currentHp: newDefenderHp };
          });

          attackerNextAttack = now + attackerInterval;
        }

        return { ...prev, currentHp: newHp, position: newPos };
      });

      setDefender((prev) => {
        if (!prev || !attacker) return prev;

        let newHp = prev.currentHp;
        let newPos = prev.position;

        // Regeneration
        if (defenderRegenPerSec > 0) {
          newHp = Math.min(prev.maxHp, newHp + defenderRegenPerSec / 10);
        }

        // Check if can attack
        if (now >= defenderNextAttack) {
          const damage = calculateDamage(prev, attacker, false);

          // Attack animation
          newPos = -10;
          setTimeout(() => {
            setDefender((p) => p ? { ...p, position: 0 } : null);
          }, 200);

          // Deal damage to attacker
          setAttacker((a) => {
            if (!a) return a;
            const newAttackerHp = Math.max(0, a.currentHp - damage);
            if (newAttackerHp === 0) {
              setTimeout(() => setWinner(prev.lizard.name), 2000);
            }
            return { ...a, currentHp: newAttackerHp };
          });

          defenderNextAttack = now + defenderInterval;
        }

        return { ...prev, currentHp: newHp, position: newPos };
      });
    }, 100);

    return () => clearInterval(gameLoop);
  }, [fightStarted, attacker, defender, winner]);

  if (loading) {
    return (
      <Window window={window}>
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-red-100 to-orange-100">
          <div className="text-gray-700 font-bold">Loading fighters...</div>
        </div>
      </Window>
    );
  }

  if (!attacker || !defender) {
    return (
      <Window window={window}>
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-red-600">Error loading fighters</div>
        </div>
      </Window>
    );
  }

  const attackerHpPercent = (attacker.currentHp / attacker.maxHp) * 100;
  const defenderHpPercent = (defender.currentHp / defender.maxHp) * 100;

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 overflow-hidden relative">
        {/* Arena Background */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent via-gray-900 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 border-b-2 border-gray-400 z-10 relative">
          <div className="text-center text-white font-bold text-xl">
            ⚔️ LIZARD BATTLE ⚔️
          </div>
          <div className="text-center text-white text-sm opacity-90">
            {attacker.lizard.name} vs {defender.lizard.name}
          </div>
        </div>

        {/* Battle Arena */}
        <div className="flex-1 relative overflow-hidden">
          {/* Damage Numbers */}
          {damageNumbers.map((dmg) => (
            <div
              key={dmg.id}
              className={`absolute font-bold text-2xl animate-ping pointer-events-none ${
                dmg.isCrit ? 'text-yellow-500' : 'text-red-600'
              }`}
              style={{
                left: `${dmg.x}%`,
                top: `${dmg.y}%`,
                animation: 'float-up 1s ease-out forwards',
              }}
            >
              {dmg.isCrit && '💥 '}
              {dmg.amount}
            </div>
          ))}

          {/* Fighters */}
          <div className="absolute inset-0 flex items-center justify-between px-12">
            {/* Attacker (Left) */}
            <div
              className="transform transition-all duration-200"
              style={{ transform: `translateX(${attacker.position}px)` }}
            >
              <div className="text-8xl drop-shadow-lg">🦎</div>
              {attacker.currentHp === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  💀
                </div>
              )}
            </div>

            {/* VS */}
            <div className="text-6xl font-bold text-red-600 opacity-30 drop-shadow-lg">
              VS
            </div>

            {/* Defender (Right) */}
            <div
              className="transform transition-all duration-200"
              style={{ transform: `translateX(${defender.position}px) scaleX(-1)` }}
            >
              <div className="text-8xl drop-shadow-lg">🦎</div>
              {defender.currentHp === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-4xl scale-x-[-1]">
                  💀
                </div>
              )}
            </div>
          </div>

          {/* Winner Message */}
          {winner && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
              <div className="bg-yellow-400 border-4 border-yellow-600 p-8 rounded-lg shadow-2xl animate-bounce">
                <div className="text-4xl font-bold text-gray-900 text-center mb-2">
                  🏆 WINNER 🏆
                </div>
                <div className="text-3xl font-bold text-red-700 text-center">
                  {winner}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Health Bars and Stats */}
        <div className="bg-white border-t-2 border-gray-400 p-4 space-y-3 z-10 relative">
          {/* Attacker Health */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-blue-700">{attacker.lizard.name}</div>
              <div className="text-sm text-gray-600">
                {Math.floor(attacker.currentHp)} / {attacker.maxHp} HP
              </div>
            </div>
            <div className="w-full bg-gray-300 h-6 border-2 border-gray-600 rounded overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${attackerHpPercent}%` }}
              >
                {attackerHpPercent > 15 && `${attackerHpPercent.toFixed(0)}%`}
              </div>
            </div>
            <div className="flex gap-2 mt-1 text-xs">
              <span>⚔️ {Math.floor(attacker.lizard.atk)}</span>
              <span>🛡️ {Math.floor(attacker.lizard.def)}</span>
              <span>⚡ {Math.floor(attacker.lizard.attack_speed)}/min</span>
              {attacker.lizard.regeneration > 0 && (
                <span>💚 {attacker.lizard.regeneration.toFixed(1)}/min</span>
              )}
            </div>
          </div>

          {/* Defender Health */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-red-700">{defender.lizard.name}</div>
              <div className="text-sm text-gray-600">
                {Math.floor(defender.currentHp)} / {defender.maxHp} HP
              </div>
            </div>
            <div className="w-full bg-gray-300 h-6 border-2 border-gray-600 rounded overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${defenderHpPercent}%` }}
              >
                {defenderHpPercent > 15 && `${defenderHpPercent.toFixed(0)}%`}
              </div>
            </div>
            <div className="flex gap-2 mt-1 text-xs">
              <span>⚔️ {Math.floor(defender.lizard.atk)}</span>
              <span>🛡️ {Math.floor(defender.lizard.def)}</span>
              <span>⚡ {Math.floor(defender.lizard.attack_speed)}/min</span>
              {defender.lizard.regeneration > 0 && (
                <span>💚 {defender.lizard.regeneration.toFixed(1)}/min</span>
              )}
            </div>
          </div>
        </div>

        {/* Custom CSS for damage number animation */}
        <style>{`
          @keyframes float-up {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            100% {
              transform: translateY(-50px);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </Window>
  );
}
