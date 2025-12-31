# ⚙️ Settings Feature - Complete Guide

## Overview

The Settings system allows users to customize their experience with persistent preferences saved to their profile!

---

## Setup (Required!)

Run this SQL script in Supabase SQL Editor:

**File:** `USER_SETTINGS_SETUP.sql`

This adds the following columns to the `profiles` table:
- `background_color` - Desktop background color
- `font_size` - Website font size (small/medium/large/xlarge)
- `chat_name_color` - Username color in chat
- `enable_sounds` - Sound effects toggle
- `timestamp_format` - 12h or 24h time format
- `theme_preset` - Theme preset selection

---

## Features

### 1. 🎨 Background Color

Choose from **22 beautiful colors**:

**Pantone Colors of the Year (2013-2024):**
- Emerald, Radiant Orchid, Marsala, Rose Quartz, Serenity
- Greenery, Ultra Violet, Living Coral, Classic Blue
- Illuminating, Ultimate Gray, Very Peri, Viva Magenta, Peach Fuzz

**Iconic Windows 95 Colors:**
- Classic Teal (default)
- Win95 Gray, Blue, Green, Red, Purple, Yellow
- Desktop Pink

**How it works:**
- Click any color swatch to select
- Selected color has black border
- Changes desktop background immediately
- Saved to your profile

### 2. 📏 Font Size

4 size options:
- **Small** - 14px (compact)
- **Medium** - 16px (default, comfortable)
- **Large** - 18px (easier to read)
- **X-Large** - 20px (accessibility)

Changes font size across the entire website!

### 3. 💬 Chat Name Color

Choose from **12 vibrant colors** for your username in chat:
- Terminal Green (default)
- Cyan, Hot Pink, Orange, Yellow
- Lime, Magenta, Deep Pink, Gold
- Spring Green, Violet, Light Coral

**Safety features:**
- Dark colors are automatically rejected
- Preview shows how your name will look
- Only bright, visible colors allowed

### 4. 🔊 Sound Effects

Toggle for enabling/disabling sound effects

**Status:** Coming soon! (Currently does nothing)

### 5. ⏰ Timestamp Format

Choose how timestamps are displayed:
- **12-hour** - 3:45 PM (default)
- **24-hour** - 15:45

Affects chat messages and DM timestamps.

### 6. 🎭 Theme Presets

4 preset themes (Coming Soon):
- **Classic** - Traditional Windows 95 look
- **Dark Mode** - Dark backgrounds, light text
- **Pastel** - Soft, light colors
- **High Contrast** - Maximum accessibility

**Status:** UI ready, functionality coming soon!

---

## How to Use

### Desktop Icon:
1. Double-click **⚙️ Settings** icon on desktop
2. Adjust your preferences
3. Click **💾 Save Settings**
4. Page reloads with new settings applied

### Start Menu:
1. Click **Start** button
2. Click **⚙️ Settings**
3. Same as above

---

## Technical Details

### Data Storage

Settings are stored in the `profiles` table:

```sql
CREATE TABLE profiles (
  -- ... existing columns ...
  background_color TEXT DEFAULT '#008080',
  font_size TEXT DEFAULT 'medium',
  chat_name_color TEXT DEFAULT '#00FF00',
  enable_sounds BOOLEAN DEFAULT true,
  timestamp_format TEXT DEFAULT '12h',
  theme_preset TEXT DEFAULT 'classic'
);
```

### Settings Application

Settings are applied via CSS variables:

```css
:root {
  --background-color: #008080;
  --chat-name-color: #00FF00;
  font-size: 16px;
}
```

The `useSettings` hook:
1. Loads settings from user profile
2. Applies settings to DOM on mount
3. Updates database when user saves
4. Reloads page to apply changes

### Files Created

**Database:**
- `USER_SETTINGS_SETUP.sql` - Database schema

**Frontend:**
- `src/constants/colors.ts` - Color palettes
- `src/hooks/useSettings.ts` - Settings management hook
- `src/components/Windows/SettingsWindow.tsx` - Settings UI
- `SETTINGS_FEATURE.md` - This documentation

**Modified:**
- `src/types/index.ts` - Added UserSettings interface
- `src/components/Desktop/Desktop.tsx` - Added Settings icon + window
- `src/components/Desktop/StartMenu.tsx` - Added Settings menu item
- `src/index.css` - CSS variables for settings

---

## Additional Customization Ideas

Want more features? Here are suggestions:

### Appearance:
- ✅ **Window border style** - Rounded vs square corners
- ✅ **Desktop icon size** - Small, medium, large
- ✅ **Window transparency** - Opacity slider
- ✅ **Custom wallpaper upload** - Upload your own image
- ✅ **Cursor style** - Classic arrow, hand, crosshair

### Chat:
- ✅ **Message bubble style** - Rounded, square, speech bubble
- ✅ **Chat font** - Terminal, Sans-serif, Monospace
- ✅ **Show avatars** - Display user avatars in chat
- ✅ **Compact mode** - Reduce padding for more messages on screen
- ✅ **Show typing indicators** - See when others are typing

### Behavior:
- ✅ **Auto-scroll chat** - Keep chat scrolled to bottom
- ✅ **Notification preferences** - What triggers notifications
- ✅ **Double-click speed** - Desktop icon sensitivity
- ✅ **Window animations** - Enable/disable window transitions
- ✅ **Remember window positions** - Save where you left windows

### Accessibility:
- ✅ **Dyslexic-friendly font** - OpenDyslexic font option
- ✅ **Keyboard shortcuts** - Customize hotkeys
- ✅ **Screen reader mode** - Enhanced accessibility
- ✅ **Reduce motion** - Disable animations
- ✅ **High contrast mode** - Black/white only

---

## Troubleshooting

### Settings not saving:
1. Check browser console for errors
2. Make sure you ran `USER_SETTINGS_SETUP.sql`
3. Check Supabase logs
4. Try logging out and back in

### Background color not changing:
1. Make sure you clicked "Save Settings"
2. Wait for page reload
3. Check browser console for errors

### Font size not changing:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check that font size was saved in profile

### Chat name color too dark:
The system prevents dark colors! Choose a brighter color from the palette.

---

## Future Enhancements

Planned features:
1. **Export/Import Settings** - Share your theme with friends
2. **Theme Gallery** - Browse and install community themes
3. **Seasonal Themes** - Halloween, Christmas, etc.
4. **Color Picker** - Custom hex color input
5. **Preview Mode** - See changes before saving
6. **Reset to Defaults** - One-click restore
7. **Settings History** - Undo recent changes

---

## Summary

✅ **22 background colors** (Pantone + Windows 95)
✅ **4 font sizes** (Small to X-Large)
✅ **12 chat name colors** (Bright colors only)
✅ **2 time formats** (12h/24h)
✅ **Persistent storage** (Saved to your profile)
✅ **Easy to use** (Click, save, done!)

**All settings sync across devices when you log in!** 🎨🚀
