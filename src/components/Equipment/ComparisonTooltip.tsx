import { useState, useRef, useEffect } from 'react';
import type { Equipment, ShopItem, EquipmentStat } from '../../types';
import {
  STAT_TYPE_NAMES,
  STAT_TYPE_ICONS,
} from '../../types';

interface ComparisonTooltipProps {
  item: Equipment | ShopItem;
  equippedItem: Equipment | null;
  children: React.ReactNode;
}

export function ComparisonTooltip({ item, equippedItem, children }: ComparisonTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Show below if more space below than above
      setTooltipPosition(spaceBelow > spaceAbove ? 'bottom' : 'top');
    }
  }, [showTooltip]);

  if (!equippedItem) {
    return <div>{children}</div>;
  }

  const formatStatValue = (type: string, value: number): string => {
    if (type === 'crit_rate' || type === 'crit_damage') {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (type === 'gold_per_second' || type === 'regeneration') {
      return `${value.toFixed(1)}/s`;
    }
    if (type === 'attack_speed') {
      return `${Math.floor(value)}`;
    }
    return `${Math.floor(value)}`;
  };

  const getStatValue = (stats: EquipmentStat[], type: string): number => {
    const stat = stats.find(s => s.type === type);
    return stat ? stat.value : 0;
  };

  // Apply upgrade multiplier
  const getEffectiveStatValue = (value: number, upgradeLevel: number): number => {
    const multiplier = 1 + (upgradeLevel * 0.10);
    return value * multiplier;
  };

  // Get all unique stat types from both items
  const allStatTypes = new Set<string>();
  item.stats.forEach(stat => allStatTypes.add(stat.type));
  equippedItem.stats.forEach(stat => allStatTypes.add(stat.type));

  const comparisons = Array.from(allStatTypes).map(type => {
    const newBaseValue = getStatValue(item.stats, type);
    const oldBaseValue = getStatValue(equippedItem.stats, type);

    const newValue = getEffectiveStatValue(newBaseValue, item.upgrade_level);
    const oldValue = getEffectiveStatValue(oldBaseValue, equippedItem.upgrade_level);

    const diff = newValue - oldValue;

    return {
      type,
      newValue,
      oldValue,
      diff,
    };
  });

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}

      {showTooltip && (
        <div
          className={`absolute ${
            tooltipPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 transform -translate-x-1/2 z-50 pointer-events-none w-64`}
        >
          <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg shadow-2xl p-3">
            {/* Header */}
            <div className="text-center mb-2 pb-2 border-b border-gray-700">
              <div className="text-xs font-bold text-yellow-400">⚖️ Comparison vs Equipped</div>
            </div>

            {/* Stats Comparison */}
            <div className="space-y-1">
              {comparisons.map(({ type, newValue, oldValue, diff }) => {
                const isPositive = diff > 0;
                const isNegative = diff < 0;
                const isNeutral = diff === 0;

                return (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <span className="text-sm">{STAT_TYPE_ICONS[type as keyof typeof STAT_TYPE_ICONS]}</span>
                      <span>{STAT_TYPE_NAMES[type as keyof typeof STAT_TYPE_NAMES]}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        isPositive ? 'text-green-400' :
                        isNegative ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {isPositive && '+'}
                        {!isNeutral && formatStatValue(type, diff)}
                        {isNeutral && '='}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        ({formatStatValue(type, oldValue)} → {formatStatValue(type, newValue)})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall verdict */}
            <div className="mt-2 pt-2 border-t border-gray-700 text-center">
              {comparisons.some(c => c.diff > 0) ? (
                <div className="text-xs font-bold text-green-400">
                  ↑ Upgrade Available
                </div>
              ) : comparisons.some(c => c.diff < 0) ? (
                <div className="text-xs font-bold text-red-400">
                  ↓ Downgrade
                </div>
              ) : (
                <div className="text-xs font-bold text-gray-400">
                  = Same Stats
                </div>
              )}
            </div>

            {/* Arrow pointing to card */}
            <div
              className={`absolute ${
                tooltipPosition === 'top' ? 'top-full' : 'bottom-full'
              } left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-transparent ${
                tooltipPosition === 'top' ? 'border-t-8 border-t-yellow-500' : 'border-b-8 border-b-yellow-500'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
