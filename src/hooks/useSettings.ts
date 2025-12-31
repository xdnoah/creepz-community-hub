import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { UserSettings } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  background_color: '#008080',
  font_size: 'medium',
  chat_name_color: '#00FF00',
  enable_sounds: true,
  timestamp_format: '12h',
  theme_preset: 'classic',
};

export function useSettings() {
  const { user } = useAuth();

  // Load settings from localStorage (since we don't fetch them from profile anymore)
  const savedSettings = localStorage.getItem('user_settings');
  let userSettings = DEFAULT_SETTINGS;

  if (savedSettings) {
    try {
      userSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    } catch (e) {
      console.warn('[Settings] Invalid saved settings, using defaults');
    }
  }

  const settings: UserSettings = userSettings;

  // Apply settings to DOM
  useEffect(() => {
    try {
      // Apply background color
      document.body.style.backgroundColor = settings.background_color;

      // Apply font size
      const fontSizes = {
        small: '14px',
        medium: '16px',
        large: '18px',
        xlarge: '20px',
      };
      document.documentElement.style.fontSize = fontSizes[settings.font_size];

      // Apply CSS variables for theme
      document.documentElement.style.setProperty('--chat-name-color', settings.chat_name_color);
      document.documentElement.style.setProperty('--background-color', settings.background_color);
    } catch (error) {
      console.warn('Settings application failed - using defaults:', error);
    }
  }, [settings]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Save to localStorage instead of database for now (faster, no DB dependency)
      const currentSettings = savedSettings ? JSON.parse(savedSettings) : {};
      const updatedSettings = { ...currentSettings, ...newSettings };
      localStorage.setItem('user_settings', JSON.stringify(updatedSettings));

      console.log('[Settings] Settings saved to localStorage:', updatedSettings);

      // Reload to apply settings
      window.location.reload();

      return {};
    } catch (error: any) {
      console.error('[Settings] Error updating settings:', error);
      return { error: error.message || 'Failed to update settings' };
    }
  };

  return {
    settings,
    updateSettings,
  };
}
