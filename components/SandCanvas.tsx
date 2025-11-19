
import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants';
import { ToolType, ShapeDef } from '../types';

// Helper to parse Hex to Int32 (ABGR format for little-endian systems usually)
const hexToUint32 = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Alpha is always 255 (0xFF) for visible sand
  // Format: A B G R (Little Endian) -> 0xAABBGGRR
  return (0xFF << 24) | (b << 16) | (g << 8) | r;
};

// Element IDs for the state grid
const ID_EMPTY = 0;
const ID_SAND = 1;
const ID_WATER = 2;
const ID_FIRE = 3;
const ID_STONE = 4;

export interface SandCanvasHandle {
  reset: () => void;
  download: () => void;
  drawBlueprint: (shapes: ShapeDef[]) => void;
}

interface SandCanvasProps {
  currentColor?: string;
  brushSize?: number;
  tool?: ToolType;
  isPaused?: boolean;
}

const SandCanvas = forwardRef<SandCanvasHandle, SandCanvasProps>(({
  currentColor = '#ffffff',
  brushSize = 5,
  tool = ToolType.SAND,
  isPaused = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Visual Grid: Stores the colors (Int32) for rendering
  const gridRef = useRef<Int32Array>(new Int32Array(CANVAS_WIDTH * CANVAS_HEIGHT));
  
  // State Grid: Stores the element ID (Uint8) for physics logic
  const stateRef = useRef<Uint8Array>(new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT));
  
  const animationFrameRef = useRef<number>(0);
  const isDrawingRef = useRef(false);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Precompute current color integer
  const colorIntRef = useRef<number>(hexToUint32('#ffffff'));

  useEffect(() => {
    if (tool === ToolType.ERASER) {
      colorIntRef.current = 0; 
    } else if (tool === ToolType.STONE) {
      colorIntRef.current = (0xFF << 24) | (0x80 << 16) | (0x80 << 8) | 0x80; // Grey stone
    } else {
      colorIntRef.current = hexToUint32(currentColor);
    }
  }, [currentColor, tool]);

  // --- Imperative API exposed to parent ---
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (gridRef.current && stateRef.current) {
        gridRef.current.fill(0);
        stateRef.current.fill(0);
      }
    },
    download: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `chronosand-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    drawBlueprint: (shapes: ShapeDef[]) => {
       const grid = gridRef.current;
       const state = stateRef.current;
       
       shapes.forEach(shape => {
         // Resolve Material ID
         let typeId = ID_STONE;
         if (shape.element === ToolType.SAND) typeId = ID_SAND;
         if (shape.element === ToolType.WATER) typeId = ID_WATER;
         if (shape.element === ToolType.FIRE) typeId = ID_FIRE;
         if (shape.element === ToolType.ERASER) typeId = ID_EMPTY;

         const color = shape.element === ToolType.ERASER ? 0 : hexToUint32(shape.color);

         if (shape.type === 'RECTANGLE') {
            const x = Math.floor(shape.x || 0);
            const y = Math.floor(shape.y || 0);
            const w = Math.floor(shape.w || 10);
            const h = Math.floor(shape.h || 10);
            
            for(let py = y; py < y + h; py++) {
              for(let px = x; px < x + w; px++) {
                if(px >= 0 && px < CANVAS_WIDTH && py >= 0 && py < CANVAS_HEIGHT) {
                  const idx = py * CANVAS_WIDTH + px;
                  grid[idx] = color;
                  state[idx] = typeId;
                }
              }
            }
         } else if (shape.type === 'CIRCLE') {
            const cx = Math.floor(shape.cx || 0);
            const cy = Math.floor(shape.cy || 0);
            const r = Math.floor(shape.r || 10);
            const rSq = r * r;

            for(let dy = -r; dy <= r; dy++) {
              for(let dx = -r; dx <= r; dx++) {
                if(dx*dx + dy*dy <= rSq) {
                   const px = cx + dx;
                   const py = cy + dy;
                   if(px >= 0 && px < CANVAS_WIDTH && py >= 0 && py < CANVAS_HEIGHT) {
                    const idx = py * CANVAS_WIDTH + px;
                    grid[idx] = color;
                    state[idx] = typeId;
                  }
                }
              }
            }
         }
       });
    }
  }));

  // --- Physics Logic ---
  const updateWorld = () => {
    const grid = gridRef.current;
    const state = stateRef.current;
    const width = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;

    // We iterate bottom-up.
    for (let y = height - 1; y >= 0; y--) {
      // Randomize X direction sweep to prevent bias
      const startX = Math.random() > 0.5 ? 0 : width - 1;
      const step = startX === 0 ? 1 : -1;
      const endX = startX === 0 ? width : -1;

      for (let x = startX; x !== endX; x += step) {
        const idx = y * width + x;
        const type = state[idx];

        if (type === ID_EMPTY || type === ID_STONE) continue;

        // --- FIRE PHYSICS (Rising) ---
        if (type === ID_FIRE) {
          // Adjusted decay for sub-stepping (slower decay per step)
          if (Math.random() > 0.98) { 
             grid[idx] = 0;
             state[idx] = ID_EMPTY;
             continue;
          }
          
          // Move Logic
          const moveUp = () => {
             if (y > 0) {
                const aboveIdx = (y - 1) * width + x;
                if (state[aboveIdx] === ID_EMPTY) {
                    state[aboveIdx] = ID_FIRE;
                    grid[aboveIdx] = grid[idx];
                    state[idx] = ID_EMPTY;
                    grid[idx] = 0;
                    return true;
                } else if (state[aboveIdx] !== ID_STONE) {
                     // Try to move diagonally up
                     const dir = Math.random() > 0.5 ? 1 : -1;
                     const newX = x + dir;
                     if (newX >= 0 && newX < width) {
                         const diagIdx = (y - 1) * width + newX;
                         if (state[diagIdx] === ID_EMPTY) {
                            state[diagIdx] = ID_FIRE;
                            grid[diagIdx] = grid[idx];
                            state[idx] = ID_EMPTY;
                            grid[idx] = 0;
                            return true;
                         }
                     }
                }
             } else {
                 // Reached top
                 grid[idx] = 0;
                 state[idx] = ID_EMPTY;
             }
             return false;
          }

          if (Math.random() > 0.4) moveUp(); 
          continue;
        }

        // --- GRAVITY PHYSICS (Sand & Water) ---
        if (y < height - 1) {
          const belowIdx = (y + 1) * width + x;
          const belowType = state[belowIdx];

          // Fall down if empty or fire (fire gets displaced)
          if (belowType === ID_EMPTY || belowType === ID_FIRE) {
            state[belowIdx] = type;
            grid[belowIdx] = grid[idx];
            state[idx] = ID_EMPTY;
            grid[idx] = 0;
            continue; 
          }

          // Slide diagonally
          const dir = Math.random() > 0.5 ? 1 : -1;
          const dx1 = dir;
          const dx2 = -dir;
          
          const checkDiagonal = (dx: number) => {
            const nx = x + dx;
            if (nx >= 0 && nx < width) {
              const diagIdx = (y + 1) * width + nx;
              if (state[diagIdx] === ID_EMPTY || state[diagIdx] === ID_FIRE) {
                state[diagIdx] = type;
                grid[diagIdx] = grid[idx];
                state[idx] = ID_EMPTY;
                grid[idx] = 0;
                return true;
              }
            }
            return false;
          };

          if (checkDiagonal(dx1) || checkDiagonal(dx2)) {
            continue;
          }

          // --- WATER SPECIFIC (Flow Sideways) ---
          if (type === ID_WATER) {
            const sideDir = Math.random() > 0.5 ? 1 : -1;
            const sx = x + sideDir;
            
            if (sx >= 0 && sx < width) {
               const sideIdx = y * width + sx;
               if (state[sideIdx] === ID_EMPTY || state[sideIdx] === ID_FIRE) {
                 state[sideIdx] = type;
                 grid[sideIdx] = grid[idx];
                 state[idx] = ID_EMPTY;
                 grid[idx] = 0;
               }
            }
          }
        }
      }
    }
  };

  // Drawing Logic
  const paintSand = () => {
    if (!mousePosRef.current) return;
    
    const { x, y } = mousePosRef.current;
    const grid = gridRef.current;
    const state = stateRef.current;
    const r = Math.floor(brushSize / 2);
    const rSq = r * r;

    // Map Tool to ID
    let typeId = ID_SAND;
    if (tool === ToolType.WATER) typeId = ID_WATER;
    if (tool === ToolType.FIRE) typeId = ID_FIRE;
    if (tool === ToolType.STONE) typeId = ID_STONE;
    if (tool === ToolType.ERASER) typeId = ID_EMPTY;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= rSq) {
          // Spray effect for non-solids
          if (tool !== ToolType.STONE && tool !== ToolType.ERASER && Math.random() > 0.6) continue;

          const px = x + dx;
          const py = y + dy;

          if (px >= 0 && px < CANVAS_WIDTH && py >= 0 && py < CANVAS_HEIGHT) {
            const idx = py * CANVAS_WIDTH + px;
            
            if (tool === ToolType.ERASER) {
              grid[idx] = 0;
              state[idx] = ID_EMPTY;
            } else if (state[idx] === ID_EMPTY || tool === ToolType.STONE || state[idx] === ID_FIRE) {
              grid[idx] = colorIntRef.current;
              state[idx] = typeId;
            }
          }
        }
      }
    }
  };

  const tick = useCallback(() => {
    if (isDrawingRef.current) {
      paintSand();
    }

    if (!isPaused) {
      // SUB-STEPPING: Run physics multiple times per frame for speed and fluidity
      for(let i = 0; i < 3; i++) {
        updateWorld();
      }
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        const imgData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
        const data32 = new Int32Array(imgData.data.buffer);
        
        // Slate 950: #020617 -> 0xFF170602
        const bgColor = (0xFF << 24) | (0x17 << 16) | (0x06 << 8) | 0x02;

        for (let i = 0; i < gridRef.current.length; i++) {
           const val = gridRef.current[i];
           data32[i] = val === 0 ? bgColor : val;
        }
        
        ctx.putImageData(imgData, 0, 0);
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [isPaused, tool, brushSize]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [tick]);

  // Input Handling
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: Math.floor((clientX - rect.left) * scaleX),
      y: Math.floor((clientY - rect.top) * scaleY),
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawingRef.current = true;
    mousePosRef.current = getPos(e);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDrawingRef.current) {
      mousePosRef.current = getPos(e);
    }
  };

  const handleEnd = () => {
    isDrawingRef.current = false;
    mousePosRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full touch-none cursor-crosshair"
      style={{ imageRendering: 'pixelated' }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
});

export default SandCanvas;
