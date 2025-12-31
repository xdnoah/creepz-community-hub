import type { Equipment, ShopItem } from '../../types';
import {
  EQUIPMENT_TYPE_NAMES,
  EQUIPMENT_TYPE_ICONS,
  RARITY_COLORS,
  RARITY_BORDER_COLORS,
  RARITY_NAMES,
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
      className={`relative bg-white rounded-lg border-4 ${RARITY_BORDER_COLORS[item.rarity]} shadow-lg overflow-hidden hover:shadow-xl transition-shadow`}
    >
      {/* Rarity Banner */}
      <div className={`${RARITY_COLORS[item.rarity]} px-3 py-1 text-center font-bold text-sm`}>
        {RARITY_NAMES[item.rarity]}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Icon and Type */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">{EQUIPMENT_TYPE_ICONS[item.equipment_type]}</span>
          <div className="flex-1">
            <div className="font-bold text-gray-900">
              {EQUIPMENT_TYPE_NAMES[item.equipment_type]}
            </div>
            <div className="text-xs text-gray-600">Level {item.level}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded p-2 mb-2 space-y-1">
          {item.stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                <span>{STAT_TYPE_ICONS[stat.type]}</span>
                <span>{STAT_TYPE_NAMES[stat.type]}</span>
              </div>
              <div className="text-sm font-bold text-green-600">
                {formatStatValue(stat.type, stat.value)}
              </div>
            </div>
          ))}
        </div>

        {/* Price */}
        {showPrice && (
          <div className="flex items-center justify-center gap-1 mb-2 text-sm font-bold text-yellow-700">
            <span>💰</span>
            <span>{price.toLocaleString()}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onAction && (
            <button
              onClick={onAction}
              disabled={actionDisabled}
              className={`flex-1 ${actionColor} text-white font-bold py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
            >
              {actionLabel}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction}
              className={`flex-1 ${secondaryColor} text-white font-bold py-2 rounded transition-colors text-sm`}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
