import { Palette } from './types';

export const CANVAS_WIDTH = 300; // Simulation width (scaled up in CSS)
export const CANVAS_HEIGHT = 300; // Simulation height

export const DEFAULT_PALETTES: Palette[] = [
  {
    name: 'Cosmic Dust',
    colors: ['#FF0099', '#493240', '#FF00CC', '#330033', '#9900CC'],
  },
  {
    name: 'Desert Sunset',
    colors: ['#F9D423', '#FF4E50', '#F3904F', '#E94057', '#8A2387'],
  },
  {
    name: 'Ocean Depths',
    colors: ['#00C9FF', '#92FE9D', '#00d2ff', '#3a7bd5', '#005C97'],
  },
  {
    name: 'Neon Cyber',
    colors: ['#00f260', '#0575E6', '#8E2DE2', '#4A00E0', '#fc6767'],
  },
];

export const SAND_COLORS = {
  STONE: 0x808080FF, // Grey, alpha 255
  ERASER: 0x00000000, // Transparent
};
