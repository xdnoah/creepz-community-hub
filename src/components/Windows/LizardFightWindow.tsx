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
  shake: number;
  charging: boolean;
}

interface DamageNumber {
  id: number;
  amount: number;
  x: number;
  y: number;
  isCrit: boolean;
}

interface ImpactEffect {
  id: number;
  x: number;
  y: number;
}

export function LizardFightWindow({ window }: LizardFightWindowProps) {
  const attackerId = window.data?.attacker;
  const defenderId = window.data?.defender;

  const [attacker, setAttacker] = useState<FighterStats | null>(null);
  const [defender, setDefender] = useState<FighterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [fightStarted, setFightStarted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [impactEffects, setImpactEffects] = useState<ImpactEffect[]>([]);
  const [screenShake, setScreenShake] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const damageIdRef = useRef(0);
  const impactIdRef = useRef(0);
  const fightSavedRef = useRef(false);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attackerNextAttackRef = useRef<number>(0);
  const defenderNextAttackRef = useRef<number>(0);

  // Fetch both lizards with equipment stats (optimized for speed)
  useEffect(() => {
    async function fetchFighters() {
      if (!attackerId || !defenderId) return;

      try {
        console.log('[FIGHT] Fetching fresh lizard data...', { attackerId, defenderId, timestamp: Date.now() });

        // Fetch lizards and equipment in parallel for maximum speed
        // Force fresh data by adding a timestamp to prevent caching
        const [lizardsResult, equipmentResult] = await Promise.all([
          supabase
            .from('lizards')
            .select('*')
            .in('id', [attackerId, defenderId])
            .order('updated_at', { ascending: false }), // Ensure latest data
          supabase
            .from('user_equipment')
            .select('*')
            .in('user_id', [attackerId, defenderId])
            .eq('is_equipped', true)
            .order('updated_at', { ascending: false }), // Ensure latest equipped items
        ]);

        const { data: lizards, error } = lizardsResult;
        const { data: equipment, error: eqError } = equipmentResult;

        console.log('[FIGHT] Fetched data:', {
          lizards: lizards?.map(l => ({ id: l.id, name: l.name, hp: l.hp, atk: l.atk, def: l.def })),
          equipmentCount: equipment?.length,
        });

        if (error) throw error;
        if (eqError) throw eqError;

        if (!lizards || lizards.length !== 2) {
          throw new Error('Could not load both lizards');
        }

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

        console.log('[FIGHT] Final calculated stats:', {
          attacker: {
            name: attackerLizard.name,
            hp: attackerLizard.hp,
            atk: attackerLizard.atk,
            def: attackerLizard.def,
            crit_rate: attackerLizard.crit_rate,
            attack_speed: attackerLizard.attack_speed,
          },
          defender: {
            name: defenderLizard.name,
            hp: defenderLizard.hp,
            atk: defenderLizard.atk,
            def: defenderLizard.def,
            crit_rate: defenderLizard.crit_rate,
            attack_speed: defenderLizard.attack_speed,
          },
        });

        setAttacker({
          lizard: attackerLizard,
          currentHp: attackerLizard.hp,
          maxHp: attackerLizard.hp,
          position: 0,
          shake: 0,
          charging: false,
        });

        setDefender({
          lizard: defenderLizard,
          currentHp: defenderLizard.hp,
          maxHp: defenderLizard.hp,
          position: 0,
          shake: 0,
          charging: false,
        });

        setLoading(false);

        // Start countdown immediately (3-2-1-FIGHT!)
        setTimeout(() => setCountdown(3), 100);
        setTimeout(() => setCountdown(2), 800);
        setTimeout(() => setCountdown(1), 1600);
        setTimeout(() => {
          setCountdown(0); // 0 means "FIGHT!"
          setTimeout(() => {
            setCountdown(null);
            setFightStarted(true);
          }, 600);
        }, 2400);
      } catch (err) {
        console.error('Error loading fighters:', err);
        setLoading(false);
      }
    }

    fetchFighters();
  }, [attackerId, defenderId]);

  // Countdown is now handled in fetchFighters after data loads

  // Save fight result to database
  useEffect(() => {
    async function saveFightResult() {
      if (!winner || !winnerId || !attacker || !defender || fightSavedRef.current) return;

      fightSavedRef.current = true;

      try {
        await supabase.from('fight_history').insert({
          attacker_id: attacker.lizard.id,
          attacker_name: attacker.lizard.name,
          defender_id: defender.lizard.id,
          defender_name: defender.lizard.name,
          winner_id: winnerId,
          winner_name: winner,
        });
      } catch (err) {
        console.error('Error saving fight result:', err);
      }
    }

    saveFightResult();
  }, [winner, winnerId, attacker, defender]);

  // Fight logic
  useEffect(() => {
    if (!fightStarted || !attacker || !defender || winner) return;

    // Calculate attack intervals - 60 attacks/min = 1 attack per second
    // With 3x speed multiplier: 60 * 3 = 180 attacks/min = 3 attacks per second = 333ms interval
    const attackerInterval = (60 * 1000) / (attacker.lizard.attack_speed * 3);
    const defenderInterval = (60 * 1000) / (defender.lizard.attack_speed * 3);

    // Calculate regeneration per second (3x speed)
    const attackerRegenPerSec = (attacker.lizard.regeneration / 60) * 3;
    const defenderRegenPerSec = (defender.lizard.regeneration / 60) * 3;

    // Initialize attack timers - first attack happens IMMEDIATELY after countdown
    attackerNextAttackRef.current = Date.now();
    defenderNextAttackRef.current = Date.now() + 100; // Slight offset so they don't attack at exact same time

    console.log('[FIGHT] Fight started!', {
      attackerSpeed: attacker.lizard.attack_speed,
      defenderSpeed: defender.lizard.attack_speed,
      attackerInterval,
      defenderInterval,
      firstAttackerAttack: attackerNextAttackRef.current,
      firstDefenderAttack: defenderNextAttackRef.current,
    });

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

      // Add impact effect
      const newImpact: ImpactEffect = {
        id: impactIdRef.current++,
        x: isAttackerSide ? 60 : 40,
        y: 50,
      };

      setImpactEffects((prev) => [...prev, newImpact]);

      // Screen shake on crit
      if (isCrit) {
        setScreenShake(10);
        setTimeout(() => setScreenShake(0), 200);

        // Update combo counter
        setComboCount((prev) => prev + 1);

        // Reset combo after 2 seconds of no crits
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        comboTimeoutRef.current = setTimeout(() => setComboCount(0), 2000);
      }

      // Remove damage number after animation
      setTimeout(() => {
        setDamageNumbers((prev) => prev.filter((d) => d.id !== newDamage.id));
      }, 1000);

      // Remove impact effect
      setTimeout(() => {
        setImpactEffects((prev) => prev.filter((i) => i.id !== newImpact.id));
      }, 500);

      return damage;
    };

    const gameLoop = setInterval(() => {
      const now = Date.now();

      // Handle attacker attacks
      if (now >= attackerNextAttackRef.current) {
        console.log('[FIGHT] Attacker attacks!', { now, nextAttack: attackerNextAttackRef.current });

        setAttacker((prev) => {
          if (!prev) return prev;

          // Attack animation - lunge forward with visible movement
          const newPos = 30;
          setTimeout(() => {
            setAttacker((p) => p ? { ...p, position: 0 } : null);
          }, 250);

          return { ...prev, position: newPos, charging: false };
        });

        setDefender((d) => {
          if (!d || !attacker) return d;
          const damage = calculateDamage(attacker, d, true);
          const newDefenderHp = Math.max(0, d.currentHp - damage);

          // Hit shake animation
          const hitShake = 10;
          setTimeout(() => {
            setDefender((p) => p ? { ...p, shake: 0 } : null);
          }, 200);

          if (newDefenderHp === 0 && !winner) {
            setTimeout(() => {
              setWinner(attacker.lizard.name);
              setWinnerId(attacker.lizard.id);
            }, 2000);
          }
          return { ...d, currentHp: newDefenderHp, shake: hitShake };
        });

        attackerNextAttackRef.current = now + attackerInterval;
      }

      // Charge animation shortly before attack
      setAttacker((prev) => {
        if (!prev) return prev;
        const timeUntilAttack = attackerNextAttackRef.current - now;
        const shouldCharge = timeUntilAttack > 0 && timeUntilAttack <= 150 && !prev.charging;

        let newHp = prev.currentHp;
        // Regeneration
        if (attackerRegenPerSec > 0) {
          newHp = Math.min(prev.maxHp, newHp + attackerRegenPerSec / 10);
        }

        return shouldCharge ? { ...prev, charging: true, currentHp: newHp } : { ...prev, currentHp: newHp };
      });

      // Handle defender attacks
      if (now >= defenderNextAttackRef.current) {
        console.log('[FIGHT] Defender attacks!', { now, nextAttack: defenderNextAttackRef.current });

        setDefender((prev) => {
          if (!prev) return prev;

          // Attack animation - lunge forward with visible movement
          const newPos = -30;
          setTimeout(() => {
            setDefender((p) => p ? { ...p, position: 0 } : null);
          }, 250);

          return { ...prev, position: newPos, charging: false };
        });

        setAttacker((a) => {
          if (!a || !defender) return a;
          const damage = calculateDamage(defender, a, false);
          const newAttackerHp = Math.max(0, a.currentHp - damage);

          // Hit shake animation
          const hitShake = 10;
          setTimeout(() => {
            setAttacker((p) => p ? { ...p, shake: 0 } : null);
          }, 200);

          if (newAttackerHp === 0 && !winner) {
            setTimeout(() => {
              setWinner(defender.lizard.name);
              setWinnerId(defender.lizard.id);
            }, 2000);
          }
          return { ...a, currentHp: newAttackerHp, shake: hitShake };
        });

        defenderNextAttackRef.current = now + defenderInterval;
      }

      // Charge animation and regen for defender
      setDefender((prev) => {
        if (!prev) return prev;
        const timeUntilAttack = defenderNextAttackRef.current - now;
        const shouldCharge = timeUntilAttack > 0 && timeUntilAttack <= 150 && !prev.charging;

        let newHp = prev.currentHp;
        // Regeneration
        if (defenderRegenPerSec > 0) {
          newHp = Math.min(prev.maxHp, newHp + defenderRegenPerSec / 10);
        }

        return shouldCharge ? { ...prev, charging: true, currentHp: newHp } : { ...prev, currentHp: newHp };
      });
    }, 100);

    return () => clearInterval(gameLoop);
    // Only depend on fightStarted and winner - attacker/defender are captured from closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fightStarted, winner]);

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
      <div
        className="flex flex-col h-full bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 overflow-hidden relative"
        style={{
          transform: `translate(${Math.sin(screenShake) * screenShake}px, ${Math.cos(screenShake) * screenShake}px)`,
          transition: screenShake > 0 ? 'none' : 'transform 0.2s',
        }}
      >
        {/* Arena Background */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent via-gray-900 to-transparent pointer-events-none" />

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
            <div className="text-center animate-pulse">
              {countdown > 0 ? (
                <div className="text-9xl font-black text-yellow-400 drop-shadow-2xl animate-bounce">
                  {countdown}
                </div>
              ) : (
                <div className="text-8xl font-black text-red-600 drop-shadow-2xl">
                  FIGHT!
                </div>
              )}
            </div>
          </div>
        )}

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
          {/* Combo Counter */}
          {comboCount > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
              <div className="bg-yellow-400 border-4 border-yellow-600 px-6 py-2 rounded-full shadow-2xl animate-pulse">
                <div className="text-2xl font-black text-red-700">
                  {comboCount}x COMBO! 🔥
                </div>
              </div>
            </div>
          )}

          {/* Impact Effects */}
          {impactEffects.map((impact) => (
            <div
              key={impact.id}
              className="absolute pointer-events-none"
              style={{
                left: `${impact.x}%`,
                top: `${impact.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative">
                {/* Radial flash */}
                <div className="absolute inset-0 animate-ping">
                  <div className="w-24 h-24 bg-yellow-400 rounded-full opacity-60" />
                </div>
                <div className="w-24 h-24 bg-orange-500 rounded-full opacity-40 animate-pulse" />
              </div>
            </div>
          ))}

          {/* Damage Numbers */}
          {damageNumbers.map((dmg) => (
            <div
              key={dmg.id}
              className={`absolute font-black pointer-events-none drop-shadow-lg ${
                dmg.isCrit
                  ? 'text-4xl text-yellow-300'
                  : 'text-2xl text-red-600'
              }`}
              style={{
                left: `${dmg.x}%`,
                top: `${dmg.y}%`,
                animation: dmg.isCrit
                  ? 'crit-float 1s ease-out forwards'
                  : 'float-up 1s ease-out forwards',
                textShadow: dmg.isCrit
                  ? '0 0 10px rgba(255, 255, 0, 0.8), 0 0 20px rgba(255, 165, 0, 0.6)'
                  : '2px 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {dmg.isCrit && '💥 '}
              {dmg.amount}
              {dmg.isCrit && ' 💥'}
            </div>
          ))}

          {/* Fighters */}
          <div className="absolute inset-0 flex items-center justify-between px-12">
            {/* Attacker (Left) */}
            <div className="relative">
              {/* Charging glow effect */}
              {attacker.charging && (
                <div className="absolute inset-0 animate-pulse">
                  <div className="text-8xl blur-xl opacity-70 text-yellow-400">🦎</div>
                </div>
              )}
              <div
                className="transform transition-all duration-200 relative"
                style={{
                  transform: `translateX(${attacker.position}px) translateY(${Math.sin(attacker.shake) * attacker.shake}px) rotate(${attacker.shake * 2}deg) scale(${attacker.position > 0 ? 1.2 : 1})`,
                  filter: attacker.charging ? 'drop-shadow(0 0 15px rgba(255, 255, 0, 0.9))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                }}
              >
                <div className="text-8xl">🦎</div>
                {attacker.currentHp === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl">
                    💀
                  </div>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="text-6xl font-bold text-red-600 opacity-30 drop-shadow-lg">
              VS
            </div>

            {/* Defender (Right) */}
            <div className="relative">
              {/* Charging glow effect */}
              {defender.charging && (
                <div className="absolute inset-0 animate-pulse scale-x-[-1]">
                  <div className="text-8xl blur-xl opacity-70 text-yellow-400">🦎</div>
                </div>
              )}
              <div
                className="transform transition-all duration-200 relative"
                style={{
                  transform: `translateX(${defender.position}px) translateY(${Math.sin(defender.shake) * defender.shake}px) rotate(${-defender.shake * 2}deg) scale(${defender.position < 0 ? 1.2 : 1}, ${defender.position < 0 ? 1.2 : 1}) scaleX(-1)`,
                  filter: defender.charging ? 'drop-shadow(0 0 15px rgba(255, 255, 0, 0.9))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
                }}
              >
                <div className="text-8xl">🦎</div>
                {defender.currentHp === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl scale-x-[-1]">
                    💀
                  </div>
                )}
              </div>
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

        {/* Custom CSS for animations */}
        <style>{`
          @keyframes float-up {
            0% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            50% {
              transform: translateY(-30px) scale(1.2);
            }
            100% {
              transform: translateY(-60px) scale(0.8);
              opacity: 0;
            }
          }

          @keyframes crit-float {
            0% {
              transform: translateY(0) scale(1) rotate(0deg);
              opacity: 1;
            }
            25% {
              transform: translateY(-20px) scale(1.5) rotate(-10deg);
            }
            50% {
              transform: translateY(-40px) scale(1.8) rotate(10deg);
            }
            75% {
              transform: translateY(-60px) scale(1.6) rotate(-5deg);
            }
            100% {
              transform: translateY(-80px) scale(1) rotate(0deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </Window>
  );
}
