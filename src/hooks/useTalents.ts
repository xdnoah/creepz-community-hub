import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface TalentAllocations {
  money_tree_level: number;
  shop_tree_level: number;
  def_build_level: number;
  dmg_build_level: number;
}

export interface TalentStats {
  gold_per_second: number;
  hp: number;
  def: number;
  atk: number;
  crit_rate: number;
  crit_damage: number;
  regeneration: number;
  attack_speed: number;
  // Shop bonuses
  shop_extra_items: number;
  shop_cooldown_reduction: number; // in seconds
}

export function useTalents() {
  const { user } = useAuth();
  const [talents, setTalents] = useState<TalentAllocations | null>(null);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTalents = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch talent allocations
      const { data: talentData, error: talentError } = await supabase
        .from('talent_allocations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (talentError && talentError.code !== 'PGRST116') { // PGRST116 = no rows
        throw talentError;
      }

      if (talentData) {
        setTalents(talentData);
      } else {
        // No talents yet, set to zeros
        setTalents({
          money_tree_level: 0,
          shop_tree_level: 0,
          def_build_level: 0,
          dmg_build_level: 0,
        });
      }

      // Fetch available points using RPC
      const { data: pointsData, error: pointsError } = await supabase
        .rpc('get_available_talent_points', { p_user_id: user.id });

      if (pointsError) throw pointsError;

      setAvailablePoints(pointsData || 0);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching talents:', err);
      setLoading(false);
    }
  }, [user]);

  // Allocate talent point
  const allocateTalentPoint = async (tree: 'money_tree' | 'shop_tree' | 'def_build' | 'dmg_build'): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .rpc('allocate_talent_point', {
          p_user_id: user.id,
          p_talent_tree: tree,
        });

      if (error) throw error;

      const result = data?.[0];
      if (!result?.success) {
        return { error: result?.error_message || 'Failed to allocate talent point' };
      }

      // Refresh talents
      await fetchTalents();
      return {};
    } catch (err: any) {
      console.error('Error allocating talent:', err);
      return { error: err.message || 'Failed to allocate talent point' };
    }
  };

  // Reset all talents
  const resetAllTalents = async (): Promise<{ error?: string }> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .rpc('reset_all_talents', { p_user_id: user.id });

      if (error) throw error;

      // Refresh talents
      await fetchTalents();
      return {};
    } catch (err: any) {
      console.error('Error resetting talents:', err);
      return { error: err.message || 'Failed to reset talents' };
    }
  };

  // Calculate talent stats bonuses
  const getTalentStats = useCallback((): TalentStats => {
    if (!talents) {
      return {
        gold_per_second: 0,
        hp: 0,
        def: 0,
        atk: 0,
        crit_rate: 0,
        crit_damage: 0,
        regeneration: 0,
        attack_speed: 0,
        shop_extra_items: 0,
        shop_cooldown_reduction: 0,
      };
    }

    const stats: TalentStats = {
      gold_per_second: 0,
      hp: 0,
      def: 0,
      atk: 0,
      crit_rate: 0,
      crit_damage: 0,
      regeneration: 0,
      attack_speed: 0,
      shop_extra_items: 0,
      shop_cooldown_reduction: 0,
    };

    // Money Tree bonuses
    const moneyLevels = [0, 1, 2, 5, 10, 20, 100, 500, 1000, 5000, 10000];
    for (let i = 1; i <= talents.money_tree_level; i++) {
      stats.gold_per_second += moneyLevels[i];
    }

    // Shop Tree bonuses
    if (talents.shop_tree_level >= 1) stats.shop_extra_items += 1;
    if (talents.shop_tree_level >= 2) stats.shop_extra_items += 1;
    if (talents.shop_tree_level >= 4) stats.shop_cooldown_reduction += 60; // 1 minute
    if (talents.shop_tree_level >= 8) stats.shop_cooldown_reduction += 30; // 30 seconds

    // Defense Build bonuses
    const defLevels = [
      { hp: 0, def: 0, regen: 0 }, // Level 0
      { hp: 10, def: 10, regen: 0 }, // Level 1
      { hp: 100, def: 0, regen: 10 }, // Level 2
      { hp: 250, def: 20, regen: 0 }, // Level 3
      { hp: 500, def: 200, regen: 0 }, // Level 4
      { hp: 1000, def: 200, regen: 50 }, // Level 5
      { hp: 0, def: 0, regen: 0 }, // Level 6 (divine shield - special)
      { hp: 4000, def: 0, regen: 0 }, // Level 7
      { hp: 0, def: 200, regen: 0 }, // Level 8
      { hp: 0, def: 0, regen: 50 }, // Level 9
      { hp: 10000, def: 1000, regen: 0 }, // Level 10
    ];

    for (let i = 1; i <= talents.def_build_level; i++) {
      stats.hp += defLevels[i].hp;
      stats.def += defLevels[i].def;
      stats.regeneration += defLevels[i].regen;
    }

    // Damage Build bonuses
    const dmgLevels = [
      { atk: 0, crit_rate: 0, crit_damage: 0, attack_speed: 0 }, // Level 0
      { atk: 10, crit_rate: 0.10, crit_damage: 0, attack_speed: 0 }, // Level 1
      { atk: 15, crit_rate: 0, crit_damage: 0.20, attack_speed: 0 }, // Level 2
      { atk: 20, crit_rate: 0, crit_damage: 0.20, attack_speed: 0 }, // Level 3
      { atk: 35, crit_rate: 0.05, crit_damage: 0, attack_speed: 0 }, // Level 4
      { atk: 40, crit_rate: 0.05, crit_damage: 0.20, attack_speed: 0 }, // Level 5
      { atk: 0, crit_rate: 0, crit_damage: 0, attack_speed: 0 }, // Level 6 (double hit - special)
      { atk: 0, crit_rate: 0, crit_damage: 0, attack_speed: 0.20 }, // Level 7
      { atk: 50, crit_rate: 0, crit_damage: 0, attack_speed: 0 }, // Level 8
      { atk: 0, crit_rate: 0, crit_damage: 0.50, attack_speed: 0 }, // Level 9
      { atk: 0, crit_rate: 0.15, crit_damage: 0.50, attack_speed: 0 }, // Level 10
    ];

    for (let i = 1; i <= talents.dmg_build_level; i++) {
      stats.atk += dmgLevels[i].atk;
      stats.crit_rate += dmgLevels[i].crit_rate;
      stats.crit_damage += dmgLevels[i].crit_damage;
      stats.attack_speed += dmgLevels[i].attack_speed;
    }

    return stats;
  }, [talents]);

  useEffect(() => {
    fetchTalents();
  }, [fetchTalents]);

  return {
    talents,
    availablePoints,
    loading,
    allocateTalentPoint,
    resetAllTalents,
    getTalentStats,
    refetch: fetchTalents,
  };
}
