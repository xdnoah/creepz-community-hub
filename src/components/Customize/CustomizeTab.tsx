import { useState } from 'react';
import type { Lizard } from '../../types';

interface CustomizeTabProps {
  lizard: Lizard;
  onUpdateCustomization: (field: string, value: string) => Promise<{ error?: string }>;
}

interface CustomizationOption {
  value: string;
  emoji: string;
  label: string;
}

const colorOptions: Array<{ name: string; value: string; bg: string; border: string }> = [
  { name: 'Green', value: 'green', bg: 'bg-green-500', border: 'border-green-600' },
  { name: 'Red', value: 'red', bg: 'bg-red-500', border: 'border-red-600' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-500', border: 'border-blue-600' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-500', border: 'border-purple-600' },
  { name: 'Gold', value: 'gold', bg: 'bg-yellow-500', border: 'border-yellow-600' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-500', border: 'border-pink-600' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-600' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-500', border: 'border-orange-600' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-500', border: 'border-indigo-600' },
];

const patternOptions: CustomizationOption[] = [
  { value: 'solid', emoji: '▓', label: 'Solid' },
  { value: 'stripes', emoji: '▒', label: 'Stripes' },
  { value: 'spots', emoji: '•', label: 'Spots' },
  { value: 'gradient', emoji: '▓▒░', label: 'Gradient' },
  { value: 'camo', emoji: '▨', label: 'Camo' },
];

const eyeOptions: CustomizationOption[] = [
  { value: 'normal', emoji: '👀', label: 'Normal' },
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'angry', emoji: '😠', label: 'Angry' },
  { value: 'sleepy', emoji: '😴', label: 'Sleepy' },
  { value: 'heart', emoji: '😍', label: 'Hearts' },
  { value: 'star', emoji: '🤩', label: 'Stars' },
];

const crownOptions: CustomizationOption[] = [
  { value: 'none', emoji: '❌', label: 'None' },
  { value: 'gold', emoji: '👑', label: 'Gold Crown' },
  { value: 'silver', emoji: '🥈', label: 'Silver Crown' },
  { value: 'jeweled', emoji: '💎', label: 'Jeweled' },
  { value: 'spike', emoji: '⚡', label: 'Spike Crown' },
  { value: 'flower', emoji: '🌸', label: 'Flower Crown' },
];

const hatOptions: CustomizationOption[] = [
  { value: 'none', emoji: '❌', label: 'None' },
  { value: 'top', emoji: '🎩', label: 'Top Hat' },
  { value: 'wizard', emoji: '🧙', label: 'Wizard Hat' },
  { value: 'party', emoji: '🎉', label: 'Party Hat' },
  { value: 'baseball', emoji: '🧢', label: 'Baseball Cap' },
  { value: 'cowboy', emoji: '🤠', label: 'Cowboy Hat' },
  { value: 'santa', emoji: '🎅', label: 'Santa Hat' },
];

const accessoryOptions: CustomizationOption[] = [
  { value: 'none', emoji: '❌', label: 'None' },
  { value: 'glasses', emoji: '👓', label: 'Glasses' },
  { value: 'monocle', emoji: '🧐', label: 'Monocle' },
  { value: 'sunglasses', emoji: '😎', label: 'Sunglasses' },
  { value: 'bowtie', emoji: '🎀', label: 'Bow Tie' },
  { value: 'necklace', emoji: '📿', label: 'Necklace' },
];

const backgroundEffectOptions: CustomizationOption[] = [
  { value: 'none', emoji: '❌', label: 'None' },
  { value: 'sparkles', emoji: '✨', label: 'Sparkles' },
  { value: 'flames', emoji: '🔥', label: 'Flames' },
  { value: 'hearts', emoji: '💕', label: 'Hearts' },
  { value: 'stars', emoji: '⭐', label: 'Stars' },
  { value: 'bubbles', emoji: '🫧', label: 'Bubbles' },
];

export function CustomizeTab({ lizard, onUpdateCustomization }: CustomizeTabProps) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (field: string, value: string) => {
    setUpdating(true);
    const result = await onUpdateCustomization(field, value);
    setUpdating(false);

    if (result.error) {
      alert(result.error);
    }
  };

  const renderOptionGrid = (
    field: string,
    options: CustomizationOption[],
    currentValue: string,
    title: string,
    titleEmoji: string
  ) => (
    <div className="bg-white p-4 rounded-lg shadow-md border-2 border-pink-300">
      <div className="text-lg font-bold mb-3 text-pink-700 flex items-center gap-2">
        <span>{titleEmoji}</span> {title}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleUpdate(field, option.value)}
            disabled={updating}
            className={`${
              currentValue === option.value ? 'ring-4 ring-yellow-400 bg-gradient-to-br from-purple-100 to-pink-100' : 'bg-gray-100 hover:bg-gray-200'
            } border-2 border-gray-300 rounded-lg p-3 font-bold text-sm shadow hover:scale-105 transition-transform flex flex-col items-center gap-2 disabled:opacity-50`}
          >
            <div className="text-2xl">{option.emoji}</div>
            <div className="text-xs text-gray-700">{option.label}</div>
            {currentValue === option.value && (
              <div className="text-xs text-yellow-600">✓ Active</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-4 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <span>🎨</span>
            <span>Customize Your Lizard</span>
            <span>🦎</span>
          </h2>
          <p className="text-sm mt-1 opacity-90">Make your lizard unique and stand out!</p>
        </div>

        {/* Color Selection */}
        <div className="bg-white p-4 rounded-lg shadow-md border-2 border-pink-300">
          <div className="text-lg font-bold mb-3 text-pink-700 flex items-center gap-2">
            <span>🎨</span> Lizard Color
          </div>
          <div className="grid grid-cols-3 gap-3">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => handleUpdate('color', color.value)}
                disabled={updating}
                className={`${color.bg} ${color.border} ${
                  lizard.color === color.value ? 'ring-4 ring-yellow-400' : ''
                } border-4 rounded-lg p-4 font-bold text-white text-sm shadow-lg hover:scale-105 transition-transform flex flex-col items-center gap-2 disabled:opacity-50`}
              >
                <div className="text-3xl">🦎</div>
                <div>{color.name}</div>
                {lizard.color === color.value && (
                  <div className="text-xs bg-white text-gray-700 px-2 py-1 rounded">
                    ✓ Active
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern */}
        {renderOptionGrid('pattern', patternOptions, lizard.pattern, 'Pattern', '▓')}

        {/* Eyes */}
        {renderOptionGrid('eye_style', eyeOptions, lizard.eye_style, 'Eye Style', '👁️')}

        {/* Crown */}
        {renderOptionGrid('crown', crownOptions, lizard.crown, 'Crown', '👑')}

        {/* Hat */}
        {renderOptionGrid('hat', hatOptions, lizard.hat, 'Hat', '🎩')}

        {/* Accessory */}
        {renderOptionGrid('accessory', accessoryOptions, lizard.accessory, 'Accessory', '👓')}

        {/* Background Effect */}
        {renderOptionGrid('background_effect', backgroundEffectOptions, lizard.background_effect, 'Background Effect', '✨')}

        {/* Preview Section */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-lg shadow-md border-2 border-purple-300">
          <div className="text-center">
            <div className="text-sm font-bold text-purple-700 mb-3">Preview</div>
            <div className="text-6xl mb-2">🦎</div>
            <div className="text-sm text-gray-600">
              <div>Color: <span className="font-bold">{lizard.color}</span></div>
              <div>Pattern: <span className="font-bold">{lizard.pattern}</span></div>
              <div>Eyes: <span className="font-bold">{lizard.eye_style}</span></div>
              <div>Crown: <span className="font-bold">{lizard.crown}</span></div>
              <div>Hat: <span className="font-bold">{lizard.hat}</span></div>
              <div>Accessory: <span className="font-bold">{lizard.accessory}</span></div>
              <div>Effect: <span className="font-bold">{lizard.background_effect}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
