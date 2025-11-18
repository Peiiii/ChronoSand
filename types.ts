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
