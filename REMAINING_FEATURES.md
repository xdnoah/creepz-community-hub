# Remaining Features Implementation Guide

## Overview
This document outlines the implementation plan for the final 2 major features that were not completed in this session.

---

## 🎰 Feature 1: Casino System

### Requirements
Create a Casino window with 3 gambling games where users can bet gold:
1. **Dice Game** - Bet on dice outcomes
2. **Plinko/Ball Drop** - Ball falls through pegs with multipliers
3. **Mystery Box** - Multiply gold with luck

**Important:** Always include small odds to win big amounts

### Database Schema

Create `supabase/migrations/016_casino_system.sql`:

```sql
-- Casino System
-- Track casino statistics and ensure fair odds

CREATE TABLE IF NOT EXISTS casino_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Game statistics
  dice_games_played INTEGER NOT NULL DEFAULT 0,
  dice_total_wagered BIGINT NOT NULL DEFAULT 0,
  dice_total_won BIGINT NOT NULL DEFAULT 0,

  plinko_games_played INTEGER NOT NULL DEFAULT 0,
  plinko_total_wagered BIGINT NOT NULL DEFAULT 0,
  plinko_total_won BIGINT NOT NULL DEFAULT 0,

  mystery_box_opened INTEGER NOT NULL DEFAULT 0,
  mystery_box_total_spent BIGINT NOT NULL DEFAULT 0,
  mystery_box_total_won BIGINT NOT NULL DEFAULT 0,

  -- Anti-abuse: daily limits
  last_casino_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_wagers BIGINT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE casino_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own casino stats"
  ON casino_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own casino stats"
  ON casino_stats FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_casino_stats_user_id ON casino_stats(user_id);
```

### Frontend Implementation

#### 1. Create Casino Window

`src/types/index.ts` - Add to WindowType:
```typescript
export type WindowType = '... | 'casino';
```

`src/types/index.ts` - Add to WINDOW_DEFAULTS:
```typescript
casino: { width: 900, height: 700, x: 100, y: 50 },
```

#### 2. Create Casino Hook

`src/hooks/useCasino.ts`:
```typescript
import { useState, useCallback } from 'react';
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
```

#### 3. Create Casino Window Component

`src/components/Windows/CasinoWindow.tsx`:
```tsx
import { useState } from 'react';
import { Window } from './Window';
import { useCasino } from '../../hooks/useCasino';
import { useLizard } from '../../hooks/useLizard';
import { useAuth } from '../../contexts/AuthContext';
import type { WindowState } from '../../types';

export function CasinoWindow({ window }: { window: WindowState }) {
  const { user } = useAuth();
  const { lizard } = useLizard();
  const { loading, playDice, playPlinko, openMysteryBox } = useCasino(user?.id);

  const [activeTab, setActiveTab] = useState<'dice' | 'plinko' | 'mystery'>('dice');
  const [betAmount, setBetAmount] = useState(100);
  const [dicePrediction, setDicePrediction] = useState(6);
  const [lastResult, setLastResult] = useState<string>('');

  const handleDicePlay = async () => {
    const result = await playDice(betAmount, dicePrediction);
    if (result.error) {
      setLastResult(`❌ ${result.error}`);
    } else if (result.won) {
      setLastResult(`🎉 WON! Rolled ${result.result}. +${result.payout} gold!`);
    } else {
      setLastResult(`Lost. Rolled ${result.result}. Better luck next time!`);
    }
  };

  const handlePlinkoPlay = async () => {
    const result = await playPlinko(betAmount);
    if (result.error) {
      setLastResult(`❌ ${result.error}`);
    } else {
      setLastResult(`${result.multiplier}x multiplier! ${result.payout > betAmount ? 'WON' : 'Lost'} ${result.payout} gold!`);
    }
  };

  const handleMysteryBox = async () => {
    const result = await openMysteryBox(betAmount);
    if (result.error) {
      setLastResult(`❌ ${result.error}`);
    } else if (result.multiplier! >= 10) {
      setLastResult(`🎰🎰🎰 JACKPOT! ${result.multiplier}x! Won ${result.payout} gold!!!`);
    } else {
      setLastResult(`${result.multiplier}x - ${result.payout} gold`);
    }
  };

  if (!lizard) return null;

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900">
        {/* Tabs */}
        <div className="flex border-b-2 border-yellow-500">
          {[
            { id: 'dice', label: '🎲 Dice', color: 'from-red-500 to-orange-500' },
            { id: 'plinko', label: '🎯 Plinko', color: 'from-blue-500 to-cyan-500' },
            { id: 'mystery', label: '🎁 Mystery Box', color: 'from-purple-500 to-pink-500' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 font-bold transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Gold Display */}
          <div className="bg-yellow-400 border-4 border-yellow-600 rounded-lg p-4 mb-6 text-center">
            <div className="text-2xl font-black text-gray-900">
              💰 {Math.floor(lizard.gold).toLocaleString()} GOLD
            </div>
          </div>

          {/* Bet Amount */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg mb-6">
            <label className="text-white font-bold mb-2 block">Bet Amount:</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 rounded bg-gray-800 text-white font-bold text-xl"
              min="1"
            />
          </div>

          {/* Game-specific content */}
          {activeTab === 'dice' && (
            <div className="space-y-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg">
                <label className="text-white font-bold mb-2 block">Predict Number (1-6):</label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setDicePrediction(num)}
                      className={`py-4 rounded font-bold text-2xl ${
                        dicePrediction === num
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleDicePlay}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-xl rounded-lg shadow-lg"
              >
                {loading ? 'Rolling...' : '🎲 Roll Dice (5:1 Payout)'}
              </button>
            </div>
          )}

          {activeTab === 'plinko' && (
            <div className="space-y-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <div className="font-bold mb-2">Multipliers:</div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['100x', '10x', '5x', '2x', '1x', '0.5x', '0.1x'].map((m) => (
                    <div key={m} className="bg-gray-700 py-1 rounded">{m}</div>
                  ))}
                </div>
              </div>
              <button
                onClick={handlePlinkoPlay}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-xl rounded-lg shadow-lg"
              >
                {loading ? 'Dropping...' : '🎯 Drop Ball'}
              </button>
            </div>
          )}

          {activeTab === 'mystery' && (
            <div className="space-y-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <div className="font-bold mb-2">Possible Multipliers:</div>
                <div className="space-y-1">
                  <div>0.1x - 50% chance</div>
                  <div>0.5x - 25% chance</div>
                  <div>1x - 15% chance</div>
                  <div>2x - 5% chance</div>
                  <div>5x - 3% chance</div>
                  <div>10x - 1.5% chance</div>
                  <div className="text-yellow-400 font-bold">100x - 0.4% chance!!!</div>
                  <div className="text-yellow-400 font-bold">1000x - 0.1% chance!!!!</div>
                </div>
              </div>
              <button
                onClick={handleMysteryBox}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xl rounded-lg shadow-lg animate-pulse"
              >
                {loading ? 'Opening...' : '🎁 Open Mystery Box'}
              </button>
            </div>
          )}

          {/* Result */}
          {lastResult && (
            <div className="mt-6 bg-yellow-400 border-4 border-yellow-600 rounded-lg p-4 text-center font-bold text-gray-900">
              {lastResult}
            </div>
          )}
        </div>
      </div>
    </Window>
  );
}
```

#### 4. Wire it up

Add to `src/components/Desktop/Desktop.tsx`:
```typescript
import { CasinoWindow } from '../Windows/CasinoWindow';

// In windows map:
case 'casino':
  return <CasinoWindow key={window.id} window={window} />;
```

Add to `src/components/Desktop/StartMenu.tsx`:
```typescript
<MenuItem
  icon="🎰"
  label="Casino"
  onClick={() => handleOpenWindow('casino')}
/>
```

---

## 🦎 Feature 2: Visual Customized Lizard

### Requirements
Make the customized lizard appear visually with the accessories (crown, hat, eyes, etc.)

### Implementation Strategy

Since we can't modify the 🦎 emoji itself, we'll create a composite visual representation:

#### Create Lizard Avatar Component

`src/components/Lizard/LizardAvatar.tsx`:
```tsx
import type { Lizard } from '../../types';

interface LizardAvatarProps {
  lizard: Lizard;
  size?: 'small' | 'medium' | 'large';
}

const ACCESSORY_EMOJIS = {
  crown: {
    gold: '👑',
    silver: '🥈',
    jeweled: '💎',
    spike: '⚡',
    flower: '🌸',
  },
  hat: {
    top: '🎩',
    wizard: '🧙',
    party: '🎉',
    baseball: '🧢',
    cowboy: '🤠',
    santa: '🎅',
  },
  accessory: {
    glasses: '👓',
    monocle: '🧐',
    sunglasses: '😎',
    bowtie: '🎀',
    necklace: '📿',
  },
  eyes: {
    normal: '👀',
    happy: '😊',
    angry: '😠',
    sleepy: '😴',
    heart: '😍',
    star: '🤩',
  },
  background: {
    sparkles: '✨',
    flames: '🔥',
    hearts: '💕',
    stars: '⭐',
    bubbles: '🫧',
  },
};

const SIZE_CLASSES = {
  small: 'text-4xl',
  medium: 'text-6xl',
  large: 'text-9xl',
};

const BG_COLORS = {
  green: 'bg-green-200 border-green-500',
  red: 'bg-red-200 border-red-500',
  blue: 'bg-blue-200 border-blue-500',
  purple: 'bg-purple-200 border-purple-500',
  gold: 'bg-yellow-200 border-yellow-500',
  pink: 'bg-pink-200 border-pink-500',
  cyan: 'bg-cyan-200 border-cyan-500',
  orange: 'bg-orange-200 border-orange-500',
  indigo: 'bg-indigo-200 border-indigo-500',
};

export function LizardAvatar({ lizard, size = 'medium' }: LizardAvatarProps) {
  const bgColor = BG_COLORS[lizard.color as keyof typeof BG_COLORS] || BG_COLORS.green;

  return (
    <div className="relative inline-block">
      {/* Background effect */}
      {lizard.background_effect !== 'none' && (
        <div className="absolute inset-0 flex items-center justify-center opacity-30 animate-pulse">
          <span className={SIZE_CLASSES[size]}>
            {ACCESSORY_EMOJIS.background[lizard.background_effect as keyof typeof ACCESSORY_EMOJIS.background]}
          </span>
        </div>
      )}

      {/* Main container */}
      <div className={`relative ${bgColor} rounded-full p-4 border-4 inline-block`}>
        {/* Crown (on top) */}
        {lizard.crown !== 'none' && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <span className="text-3xl">
              {ACCESSORY_EMOJIS.crown[lizard.crown as keyof typeof ACCESSORY_EMOJIS.crown]}
            </span>
          </div>
        )}

        {/* Hat (on top) */}
        {lizard.hat !== 'none' && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="text-2xl">
              {ACCESSORY_EMOJIS.hat[lizard.hat as keyof typeof ACCESSORY_EMOJIS.hat]}
            </span>
          </div>
        )}

        {/* Main lizard */}
        <div className={SIZE_CLASSES[size]}>🦎</div>

        {/* Eyes overlay */}
        {lizard.eye_style !== 'normal' && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-xl">
              {ACCESSORY_EMOJIS.eyes[lizard.eye_style as keyof typeof ACCESSORY_EMOJIS.eyes]}
            </span>
          </div>
        )}

        {/* Accessory (glasses, etc) */}
        {lizard.accessory !== 'none' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-2xl">
              {ACCESSORY_EMOJIS.accessory[lizard.accessory as keyof typeof ACCESSORY_EMOJIS.accessory]}
            </span>
          </div>
        )}
      </div>

      {/* Pattern indicator (small badge) */}
      {lizard.pattern !== 'solid' && (
        <div className="absolute bottom-0 right-0 bg-white border-2 border-gray-400 rounded-full px-2 py-1 text-xs font-bold">
          {lizard.pattern}
        </div>
      )}
    </div>
  );
}
```

#### Use LizardAvatar Throughout App

Replace all instances of plain 🦎 emoji with:
```tsx
<LizardAvatar lizard={lizard} size="medium" />
```

Key places:
- `LizardGoshiWindow.tsx` - Main game view
- `CustomizeTab.tsx` - Preview section
- `FightTab.tsx` - Leaderboard entries
- `LizardFightWindow.tsx` - Fight screen

---

## 📦 Database Migrations to Apply

Run these in order in your Supabase SQL Editor:

1. ✅ `011_fix_gold_constraints.sql` - Already created
2. ✅ `012_lizard_accessories.sql` - Already created
3. ✅ `013_lower_attack_stats.sql` - Already created
4. ✅ `014_dynamic_shop_size.sql` - Already created
5. ✅ `015_talent_tree_system.sql` - Already created
6. ⏳ `016_casino_system.sql` - Create as shown above

---

## 🚀 Next Session Checklist

- [ ] Apply migration 016 (Casino)
- [ ] Implement Casino hook (`useCasino.ts`)
- [ ] Create Casino window component
- [ ] Add Casino to window types and defaults
- [ ] Wire up Casino in Desktop and StartMenu
- [ ] Create LizardAvatar component
- [ ] Replace emoji lizards with LizardAvatar throughout app
- [ ] Test all casino games
- [ ] Test visual customization
- [ ] Deploy!

---

## 💡 Notes

- Casino odds are balanced for slight house edge
- Mystery Box has 0.1% chance for 1000x (huge win!)
- LizardAvatar uses layered emojis for visual customization
- All games use safe_deduct_gold/safe_add_gold for safety
