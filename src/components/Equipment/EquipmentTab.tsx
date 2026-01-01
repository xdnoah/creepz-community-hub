import { useState } from 'react';
import { useEquipment } from '../../hooks/useEquipment';
import { EquipmentCard } from './EquipmentCard';
import type { Equipment, EquipmentType } from '../../types';
import { EQUIPMENT_TYPE_NAMES, EQUIPMENT_TYPE_ICONS } from '../../types';

interface EquipmentTabProps {
  userId: string;
}

const EQUIPMENT_SLOTS: EquipmentType[] = [
  'helmet',
  'chest',
  'gloves',
  'boots',
  'weapon',
  'shield',
  'ring',
  'necklace',
  'belt',
  'cape',
];

export function EquipmentTab({ userId }: EquipmentTabProps) {
  const {
    equipment,
    loading,
    maxInventorySize,
    inventoryCount,
    getEquippedItems,
    getInventoryItems,
    equipItem,
    unequipItem,
    deleteItem,
  } = useEquipment(userId);

  const [actioningItemId, setActioningItemId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const equippedItems = getEquippedItems();
  const inventoryItems = getInventoryItems();

  const getEquippedItem = (type: EquipmentType): Equipment | undefined => {
    return equippedItems.find((item) => item.equipment_type === type);
  };

  const handleEquip = async (itemId: string) => {
    setActioningItemId(itemId);
    const result = await equipItem(itemId);
    setActioningItemId(null);

    if (result.error) {
      alert(result.error);
    }
  };

  const handleUnequip = async (itemId: string) => {
    setActioningItemId(itemId);
    const result = await unequipItem(itemId);
    setActioningItemId(null);

    if (result.error) {
      alert(result.error);
    }
  };

  const handleDelete = async (item: Equipment) => {
    if (deleteConfirm !== item.id) {
      setDeleteConfirm(item.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    setActioningItemId(item.id);
    const result = await deleteItem(item);
    setActioningItemId(null);
    setDeleteConfirm(null);

    if (result.error) {
      alert(result.error);
    }
  };

  if (loading && equipment.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading equipment...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
          <span>⚔️</span>
          <span>Equipment & Inventory</span>
        </h2>
        <p className="text-sm text-gray-600">
          Equip items to boost your stats. Inventory: {inventoryCount}/{maxInventorySize}
        </p>
      </div>

      {/* Equipped Slots */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>👕</span>
          <span>Equipped Items</span>
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {EQUIPMENT_SLOTS.map((type) => {
            const item = getEquippedItem(type);

            if (item) {
              return (
                <EquipmentCard
                  key={type}
                  item={item}
                  onAction={() => handleUnequip(item.id)}
                  actionLabel={actioningItemId === item.id ? 'Unequipping...' : 'Unequip'}
                  actionColor="bg-orange-500 hover:bg-orange-600"
                  actionDisabled={actioningItemId === item.id}
                />
              );
            }

            return (
              <div
                key={type}
                className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 rounded p-2 flex flex-col items-center justify-center min-h-[120px]"
              >
                <span className="text-2xl mb-0.5 opacity-30">{EQUIPMENT_TYPE_ICONS[type]}</span>
                <span className="text-[10px] text-gray-500 text-center">
                  {EQUIPMENT_TYPE_NAMES[type]}
                </span>
                <span className="text-[9px] text-gray-600 mt-0.5">Empty</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory */}
      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🎒</span>
          <span>Inventory ({inventoryItems.length}/{maxInventorySize})</span>
        </h3>

        {inventoryItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <div>Your inventory is empty</div>
            <div className="text-sm">Visit the shop to buy equipment!</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {inventoryItems.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                onAction={() => handleEquip(item.id)}
                actionLabel={actioningItemId === item.id ? 'Equipping...' : 'Equip'}
                actionColor="bg-blue-500 hover:bg-blue-600"
                actionDisabled={actioningItemId === item.id}
                secondaryAction={() => handleDelete(item)}
                secondaryLabel={deleteConfirm === item.id ? 'Confirm?' : 'Sell (25%)'}
                secondaryColor={
                  deleteConfirm === item.id
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-500 hover:bg-gray-600'
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
