
export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Palette {
  name: string;
  colors: string[]; // Hex strings
}

export enum ToolType {
  SAND = 'SAND',
  WATER = 'WATER',
  FIRE = 'FIRE',
  ERASER = 'ERASER',
  STONE = 'STONE', // Static obstacle
}

export interface SimulationConfig {
  brushSize: number;
  flowRate: number; // Speed of emission
  isPaused: boolean;
  tool: ToolType;
  gravity: number;
}

// --- Genesis Mode Types ---

export type ShapeType = 'RECTANGLE' | 'CIRCLE';

export interface ShapeDef {
  type: ShapeType;
  element: ToolType;
  color: string; // Hex
  // Rectangle props
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  // Circle props
  cx?: number;
  cy?: number;
  r?: number;
}

export interface WorldBlueprint {
  name: string;
  description: string;
  shapes: ShapeDef[];
}
