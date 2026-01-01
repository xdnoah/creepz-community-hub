import { useState } from 'react';
import { useShop } from '../../hooks/useShop';
import { EquipmentCard } from './EquipmentCard';

interface ShopTabProps {
  userId: string;
  userGold: number;
}

export function ShopTab({ userId, userGold }: ShopTabProps) {
  const { shopItems, loading, canRefresh, timeUntilRefresh, refreshShop, buyItem } = useShop(userId);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleBuy = async (itemId: string, price: number) => {
    if (userGold < price) return;

    setBuyingItemId(itemId);
    const item = shopItems.find((i) => i.id === itemId);
    if (!item) return;

    const result = await buyItem(item);
    setBuyingItemId(null);

    if (result.error) {
      alert(result.error);
    }
  };

  const handleRefresh = async () => {
    const result = await refreshShop();
    if (result.error) {
      alert(result.error);
    }
  };

  if (loading && shopItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading shop...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
            <span>🏪</span>
            <span>Equipment Shop</span>
          </h2>
          <p className="text-sm text-gray-600">Buy equipment to boost your lizard's stats!</p>
        </div>

        {/* Refresh Button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleRefresh}
            disabled={!canRefresh || loading}
            className={`px-4 py-2 rounded font-bold text-white transition-colors ${
              canRefresh
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            🔄 Refresh Shop
          </button>
          {!canRefresh && (
            <div className="text-xs text-gray-600">
              Next refresh: {formatTime(timeUntilRefresh)}
            </div>
          )}
        </div>
      </div>

      {/* Gold Display */}
      <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="text-xl font-bold text-yellow-800">
            {userGold.toLocaleString()} Gold
          </span>
        </div>
      </div>

      {/* Shop Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {shopItems.map((item) => (
            <EquipmentCard
              key={item.id}
              item={item}
              showPrice
              onAction={() => handleBuy(item.id, item.price)}
              actionLabel={buyingItemId === item.id ? 'Buying...' : 'Buy'}
              actionDisabled={
                userGold < item.price || buyingItemId === item.id
              }
              actionColor={
                userGold < item.price
                  ? 'bg-gray-400'
                  : 'bg-green-500 hover:bg-green-600'
              }
            />
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 6 - shopItems.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 rounded flex items-center justify-center min-h-[120px]"
            >
              <div className="text-gray-600 text-center">
                <div className="text-3xl mb-1 opacity-30">📦</div>
                <div className="text-[10px]">Empty</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
