import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ShopItem, SafeGoldResult } from '../types';

const SHOP_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

export function useShop(userId: string | undefined) {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canRefresh, setCanRefresh] = useState(false);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(0);

  // Fetch shop items
  const fetchShop = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('shop_inventory')
        .select('*')
        .eq('user_id', userId)
        .order('slot');

      if (fetchError) throw fetchError;

      // If shop is empty or doesn't exist, generate initial shop
      if (!data || data.length === 0) {
        await refreshShop();
        return;
      }

      setShopItems(data);

      // Check if shop can be refreshed
      if (data.length > 0) {
        const lastRefresh = new Date(data[0].last_refresh).getTime();
        const now = Date.now();
        const timeSinceRefresh = now - lastRefresh;

        setCanRefresh(timeSinceRefresh >= SHOP_REFRESH_INTERVAL);
        setTimeUntilRefresh(Math.max(0, SHOP_REFRESH_INTERVAL - timeSinceRefresh));
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching shop:', err);
      setError(err.message || 'Failed to load shop');
      setLoading(false);
    }
  }, [userId]);

  // Refresh shop (generate new items)
  const refreshShop = async (): Promise<{ error?: string }> => {
    if (!userId) return { error: 'No user ID' };
    if (!canRefresh && shopItems.length > 0) {
      return { error: 'Shop refresh on cooldown' };
    }

    try {
      setLoading(true);
      setError(null);

      // Call database function to refresh shop
      const { error: rpcError } = await supabase.rpc('refresh_shop', {
        p_user_id: userId,
      });

      if (rpcError) throw rpcError;

      // Fetch new shop items
      await fetchShop();

      return {};
    } catch (err: any) {
      console.error('Error refreshing shop:', err);
      const errorMessage = err.message || 'Failed to refresh shop';
      setError(errorMessage);
      setLoading(false);
      return { error: errorMessage };
    }
  };

  // Buy item from shop
  const buyItem = async (shopItem: ShopItem): Promise<{ error?: string }> => {
    if (!userId) return { error: 'No user ID' };

    try {
      // Check if user has enough gold
      const { data: lizard, error: lizardError } = await supabase
        .from('lizards')
        .select('gold')
        .eq('id', userId)
        .single();

      if (lizardError) throw lizardError;
      if (!lizard) return { error: 'Lizard not found' };

      if (lizard.gold < shopItem.price) {
        return { error: 'Not enough gold' };
      }

      // Check inventory space (max 20 items)
      const { data: inventory, error: invError } = await supabase
        .from('user_equipment')
        .select('id')
        .eq('user_id', userId);

      if (invError) throw invError;

      if (inventory && inventory.length >= 20) {
        return { error: 'Inventory full (max 20 items)' };
      }

      // Start transaction: deduct gold, add item to inventory, remove from shop
      // 1. Deduct gold using safe function
      const { data, error: goldError } = await supabase
        .rpc('safe_deduct_gold', {
          p_lizard_id: userId,
          p_amount: shopItem.price,
          p_reason: 'shop_purchase'
        })
        .single();

      if (goldError) throw goldError;

      const goldResult = data as SafeGoldResult;
      if (goldResult && !goldResult.success) {
        return { error: goldResult.error_message || 'Failed to deduct gold' };
      }

      // 2. Add to user equipment
      const { error: equipError } = await supabase
        .from('user_equipment')
        .insert({
          user_id: userId,
          equipment_type: shopItem.equipment_type,
          rarity: shopItem.rarity,
          level: shopItem.level,
          stats: shopItem.stats,
          purchase_price: shopItem.price,
          is_equipped: false,
        });

      if (equipError) throw equipError;

      // 3. Remove from shop
      const { error: deleteError } = await supabase
        .from('shop_inventory')
        .delete()
        .eq('id', shopItem.id);

      if (deleteError) throw deleteError;

      // Refresh shop display
      await fetchShop();

      return {};
    } catch (err: any) {
      console.error('Error buying item:', err);
      return { error: err.message || 'Failed to buy item' };
    }
  };

  // Update refresh timer
  useEffect(() => {
    if (timeUntilRefresh === 0) {
      setCanRefresh(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        const newTime = Math.max(0, prev - 1000);
        if (newTime === 0) {
          setCanRefresh(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUntilRefresh]);

  // Fetch shop on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchShop();
    }
  }, [userId, fetchShop]);

  // Subscribe to shop changes
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`shop_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_inventory',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchShop();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchShop]);

  return {
    shopItems,
    loading,
    error,
    canRefresh,
    timeUntilRefresh,
    refreshShop,
    buyItem,
    refetch: fetchShop,
  };
}
