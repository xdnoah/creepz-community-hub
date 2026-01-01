import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { SafeGoldResult } from '../types';

export function useCasino(userId: string | undefined) {
  const [loading, setLoading] = useState(false);

  // Dice game: bet on outcome (1-6)
  const playDice = async (betAmount: number, prediction: number): Promise<{
    error?: string;
    result?: number;
    won?: boolean;
    payout?: number;
  }> => {
    if (!userId) return { error: 'Not authenticated' };
    if (prediction < 1 || prediction > 6) return { error: 'Invalid prediction' };

    setLoading(true);

    try {
      // Deduct bet amount
      const { data: goldData, error: goldError } = await supabase
        .rpc('safe_deduct_gold', {
          p_lizard_id: userId,
          p_amount: betAmount,
          p_reason: 'casino_dice_bet'
        })
        .single();

      if (goldError) throw goldError;

      const goldResult = goldData as SafeGoldResult;
      if (!goldResult?.success) {
        setLoading(false);
        return { error: goldResult?.error_message || 'Not enough gold' };
      }

      // Roll dice (1-6)
      const result = Math.floor(Math.random() * 6) + 1;
      const won = result === prediction;

      // Payout: 5x if win (5:1 odds, house edge ~16.67%)
      const payout = won ? betAmount * 5 : 0;

      if (payout > 0) {
        await supabase.rpc('safe_add_gold', {
          p_lizard_id: userId,
          p_amount: payout,
          p_add_to_total: false // Don't add to total earned
        });
      }

      setLoading(false);
      return { result, won, payout };
    } catch (err: any) {
      console.error('Dice error:', err);
      setLoading(false);
      return { error: err.message || 'Dice game failed' };
    }
  };

  // Plinko game: drop ball through pegs
  const playPlinko = async (betAmount: number): Promise<{
    error?: string;
    multiplier?: number;
    payout?: number;
  }> => {
    if (!userId) return { error: 'Not authenticated' };

    setLoading(true);

    try {
      // Deduct bet
      const { data: goldData, error: goldError } = await supabase
        .rpc('safe_deduct_gold', {
          p_lizard_id: userId,
          p_amount: betAmount,
          p_reason: 'casino_plinko_bet'
        })
        .single();

      if (goldError) throw goldError;

      const goldResult = goldData as SafeGoldResult;
      if (!goldResult?.success) {
        setLoading(false);
        return { error: goldResult?.error_message || 'Not enough gold' };
      }

      // Multipliers: [0.1x, 0.5x, 1x, 2x, 5x, 10x, 100x]
      // Probabilities weighted toward center (bell curve)
      const multipliers = [100, 10, 5, 2, 1, 0.5, 0.1];
      const weights = [0.001, 0.01, 0.1, 0.3, 0.3, 0.2, 0.089]; // Total: 1.0

      const random = Math.random();
      let cumulative = 0;
      let multiplier = 1;

      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
          multiplier = multipliers[i];
          break;
        }
      }

      const payout = Math.floor(betAmount * multiplier);

      if (payout > 0) {
        await supabase.rpc('safe_add_gold', {
          p_lizard_id: userId,
          p_amount: payout,
          p_add_to_total: false
        });
      }

      setLoading(false);
      return { multiplier, payout };
    } catch (err: any) {
      console.error('Plinko error:', err);
      setLoading(false);
      return { error: err.message || 'Plinko failed' };
    }
  };

  // Mystery Box: random multiplier 0.1x - 1000x
  const openMysteryBox = async (cost: number): Promise<{
    error?: string;
    multiplier?: number;
    payout?: number;
  }> => {
    if (!userId) return { error: 'Not authenticated' };

    setLoading(true);

    try {
      // Deduct cost
      const { data: goldData, error: goldError } = await supabase
        .rpc('safe_deduct_gold', {
          p_lizard_id: userId,
          p_amount: cost,
          p_reason: 'casino_mystery_box'
        })
        .single();

      if (goldError) throw goldError;

      const goldResult = goldData as SafeGoldResult;
      if (!goldResult?.success) {
        setLoading(false);
        return { error: goldResult?.error_message || 'Not enough gold' };
      }

      // Weighted random multipliers
      const random = Math.random();
      let multiplier = 0;

      if (random < 0.50) multiplier = 0.1;        // 50% - lose 90%
      else if (random < 0.75) multiplier = 0.5;   // 25% - lose 50%
      else if (random < 0.90) multiplier = 1.0;   // 15% - break even
      else if (random < 0.95) multiplier = 2.0;   // 5% - double
      else if (random < 0.98) multiplier = 5.0;   // 3% - 5x
      else if (random < 0.995) multiplier = 10.0; // 1.5% - 10x
      else if (random < 0.999) multiplier = 100.0; // 0.4% - 100x!!!
      else multiplier = 1000.0;                    // 0.1% - 1000x!!!!

      const payout = Math.floor(cost * multiplier);

      if (payout > 0) {
        await supabase.rpc('safe_add_gold', {
          p_lizard_id: userId,
          p_amount: payout,
          p_add_to_total: false
        });
      }

      setLoading(false);
      return { multiplier, payout };
    } catch (err: any) {
      console.error('Mystery box error:', err);
      setLoading(false);
      return { error: err.message || 'Mystery box failed' };
    }
  };

  return {
    loading,
    playDice,
    playPlinko,
    openMysteryBox,
  };
}
