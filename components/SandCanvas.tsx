import React, { useRef, useEffect, useCallback } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants';
import { ToolType } from '../types';

// Helper to parse Hex to Int32 (ABGR format for little-endian systems usually)
const hexToUint32 = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Alpha is always 255 (0xFF) for visible sand
  // Format: A B G R (Little Endian) -> 0xAABBGGRR
  return (0xFF << 24) | (b << 16) | (g << 8) | r;
};

interface SandCanvasProps {
  currentColor: string;
  brushSize: number;
  tool: ToolType;
  isPaused: boolean;
  onCanvasMount: (resetFn: () => void, downloadFn: () => void) => void;
}

const SandCanvas: React.FC<SandCanvasProps> = ({
  currentColor,
  brushSize,
  tool,
  isPaused,
  onCanvasMount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Int32Array>(new Int32Array(CANVAS_WIDTH * CANVAS_HEIGHT));
  const animationFrameRef = useRef<number>();
  const isDrawingRef = useRef(false);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Precompute current color integer
  const colorIntRef = useRef<number>(hexToUint32('#ffffff'));

  useEffect(() => {
    if (tool === ToolType.ERASER) {
      colorIntRef.current = 0; // Empty
    } else if (tool === ToolType.STONE) {
      colorIntRef.current = (0xFF << 24) | (0x80 << 16) | (0x80 << 8) | 0x80; // Grey stone
    } else {
      colorIntRef.current = hexToUint32(currentColor);
    }
  }, [currentColor, tool]);

  const resetCanvas = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.fill(0);
    }
  }, []);

  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary link to download
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `chronosand-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Expose functions to parent
  useEffect(() => {
    onCanvasMount(resetCanvas, downloadCanvas);
  }, [onCanvasMount, resetCanvas, downloadCanvas]);

  // Physics Logic
  const updateWorld = () => {
    const grid = gridRef.current;
    const width = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;

    // Iterate from bottom to top
    for (let y = height - 2; y >= 0; y--) {
      // Randomize sweep direction to prevent bias
      const startX = Math.random() > 0.5 ? 0 : width - 1;
      const endX = startX === 0 ? width : -1;
      const step = startX === 0 ? 1 : -1;

      for (let x = startX; x !== endX; x += step) {
        const idx = y * width + x;
        const pixel = grid[idx];

        if (pixel === 0) continue; // Empty space
        
        // Check if it's STONE (static)
        const isStone = (pixel & 0xFFFFFF) === 0x808080; // Checking RGB part of stone
        if (isStone) continue;

        const belowIdx = (y + 1) * width + x;
        
        // 1. Try to move down
        if (grid[belowIdx] === 0) {
          grid[belowIdx] = pixel;
          grid[idx] = 0;
        } else {
          // 2. Try to move down-left or down-right randomly
          const dir = Math.random() > 0.5 ? 1 : -1;
          const A = dir;
          const B = -dir;

          const idxA = (y + 1) * width + (x + A);
          const idxB = (y + 1) * width + (x + B);

          // Boundary checks
          const canMoveA = (x + A >= 0 && x + A < width) && grid[idxA] === 0;
          const canMoveB = (x + B >= 0 && x + B < width) && grid[idxB] === 0;

          if (canMoveA) {
            grid[idxA] = pixel;
            grid[idx] = 0;
          } else if (canMoveB) {
            grid[idxB] = pixel;
            grid[idx] = 0;
          }
          // Else: stay put
        }
      }
    }
  };

  // Drawing Input Logic
  const paintSand = () => {
    if (!mousePosRef.current) return;
    
    const { x, y } = mousePosRef.current;
    const grid = gridRef.current;
    const r = Math.floor(brushSize / 2);
    const rSq = r * r;

    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= rSq) {
          // Probability check for "spray" effect vs solid brush
          if (Math.random() > 0.9 && tool === ToolType.SAND) continue; 

          const px = x + dx;
          const py = y + dy;

          if (px >= 0 && px < CANVAS_WIDTH && py >= 0 && py < CANVAS_HEIGHT) {
            const idx = py * CANVAS_WIDTH + px;
            
            if (tool === ToolType.ERASER) {
              grid[idx] = 0;
            } else if (grid[idx] === 0 || tool === ToolType.STONE) {
              let color = colorIntRef.current;
              grid[idx] = color;
            }
          }
        }
      }
    }
  };

  // Main Loop
  const tick = useCallback(() => {
    if (isDrawingRef.current) {
      paintSand();
    }

    if (!isPaused) {
      updateWorld();
    }

    // Render
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        const imgData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
        // Cast to Int32Array for 32-bit view
        const data32 = new Int32Array(imgData.data.buffer);
        
        // Background color (Slate 950: #020617)
        // ABGR: 0xFF, 0x17, 0x06, 0x02 -> 0xFF170602
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

  // Interaction Handlers
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

    // Map screen coordinates to simulation coordinates
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
};

export default SandCanvas;