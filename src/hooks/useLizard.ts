import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Lizard, StatIncrease, Equipment, SafeGoldResult } from '../types';

// Helper to log activity without circular dependency
const logLizardActivity = async (userId: string, username: string, activityType: string, metadata?: any) => {
  try {
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        username: username,
        activity_type: activityType,
        metadata: metadata || null,
      });
  } catch (err) {
    console.error('Error logging lizard activity:', err);
  }
};

// Game formulas
export const calculateLevelUpCost = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 2.5));
};

export const calculateDailyReward = (day: number): number => {
  return Math.floor(50 * day * day);
};

export const getRandomStatIncrease = (): StatIncrease => {
  const stats: Array<{
    stat: StatIncrease['stat'];
    displayName: string;
    min: number;
    max: number;
  }> = [
    { stat: 'hp', displayName: 'HP', min: 10, max: 30 },
    { stat: 'def', displayName: 'DEF', min: 1, max: 5 },
    { stat: 'atk', displayName: 'ATK', min: 2, max: 8 },
    { stat: 'crit_rate', displayName: 'CRIT RATE', min: 0.01, max: 0.03 },
    { stat: 'crit_damage', displayName: 'CRIT DMG', min: 0.05, max: 0.15 },
  ];

  const randomStat = stats[Math.floor(Math.random() * stats.length)];
  const amount = Math.random() * (randomStat.max - randomStat.min) + randomStat.min;

  return {
    stat: randomStat.stat,
    amount: randomStat.stat.includes('crit') ? parseFloat(amount.toFixed(4)) : Math.floor(amount),
    displayName: randomStat.displayName,
  };
};

export function useLizard() {
  const { user } = useAuth();
  const [lizard, setLizard] = useState<Lizard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goldPerSecond, setGoldPerSecond] = useState(0);
  const [feedCooldownRemaining, setFeedCooldownRemaining] = useState(0);
  const [canClaimDailyReward, setCanClaimDailyReward] = useState(false);
  const [equipmentStats, setEquipmentStats] = useState({
    hp: 0,
    atk: 0,
    def: 0,
    crit_rate: 0,
    crit_damage: 0,
    gold_per_second: 0,
    attack_speed: 0,
    regeneration: 0,
  });

  // Fetch and calculate equipment stats
  const fetchEquipmentStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('user_equipment')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_equipped', true);

      if (fetchError) throw fetchError;

      const stats = {
        hp: 0,
        atk: 0,
        def: 0,
        crit_rate: 0,
        crit_damage: 0,
        gold_per_second: 0,
        attack_speed: 0,
        regeneration: 0,
      };

      (data || []).forEach((item: Equipment) => {
        // Apply upgrade multiplier: +10% per upgrade level
        const upgradeMultiplier = 1 + (item.upgrade_level * 0.10);

        item.stats.forEach((stat) => {
          stats[stat.type] += stat.value * upgradeMultiplier;
        });
      });

      console.log('[Equipment] Loaded stats:', stats);
      setEquipmentStats(stats);
    } catch (err: any) {
      console.error('Error fetching equipment stats:', err);
    }
  }, [user]);

  // Fetch lizard from database
  const fetchLizard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('lizards')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No lizard found - user needs to create one
          setLizard(null);
        } else {
          throw fetchError;
        }
      } else {
        // Sync offline gold
        await syncOfflineGold(data.id);

        // Fetch updated lizard after sync
        const { data: updatedData, error: updateError } = await supabase
          .from('lizards')
          .select('*')
          .eq('id', user.id)
          .single();

        if (updateError) throw updateError;

        setLizard(updatedData);
        updateDerivedStats(updatedData);
        checkDailyStreak(updatedData);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching lizard:', err);
      setError(err.message || 'Failed to load lizard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sync offline gold accumulation
  const syncOfflineGold = async (lizardId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('sync_offline_gold', { lizard_id: lizardId });

      if (error) throw error;

      if (data && data.length > 0 && data[0].gold_earned > 0) {
        console.log(`[LizardGoshi] Synced ${data[0].gold_earned} offline gold`);
      }
    } catch (err: any) {
      console.error('Error syncing offline gold:', err);
    }
  };

  // Update derived stats like gold per second and feed cooldown
  const updateDerivedStats = useCallback((lizardData: Lizard) => {
    // Calculate current gold per second (base + equipment bonus)
    let gps = lizardData.passive_income + equipmentStats.gold_per_second;
    console.log('[Equipment] Updating GPS:', {
      base: lizardData.passive_income,
      equipment: equipmentStats.gold_per_second,
      total: gps
    });
    if (lizardData.is_fed && lizardData.fed_at) {
      const fedTime = new Date(lizardData.fed_at).getTime();
      const now = Date.now();
      const elapsed = now - fedTime;
      const twelveHours = 12 * 60 * 60 * 1000;

      if (elapsed < twelveHours) {
        gps *= 2; // Double income while fed
        setFeedCooldownRemaining(twelveHours - elapsed);
      } else {
        setFeedCooldownRemaining(0);
      }
    } else if (lizardData.fed_at) {
      const fedTime = new Date(lizardData.fed_at).getTime();
      const now = Date.now();
      const elapsed = now - fedTime;
      const twelveHours = 12 * 60 * 60 * 1000;

      if (elapsed < twelveHours) {
        setFeedCooldownRemaining(twelveHours - elapsed);
      } else {
        setFeedCooldownRemaining(0);
      }
    }

    setGoldPerSecond(gps);
  }, [equipmentStats]);

  // Check if user can claim daily streak reward
  const checkDailyStreak = (lizardData: Lizard) => {
    const lastLogin = new Date(lizardData.last_login).getTime();
    const now = Date.now();
    const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);

    // Can claim if hasn't claimed today and has logged in
    if (!lizardData.login_streak_claimed && hoursSinceLogin < 36) {
      setCanClaimDailyReward(true);
    } else {
      setCanClaimDailyReward(false);
    }
  };

  // Create new lizard (first time setup)
  const createLizard = async (name: string, gender: 'male' | 'female'): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error: insertError } = await supabase
        .from('lizards')
        .insert({
          id: user.id,
          name,
          gender,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setLizard(data);
      updateDerivedStats(data);
      return {};
    } catch (err: any) {
      console.error('Error creating lizard:', err);
      return { error: err.message || 'Failed to create lizard' };
    }
  };

  // Level up lizard
  const levelUp = async (): Promise<{ error?: string; statIncrease?: StatIncrease }> => {
    if (!lizard) return { error: 'No lizard found' };

    const cost = calculateLevelUpCost(lizard.level);
    if (lizard.gold < cost) {
      return { error: 'Not enough gold' };
    }

    try {
      // Generate random stat increase
      const statIncrease = getRandomStatIncrease();

      // Deduct gold using safe function first
      const { data: goldData, error: goldError } = await supabase
        .rpc('safe_deduct_gold', {
          p_lizard_id: lizard.id,
          p_amount: cost,
          p_reason: 'level_up'
        })
        .single();

      if (goldError) throw goldError;

      const goldResult = goldData as SafeGoldResult;
      if (goldResult && !goldResult.success) {
        return { error: goldResult.error_message || 'Failed to deduct gold' };
      }

      // Build update object (without gold since we already deducted it)
      const updates: any = {
        level: lizard.level + 1,
        total_levels_gained: lizard.total_levels_gained + 1,
      };

      // Apply stat increase
      if (statIncrease.stat === 'crit_rate' || statIncrease.stat === 'crit_damage') {
        updates[statIncrease.stat] = lizard[statIncrease.stat] + statIncrease.amount;
      } else {
        updates[statIncrease.stat] = Math.floor(lizard[statIncrease.stat] + statIncrease.amount);
      }

      // Increase passive income slightly with each level (0.1 gold/s per level)
      updates.passive_income = parseFloat((lizard.passive_income + 0.1).toFixed(2));

      const { data: lizardData, error: updateError } = await supabase
        .from('lizards')
        .update(updates)
        .eq('id', lizard.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setLizard(lizardData);
      updateDerivedStats(lizardData);

      // Log level up activity (milestones only: every 5 levels)
      if (user && lizardData.level % 5 === 0) {
        await logLizardActivity(user.id, user.username, 'lizard_levelup', { level: lizardData.level });
      }

      return { statIncrease };
    } catch (err: any) {
      console.error('Error leveling up:', err);
      return { error: err.message || 'Failed to level up' };
    }
  };

  // Feed lizard (double passive income for 12 hours)
  const feedLizard = async (): Promise<{ error?: string }> => {
    if (!lizard) return { error: 'No lizard found' };

    // Check if can feed
    if (lizard.fed_at) {
      const fedTime = new Date(lizard.fed_at).getTime();
      const now = Date.now();
      const elapsed = now - fedTime;
      const twelveHours = 12 * 60 * 60 * 1000;

      if (elapsed < twelveHours) {
        return { error: 'Already fed recently' };
      }
    }

    try {
      const { data, error: updateError } = await supabase
        .from('lizards')
        .update({
          fed_at: new Date().toISOString(),
          is_fed: true,
        })
        .eq('id', lizard.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setLizard(data);
      updateDerivedStats(data);
      return {};
    } catch (err: any) {
      console.error('Error feeding lizard:', err);
      return { error: err.message || 'Failed to feed lizard' };
    }
  };

  // Claim daily login reward
  const claimDailyReward = async (): Promise<{ error?: string; reward?: number }> => {
    if (!lizard) return { error: 'No lizard found' };
    if (!canClaimDailyReward) return { error: 'Cannot claim daily reward yet' };

    try {
      const lastLogin = new Date(lizard.last_login).getTime();
      const now = Date.now();
      const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);

      let newStreak = lizard.login_streak;

      // Reset streak if more than 36 hours
      if (hoursSinceLogin >= 36) {
        newStreak = 1;
      } else {
        newStreak += 1;
      }

      // Cap at 7 days
      if (newStreak > 7) newStreak = 7;

      const reward = calculateDailyReward(newStreak);

      // Add gold using safe function
      const { data: goldData, error: goldError } = await supabase
        .rpc('safe_add_gold', {
          p_lizard_id: lizard.id,
          p_amount: reward,
          p_add_to_total: true
        })
        .single();

      if (goldError) throw goldError;

      const goldResult = goldData as SafeGoldResult;
      if (goldResult && !goldResult.success) {
        return { error: goldResult.error_message || 'Failed to add gold' };
      }

      // Update streak info
      const { data, error: updateError } = await supabase
        .from('lizards')
        .update({
          last_login: new Date().toISOString(),
          login_streak: newStreak,
          login_streak_claimed: true,
        })
        .eq('id', lizard.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setLizard(data);
      updateDerivedStats(data);
      setCanClaimDailyReward(false);
      return { reward };
    } catch (err: any) {
      console.error('Error claiming daily reward:', err);
      return { error: err.message || 'Failed to claim daily reward' };
    }
  };

  // Update lizard customization
  const updateLizardColor = async (color: string): Promise<{ error?: string }> => {
    if (!lizard) return { error: 'No lizard found' };

    try {
      const { data, error: updateError } = await supabase
        .from('lizards')
        .update({ color })
        .eq('id', lizard.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setLizard(data);
      updateDerivedStats(data);

      return {};
    } catch (err: any) {
      console.error('Error updating lizard color:', err);
      return { error: err.message || 'Failed to update color' };
    }
  };

  // Add gold from chat message
  const addMessageGold = async (): Promise<void> => {
    if (!lizard) return;

    try {
      const { data, error: updateError } = await supabase
        .from('lizards')
        .update({
          gold: Math.floor(lizard.gold + 100),
          total_gold_earned: Math.floor(lizard.total_gold_earned + 100),
          messages_sent: lizard.messages_sent + 1,
        })
        .eq('id', lizard.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setLizard(data);
    } catch (err: any) {
      console.error('Error adding message gold:', err);
    }
  };

  // Real-time gold ticker (visual only, actual gold syncs from database)
  useEffect(() => {
    if (!lizard || goldPerSecond === 0) return;

    const interval = setInterval(() => {
      setLizard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          gold: prev.gold + goldPerSecond,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lizard?.id, goldPerSecond]);

  // Update feed cooldown timer
  useEffect(() => {
    if (feedCooldownRemaining === 0) return;

    const interval = setInterval(() => {
      setFeedCooldownRemaining((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [feedCooldownRemaining]);

  // Fetch lizard and equipment on mount
  useEffect(() => {
    if (user) {
      fetchLizard();
      fetchEquipmentStats();
    }
  }, [user, fetchLizard, fetchEquipmentStats]);

  // Update derived stats when equipment stats change
  useEffect(() => {
    if (lizard) {
      updateDerivedStats(lizard);
    }
  }, [equipmentStats, lizard, updateDerivedStats]);

  // Subscribe to equipment changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`equipment_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_equipment',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchEquipmentStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchEquipmentStats]);

  // Calculate total stats (base + equipment)
  const totalStats = lizard ? {
    hp: lizard.hp + equipmentStats.hp,
    atk: lizard.atk + equipmentStats.atk,
    def: lizard.def + equipmentStats.def,
    crit_rate: lizard.crit_rate + equipmentStats.crit_rate,
    crit_damage: lizard.crit_damage + equipmentStats.crit_damage,
    attack_speed: lizard.attack_speed + equipmentStats.attack_speed,
    regeneration: lizard.regeneration + equipmentStats.regeneration,
  } : {
    hp: 0,
    atk: 0,
    def: 0,
    crit_rate: 0,
    crit_damage: 0,
    attack_speed: 0,
    regeneration: 0,
  };

  // Debug logging
  if (lizard && (equipmentStats.hp > 0 || equipmentStats.atk > 0 || equipmentStats.def > 0)) {
    console.log('[Equipment] Total stats:', {
      base: { hp: lizard.hp, atk: lizard.atk, def: lizard.def },
      equipment: { hp: equipmentStats.hp, atk: equipmentStats.atk, def: equipmentStats.def },
      total: { hp: totalStats.hp, atk: totalStats.atk, def: totalStats.def }
    });
  }

  return {
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
    addMessageGold,
    refreshLizard: fetchLizard,
  };
}
