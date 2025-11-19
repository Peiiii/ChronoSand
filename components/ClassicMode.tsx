
import React, { useState, useRef } from 'react';
import Controls from './Controls';
import { ToolType } from '../types';
import { FaBars, FaEyeSlash } from 'react-icons/fa';
import SandCanvas, { SandCanvasHandle } from './SandCanvas';
import { DEFAULT_PALETTES } from '../constants';

const ClassicMode: React.FC = () => {
  const [isUIOpen, setIsUIOpen] = useState(true);
  
  // --- Local Physics State (Isolated World) ---
  const sandRef = useRef<SandCanvasHandle>(null);
  const [activeColor, setActiveColor] = useState(DEFAULT_PALETTES[0].colors[0]);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.SAND);
  const [brushSize, setBrushSize] = useState(5); // Default smaller brush size
  const [isPaused, setIsPaused] = useState(false);

  return (
    <>
      {/* --- Isolated Physics World Layer --- */}
      <div className="absolute inset-0 z-0">
        <SandCanvas 
          ref={sandRef}
          currentColor={activeColor}
          brushSize={brushSize}
          tool={activeTool}
          isPaused={isPaused}
        />
      </div>

      {/* --- UI Layer --- */}
      
      {/* Top Left UI Toggle */}
      <div className="absolute top-6 left-6 z-50 flex gap-2">
        <button 
          onClick={() => setIsUIOpen(!isUIOpen)}
          className={`
            bg-glass-800 backdrop-blur-xl border border-white/10 text-white p-3 rounded-full 
            shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-glass-900 hover:scale-110 
            transition-all active:scale-95 duration-300 group
            ${!isUIOpen ? 'opacity-50 hover:opacity-100' : ''}
          `}
          title={isUIOpen ? "Hide Interface" : "Show Interface"}
        >
          {isUIOpen ? <FaEyeSlash size={18} /> : <FaBars size={18} />}
        </button>
      </div>

      {/* Desktop: Floating Panel on Right */}
      <div className="fixed inset-0 z-40 pointer-events-none hidden md:block">
         <div 
          className={`
            absolute top-6 bottom-6 right-6 w-[340px] max-w-[90vw] 
            pointer-events-auto
            transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
            ${isUIOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
          `}
        >
          <div className="w-full h-full bg-glass-900 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col">
            <Controls 
              activeColor={activeColor}
              setActiveColor={setActiveColor}
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
              onClear={() => sandRef.current?.reset()}
              onDownload={() => sandRef.current?.download()}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Bottom Sheet Drawer */}
      <div 
        className={`
          fixed inset-x-0 bottom-0 z-50 md:hidden h-[80vh] 
          bg-glass-900 backdrop-blur-2xl border-t border-white/10 rounded-t-[32px] 
          shadow-[0_-10px_40px_rgba(0,0,0,0.5)] 
          transform transition-transform duration-500 cubic-bezier(0.32,0.72,0,1) 
          ${isUIOpen ? 'translate-y-0' : 'translate-y-[105%]'}
        `}
      >
        <Controls 
          activeColor={activeColor}
          setActiveColor={setActiveColor}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          onClear={() => sandRef.current?.reset()}
          onDownload={() => sandRef.current?.download()}
          onCloseMobile={() => setIsUIOpen(false)}
        />
      </div>

      {/* Zen Mode Indicator */}
      {!isUIOpen && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none text-white/30 text-[10px] tracking-[0.3em] uppercase font-bold animate-pulse-slow z-30">
          Zen Mode Active
        </div>
      )}
    </>
  );
};

export default ClassicMode;
