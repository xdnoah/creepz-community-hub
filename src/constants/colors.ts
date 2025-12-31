// Pantone Colors of the Year (2013-2024)
export const PANTONE_COLORS = [
  { name: 'Emerald (2013)', value: '#009B77' },
  { name: 'Radiant Orchid (2014)', value: '#B565A7' },
  { name: 'Marsala (2015)', value: '#955251' },
  { name: 'Rose Quartz (2016)', value: '#F7CAC9' },
  { name: 'Serenity (2016)', value: '#91A8D0' },
  { name: 'Greenery (2017)', value: '#88B04B' },
  { name: 'Ultra Violet (2018)', value: '#5F4B8B' },
  { name: 'Living Coral (2019)', value: '#FF6F61' },
  { name: 'Classic Blue (2020)', value: '#0F4C81' },
  { name: 'Illuminating (2021)', value: '#F5DF4D' },
  { name: 'Ultimate Gray (2021)', value: '#939597' },
  { name: 'Very Peri (2022)', value: '#6667AB' },
  { name: 'Viva Magenta (2023)', value: '#BB2649' },
  { name: 'Peach Fuzz (2024)', value: '#FFBE98' },
];

// Iconic Windows 95 Colors
export const WINDOWS_95_COLORS = [
  { name: 'Teal (Classic)', value: '#008080' },
  { name: 'Win95 Gray', value: '#C0C0C0' },
  { name: 'Win95 Blue', value: '#000080' },
  { name: 'Win95 Green', value: '#008000' },
  { name: 'Win95 Red', value: '#800000' },
  { name: 'Win95 Purple', value: '#800080' },
  { name: 'Win95 Yellow', value: '#808000' },
  { name: 'Desktop Pink', value: '#FF00FF' },
];

// Chat name colors (bright, visible colors only)
export const CHAT_NAME_COLORS = [
  { name: 'Terminal Green', value: '#00FF00' },
  { name: 'Cyan', value: '#00FFFF' },
  { name: 'Hot Pink', value: '#FF1493' },
  { name: 'Orange', value: '#FF8C00' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Lime', value: '#7FFF00' },
  { name: 'Magenta', value: '#FF00FF' },
  { name: 'Deep Pink', value: '#FF69B4' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Spring Green', value: '#00FF7F' },
  { name: 'Violet', value: '#EE82EE' },
  { name: 'Light Coral', value: '#F08080' },
];

// Helper to check if color is too dark
export function isColorToDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}
