import { Palette } from './types';

export const CANVAS_WIDTH = 300; // Simulation width (scaled up in CSS)
export const CANVAS_HEIGHT = 300; // Simulation height

export const DEFAULT_PALETTES: Palette[] = [
  {
    name: 'Cyber Punk',
    colors: ['#FF0055', '#00FFCC', '#7000FF', '#FFFF00', '#0011FF'],
  },
  {
    name: 'Deep Space',
    colors: ['#E0F2FE', '#7DD3FC', '#0284C7', '#0C4A6E', '#082F49'],
  },
  {
    name: 'Magma Core',
    colors: ['#FFD700', '#FF8C00', '#FF4500', '#8B0000', '#2F0000'],
  },
  {
    name: 'Toxic Waste',
    colors: ['#CCFF00', '#99FF00', '#66CC00', '#336600', '#1A3300'],
  },
  {
    name: 'Synthwave',
    colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96'],
  },
];

export const SAND_COLORS = {
  STONE: 0x808080FF, // Grey, alpha 255
  ERASER: 0x00000000, // Transparent
};