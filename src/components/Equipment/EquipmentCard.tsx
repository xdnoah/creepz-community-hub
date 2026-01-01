import type { Equipment, ShopItem } from '../../types';
import {
  EQUIPMENT_TYPE_NAMES,
  EQUIPMENT_TYPE_ICONS,
  RARITY_COLORS,
  RARITY_BORDER_COLORS,
  STAT_TYPE_NAMES,
  STAT_TYPE_ICONS,
} from '../../types';

interface EquipmentCardProps {
  item: Equipment | ShopItem;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionColor?: string;
  secondaryAction?: () => void;
  secondaryLabel?: string;
  secondaryColor?: string;
  showPrice?: boolean;
}

export function EquipmentCard({
  item,
  onAction,
  actionLabel,
  actionDisabled = false,
  actionColor = 'bg-blue-500 hover:bg-blue-600',
  secondaryAction,
  secondaryLabel,
  secondaryColor = 'bg-gray-500 hover:bg-gray-600',
  showPrice = false,
}: EquipmentCardProps) {
  const formatStatValue = (type: string, value: number): string => {
    if (type === 'crit_rate' || type === 'crit_damage') {
      return `+${(value * 100).toFixed(1)}%`;
    }
    if (type === 'gold_per_second' || type === 'regeneration') {
      return `+${value.toFixed(1)}/s`;
    }
    if (type === 'attack_speed') {
      return `+${Math.floor(value)}`;
    }
    return `+${Math.floor(value)}`;
  };

  const price = 'price' in item ? item.price : item.purchase_price;

  return (
    <div
      className={`relative bg-gradient-to-b from-gray-900 to-black rounded border-2 ${RARITY_BORDER_COLORS[item.rarity]} shadow-lg overflow-hidden hover:shadow-xl transition-all hover:scale-105`}
    >
      {/* Rarity glow effect */}
      <div className={`absolute inset-0 ${RARITY_COLORS[item.rarity]} opacity-10 pointer-events-none`} />

      {/* Content */}
      <div className="p-2 relative z-10">
        {/* Header: Icon + Type + Level */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-2xl drop-shadow-lg">{EQUIPMENT_TYPE_ICONS[item.equipment_type]}</span>
          <div className="flex-1 min-w-0">
            <div className={`font-bold text-xs ${RARITY_COLORS[item.rarity]} truncate`}>
              {EQUIPMENT_TYPE_NAMES[item.equipment_type]}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-yellow-400 bg-gray-800 px-1 rounded">
                LVL {item.level}
              </span>
            </div>
          </div>
        </div>

        {/* Stats - Compact */}
        <div className="space-y-0.5 mb-1.5">
          {item.stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between text-[10px]">
              <span className="text-gray-400 flex items-center gap-0.5">
                <span className="text-xs">{STAT_TYPE_ICONS[stat.type]}</span>
                {STAT_TYPE_NAMES[stat.type]}
              </span>
              <span className="font-bold text-green-400">
                {formatStatValue(stat.type, stat.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Price */}
        {showPrice && (
          <div className="flex items-center justify-center gap-0.5 mb-1.5 text-[10px] font-bold text-yellow-400">
            <span>💰</span>
            <span>{price.toLocaleString()}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1">
          {onAction && (
            <button
              onClick={onAction}
              disabled={actionDisabled}
              className={`flex-1 ${actionColor} text-white font-bold py-1 px-2 rounded text-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {actionLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction}
              className={`flex-1 ${secondaryColor} text-white font-bold py-1 px-2 rounded text-[10px] transition-colors`}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
