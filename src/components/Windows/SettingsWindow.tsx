import { useState } from 'react';
import { Window } from './Window';
import { useSettings } from '../../hooks/useSettings';
import { Button95 } from '../ui/Button95';
import { PANTONE_COLORS, WINDOWS_95_COLORS, CHAT_NAME_COLORS, isColorToDark } from '../../constants/colors';
import type { WindowState } from '../../types';

interface SettingsWindowProps {
  window: WindowState;
}

export function SettingsWindow({ window }: SettingsWindowProps) {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateSettings(localSettings);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setError(null);
    setSuccess(false);
  };

  const handleColorSelect = (color: string, type: 'background' | 'chatName') => {
    if (type === 'chatName' && isColorToDark(color)) {
      setError('Chat name color too dark - please choose a brighter color');
      return;
    }

    setLocalSettings(prev => ({
      ...prev,
      [type === 'background' ? 'background_color' : 'chat_name_color']: color,
    }));
    setError(null);
  };

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-y-auto p-4">
          {/* Background Color */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2">🎨 Background Color</h3>

            <div className="mb-3">
              <div className="text-xs font-bold mb-1 text-gray-700">Pantone Colors of the Year</div>
              <div className="grid grid-cols-7 gap-1">
                {PANTONE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorSelect(color.value, 'background')}
                    className={`w-8 h-8 border-2 ${
                      localSettings.background_color === color.value
                        ? 'border-black'
                        : 'border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold mb-1 text-gray-700">Windows 95 Colors</div>
              <div className="grid grid-cols-8 gap-1">
                {WINDOWS_95_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorSelect(color.value, 'background')}
                    className={`w-8 h-8 border-2 ${
                      localSettings.background_color === color.value
                        ? 'border-black'
                        : 'border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-600">
              Current: <span className="font-mono">{localSettings.background_color}</span>
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2">📏 Font Size</h3>
            <div className="flex gap-2">
              {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setLocalSettings(prev => ({ ...prev, font_size: size }))}
                  className={`px-3 py-2 border-2 ${
                    localSettings.font_size === size
                      ? 'border-black bg-win95-blue text-white'
                      : 'border-gray-400 bg-win95-gray'
                  }`}
                >
                  {size === 'small' && 'Small'}
                  {size === 'medium' && 'Medium'}
                  {size === 'large' && 'Large'}
                  {size === 'xlarge' && 'X-Large'}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Name Color */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2">💬 Chat Name Color</h3>
            <div className="grid grid-cols-6 gap-2">
              {CHAT_NAME_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value, 'chatName')}
                  className={`px-2 py-2 border-2 text-xs ${
                    localSettings.chat_name_color === color.value
                      ? 'border-black'
                      : 'border-gray-400'
                  }`}
                  style={{ color: color.value, fontWeight: 'bold' }}
                  title={color.name}
                >
                  {color.name}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Preview: <span style={{ color: localSettings.chat_name_color, fontWeight: 'bold' }}>
                YourName
              </span>
            </div>
          </div>

          {/* Sound Effects */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2">🔊 Sound Effects</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.enable_sounds}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, enable_sounds: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Enable sound effects (coming soon)</span>
            </label>
          </div>

          {/* Timestamp Format */}
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2">⏰ Timestamp Format</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, timestamp_format: '12h' }))}
                className={`px-4 py-2 border-2 ${
                  localSettings.timestamp_format === '12h'
                    ? 'border-black bg-win95-blue text-white'
                    : 'border-gray-400 bg-win95-gray'
                }`}
              >
                12-hour (3:45 PM)
              </button>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, timestamp_format: '24h' }))}
                className={`px-4 py-2 border-2 ${
                  localSettings.timestamp_format === '24h'
                    ? 'border-black bg-win95-blue text-white'
                    : 'border-gray-400 bg-win95-gray'
                }`}
              >
                24-hour (15:45)
              </button>
            </div>
          </div>

          {/* Theme Presets */}
          <div className="mb-4">
            <h3 className="font-bold text-sm mb-2">🎭 Theme Presets (Coming Soon)</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['classic', 'dark', 'pastel', 'high-contrast'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setLocalSettings(prev => ({ ...prev, theme_preset: theme }))}
                  className={`px-3 py-2 border-2 text-sm ${
                    localSettings.theme_preset === theme
                      ? 'border-black bg-win95-blue text-white'
                      : 'border-gray-400 bg-win95-gray'
                  }`}
                  disabled
                >
                  {theme === 'classic' && '🖥️ Classic'}
                  {theme === 'dark' && '🌙 Dark Mode'}
                  {theme === 'pastel' && '🌸 Pastel'}
                  {theme === 'high-contrast' && '⚡ High Contrast'}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">Theme presets will apply coordinated color schemes</div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="border-t-2 border-gray-400 p-3 bg-win95-gray">
          {error && (
            <div className="mb-2 text-xs text-red-600 bg-red-100 border border-red-400 p-2">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-2 text-xs text-green-600 bg-green-100 border border-green-400 p-2">
              ✓ Settings saved! Reloading...
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button95 onClick={handleReset} disabled={saving}>
              Reset
            </Button95>
            <Button95 onClick={handleSave} disabled={saving} className="font-bold">
              {saving ? 'Saving...' : '💾 Save Settings'}
            </Button95>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Settings are saved to your profile and persist across sessions
          </div>
        </div>
      </div>
    </Window>
  );
}
