import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Equipment, EquipmentType } from '../types';

const MAX_INVENTORY_SIZE = 20;

export function useEquipment(userId: string | undefined) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all equipment for user
  const fetchEquipment = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_equipment')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEquipment(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching equipment:', err);
      setError(err.message || 'Failed to load equipment');
      setLoading(false);
    }
  }, [userId]);

  // Get equipped items
  const getEquippedItems = useCallback((): Equipment[] => {
    return equipment.filter((item) => item.is_equipped);
  }, [equipment]);

  // Get inventory items (not equipped)
  const getInventoryItems = useCallback((): Equipment[] => {
    return equipment.filter((item) => !item.is_equipped);
  }, [equipment]);

  // Check if a slot is occupied
  const isSlotOccupied = useCallback(
    (equipmentType: EquipmentType): boolean => {
      return equipment.some(
        (item) => item.is_equipped && item.equipment_type === equipmentType
      );
    },
    [equipment]
  );

  // Equip an item
  const equipItem = async (itemId: string): Promise<{ error?: string }> => {
    if (!userId) return { error: 'No user ID' };

    try {
      // Get the item to equip
      const itemToEquip = equipment.find((item) => item.id === itemId);
      if (!itemToEquip) return { error: 'Item not found' };

      // Check if slot is already occupied
      const occupiedItem = equipment.find(
        (item) =>
          item.is_equipped && item.equipment_type === itemToEquip.equipment_type
      );

      // If slot is occupied, unequip the existing item first
      if (occupiedItem) {
        const { error: unequipError } = await supabase
          .from('user_equipment')
          .update({ is_equipped: false })
          .eq('id', occupiedItem.id);

        if (unequipError) throw unequipError;
      }

      // Equip the new item
      const { error: equipError } = await supabase
        .from('user_equipment')
        .update({ is_equipped: true })
        .eq('id', itemId);

      if (equipError) throw equipError;

      await fetchEquipment();
      return {};
    } catch (err: any) {
      console.error('Error equipping item:', err);
      return { error: err.message || 'Failed to equip item' };
    }
  };

  // Unequip an item
  const unequipItem = async (itemId: string): Promise<{ error?: string }> => {
    if (!userId) return { error: 'No user ID' };

    try {
      const { error: unequipError } = await supabase
        .from('user_equipment')
        .update({ is_equipped: false })
        .eq('id', itemId);

      if (unequipError) throw unequipError;

      await fetchEquipment();
      return {};
    } catch (err: any) {
      console.error('Error unequipping item:', err);
      return { error: err.message || 'Failed to unequip item' };
    }
  };

  // Upgrade an item
  const upgradeItem = async (
    itemId: string,
    userGold: number
  ): Promise<{ error?: string; cost?: number }> => {
    if (!userId) return { error: 'No user ID' };

    try {
      // Find the item
      const item = equipment.find((eq) => eq.id === itemId);
      if (!item) return { error: 'Item not found' };

      // Check if max upgrade level reached
      if (item.upgrade_level >= 10) {
        return { error: 'Max upgrade level reached (10)' };
      }

      // Calculate upgrade cost: base_price * 0.5 * (level + 1)
      const cost = Math.floor(item.purchase_price * 0.5 * (item.upgrade_level + 1));

      // Check if user has enough gold
      if (userGold < cost) {
        return { error: `Not enough gold (need ${cost})` };
      }

      // Deduct gold from user
      const { data: lizard, error: fetchError } = await supabase
        .from('lizards')
        .select('gold')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!lizard) throw new Error('Lizard not found');

      const { error: updateGoldError } = await supabase
        .from('lizards')
        .update({ gold: Math.floor(lizard.gold - cost) })
        .eq('id', userId);

      if (updateGoldError) throw updateGoldError;

      // Upgrade the item
      const { error: upgradeError } = await supabase
        .from('user_equipment')
        .update({ upgrade_level: item.upgrade_level + 1 })
        .eq('id', itemId);

      if (upgradeError) throw upgradeError;

      await fetchEquipment();
      return { cost };
    } catch (err: any) {
      console.error('Error upgrading item:', err);
      return { error: err.message || 'Failed to upgrade item' };
    }
  };

  // Delete/sell an item (returns 25% of purchase price)
  const deleteItem = async (item: Equipment): Promise<{ error?: string; goldReturned?: number }> => {
    if (!userId) return { error: 'No user ID' };

    try {
      // Calculate gold to return (25% of purchase price)
      const goldReturned = Math.floor(item.purchase_price * 0.25);

      // Return gold to user
      const { error: goldError } = await supabase.rpc('increment', {
        table_name: 'lizards',
        row_id: userId,
        column_name: 'gold',
        amount: goldReturned,
      });

      // If rpc doesn't exist, use update
      if (goldError) {
        const { data: lizard, error: fetchError } = await supabase
          .from('lizards')
          .select('gold')
          .eq('id', userId)
          .single();

        if (fetchError) throw fetchError;
        if (!lizard) throw new Error('Lizard not found');

        const { error: updateError } = await supabase
          .from('lizards')
          .update({ gold: Math.floor(lizard.gold + goldReturned) })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      // Delete the item
      const { error: deleteError } = await supabase
        .from('user_equipment')
        .delete()
        .eq('id', item.id);

      if (deleteError) throw deleteError;

      await fetchEquipment();
      return { goldReturned };
    } catch (err: any) {
      console.error('Error deleting item:', err);
      return { error: err.message || 'Failed to delete item' };
    }
  };

  // Calculate total stats from equipped items
  const getEquipmentStats = useCallback(() => {
    const equipped = getEquippedItems();

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

    equipped.forEach((item) => {
      // Apply upgrade multiplier: +10% per upgrade level
      const upgradeMultiplier = 1 + (item.upgrade_level * 0.10);

      item.stats.forEach((stat) => {
        stats[stat.type] += stat.value * upgradeMultiplier;
      });
    });

    return stats;
  }, [getEquippedItems]);

  // Fetch equipment on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchEquipment();
    }
  }, [userId, fetchEquipment]);

  // Subscribe to equipment changes
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`equipment_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_equipment',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchEquipment();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, fetchEquipment]);

  return {
    equipment,
    loading,
    error,
    maxInventorySize: MAX_INVENTORY_SIZE,
    inventoryCount: equipment.length,
    getEquippedItems,
    getInventoryItems,
    isSlotOccupied,
    equipItem,
    unequipItem,
    upgradeItem,
    deleteItem,
    getEquipmentStats,
    refetch: fetchEquipment,
  };
}
