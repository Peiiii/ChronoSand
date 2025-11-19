
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaPlay, FaPause, FaRandom, FaMagnet, FaBomb, FaMagic } from 'react-icons/fa';
import { IoSparklesSharp } from "react-icons/io5";
import { generatePalette } from '../services/geminiService';
import { DEFAULT_PALETTES } from '../constants';

// --- Configuration ---
const DUST_COUNT = 800;      // Reduced count for better performance with trails
const PLANKTON_COUNT = 25;   // More complex entities
const FRICTION = 0.96;       // Glidy but controlled
const MAX_SPEED = 3;         // Slower, more majestic
const PLANKTON_SPEED = 2;
const TRAIL_LENGTH = 12;     // Length of plankton tails

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  baseX: number; // For gentle return drift
  baseY: number;
}

interface PlanktonEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  color: string;
  size: number;
  pulsePhase: number;
  turnSpeed: number;
  trail: { x: number; y: number }[];
  wobble: number;
}

const CosmicMode: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for mutable state
  const dustRef = useRef<Particle[]>([]);
  const planktonRef = useRef<PlanktonEntity[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  
  // React State
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<'ATTRACT' | 'REPEL'>('ATTRACT');
  const [colors, setColors] = useState<string[]>(DEFAULT_PALETTES[1].colors); // Deep Space default
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Initialization ---
  const initWorld = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 1. Init Background Dust (Stars/Nutrients)
    const newDust: Particle[] = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      newDust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
      });
    }
    dustRef.current = newDust;

    // 2. Init Plankton (Lifeforms)
    const newPlankton: PlanktonEntity[] = [];
    for (let i = 0; i < PLANKTON_COUNT; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      // Initialize trail at spawn point
      const trail = Array(TRAIL_LENGTH).fill({ x, y });
      
      newPlankton.push({
        x,
        y,
        vx: (Math.random() - 0.5) * PLANKTON_SPEED,
        vy: (Math.random() - 0.5) * PLANKTON_SPEED,
        angle: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 4, // Larger heads
        pulsePhase: Math.random() * Math.PI * 2,
        turnSpeed: 0,
        trail,
        wobble: Math.random() * 100,
      });
    }
    planktonRef.current = newPlankton;

  }, [colors]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        initWorld();
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [initWorld]);

  // --- Physics Engine ---
  const tick = useCallback(() => {
    if (isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Long Exposure Background (Creates Trails)
    // Using a very low opacity fill keeps the "history" of movement visible longer
    ctx.fillStyle = 'rgba(2, 6, 23, 0.1)'; 
    ctx.fillRect(0, 0, width, height);

    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const isMouseActive = mouseRef.current.active;

    // 2. Update & Draw Dust
    dustRef.current.forEach((p) => {
      // Gentle flow field or noise could go here, for now simple drift + mouse
      if (isMouseActive) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < 100000) { // Interaction radius
           const dist = Math.sqrt(distSq);
           const force = (1 - dist / 350) * 0.5; // Gentle force
           const angle = Math.atan2(dy, dx);
           
           if (mode === 'ATTRACT') {
             p.vx += Math.cos(angle) * force;
             p.vy += Math.sin(angle) * force;
           } else {
             p.vx -= Math.cos(angle) * force;
             p.vy -= Math.sin(angle) * force;
           }
        }
      }

      // Drag
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      
      // Add a tiny bit of chaos/Brownian motion
      p.vx += (Math.random() - 0.5) * 0.05;
      p.vy += (Math.random() - 0.5) * 0.05;

      p.x += p.vx;
      p.y += p.vy;

      // Soft wrapping (teleport with fade feel would be better, but wrap is standard)
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Draw Dust
      ctx.fillStyle = p.color;
      // Twinkle effect
      const alpha = p.alpha * (0.5 + 0.5 * Math.sin(Date.now() * 0.003 + p.x));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1.0;

    // 3. Update & Draw Plankton
    ctx.globalCompositeOperation = 'screen'; // Additive blending for glow

    planktonRef.current.forEach((c) => {
      // A. Organic Movement (Sinusoidal Swimming)
      c.wobble += 0.1;
      const swimForce = Math.sin(c.wobble) * 0.05;
      
      c.angle += (Math.random() - 0.5) * 0.1 + swimForce * 0.5;
      c.vx += Math.cos(c.angle) * 0.15;
      c.vy += Math.sin(c.angle) * 0.15;

      // B. Mouse Interaction (Flocking)
      if (isMouseActive) {
        const dx = mx - c.x;
        const dy = my - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 600) {
           const steerStrength = 0.3; 
           const targetAngle = Math.atan2(dy, dx);
           
           // Smooth steering
           const diff = targetAngle - c.angle;
           // Normalize angle
           let dTheta = Math.atan2(Math.sin(diff), Math.cos(diff));
           
           if (mode === 'REPEL') dTheta += Math.PI; // Turn away
           
           c.angle += dTheta * 0.05; // Gradual turn
           
           // Acceleration
           const acc = mode === 'ATTRACT' ? steerStrength : -steerStrength;
           c.vx += Math.cos(targetAngle) * acc;
           c.vy += Math.sin(targetAngle) * acc;
        }
      }

      // C. Physics Limits
      const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      if (speed > MAX_SPEED) {
        c.vx = (c.vx / speed) * MAX_SPEED;
        c.vy = (c.vy / speed) * MAX_SPEED;
      }
      
      c.x += c.vx;
      c.y += c.vy;

      // Wrap
      if (c.x < -50) c.x = width + 50;
      if (c.x > width + 50) c.x = -50;
      if (c.y < -50) c.y = height + 50;
      if (c.y > height + 50) c.y = -50;

      // D. Trail Logic (Tentacles)
      // Unshift new position, pop old
      c.trail.pop();
      c.trail.unshift({ x: c.x, y: c.y });

      // E. Draw Plankton
      const pulse = Math.sin(Date.now() * 0.008 + c.pulsePhase) * 0.3 + 1;
      
      ctx.strokeStyle = c.color;
      ctx.lineWidth = c.size * 0.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw Tail
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      for (let i = 0; i < c.trail.length; i++) {
         const point = c.trail[i];
         // Wobble tail based on movement
         const tailWobble = Math.sin(c.wobble - i * 0.5) * (i * 0.5);
         // Use quadratic curves for smooth tail
         if (i < c.trail.length - 1) {
            const next = c.trail[i+1];
            const xc = (point.x + next.x) / 2 + tailWobble;
            const yc = (point.y + next.y) / 2 + tailWobble;
            ctx.quadraticCurveTo(point.x + tailWobble, point.y + tailWobble, xc, yc);
         } else {
            ctx.lineTo(point.x, point.y);
         }
      }
      // Fade tail opacity
      ctx.stroke();

      // Draw Head
      ctx.fillStyle = c.color;
      ctx.shadowBlur = 15 * pulse;
      ctx.shadowColor = c.color;
      
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner Core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

    });

    ctx.globalCompositeOperation = 'source-over';
    animationRef.current = requestAnimationFrame(tick);
  }, [isPaused, mode]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, [tick]);

  // Mouse Handlers
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = (e as React.MouseEvent).clientX;
      y = (e as React.MouseEvent).clientY;
    }
    mouseRef.current = { x, y, active: true };
  };

  const handlePointerLeave = () => {
    mouseRef.current = { ...mouseRef.current, active: false };
  };

  // AI Palette Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const newPalette = await generatePalette(prompt + " deep sea bioluminescence space nebula");
      setColors(newPalette.colors);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#020617]">
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none cursor-crosshair"
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerLeave}
      />

      {/* Floating HUD */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md pointer-events-none">
        <div className="bg-glass-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-4 pointer-events-auto">
          
          {/* Top Row: Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
               <button 
                 onClick={() => setMode('ATTRACT')}
                 className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 w-16 ${mode === 'ATTRACT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
               >
                 <FaMagnet />
                 <span className="text-[8px] font-bold uppercase tracking-wider">Attract</span>
               </button>
               <button 
                 onClick={() => setMode('REPEL')}
                 className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 w-16 ${mode === 'REPEL' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/25' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
               >
                 <FaBomb />
                 <span className="text-[8px] font-bold uppercase tracking-wider">Repel</span>
               </button>
            </div>

            <div className="h-8 w-px bg-white/10 mx-2"></div>

            <div className="flex gap-2">
               <button 
                 onClick={() => setIsPaused(!isPaused)}
                 className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/5"
               >
                 {isPaused ? <FaPlay size={12} /> : <FaPause size={12} />}
               </button>
               <button 
                 onClick={() => {
                    setColors(DEFAULT_PALETTES[Math.floor(Math.random() * DEFAULT_PALETTES.length)].colors);
                 }}
                 className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/5"
                 title="Random Colors"
               >
                 <FaRandom size={12} />
               </button>
            </div>
          </div>

          {/* Bottom Row: Gemini Input */}
          <div className="relative flex items-center">
             <div className="absolute left-3 text-indigo-400 animate-pulse">
               <IoSparklesSharp />
             </div>
             <input 
               type="text" 
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
               placeholder="Theme: e.g., 'Neon Jellyfish'"
               className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-all"
             />
             <button 
               onClick={handleGenerate}
               disabled={isGenerating}
               className="absolute right-1.5 p-1.5 bg-white/10 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50"
             >
               {isGenerating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaMagic size={10} />}
             </button>
          </div>

        </div>
      </div>

      {/* Overlay Hint */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none opacity-60 text-center w-full px-4">
        <p className="text-[10px] text-white font-mono tracking-[0.3em] uppercase animate-pulse-slow">
          Move cursor to guide the swarm
        </p>
      </div>
    </div>
  );
};

export default CosmicMode;
