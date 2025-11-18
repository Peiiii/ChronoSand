import React, { useState, useCallback } from 'react';
import SandCanvas from './components/SandCanvas';
import Controls from './components/Controls';
import { ToolType } from './types';
import { DEFAULT_PALETTES } from './constants';
import { FaBars, FaEyeSlash, FaEye } from 'react-icons/fa';

const App: React.FC = () => {
  // State for Controls
  const [activeColor, setActiveColor] = useState(DEFAULT_PALETTES[0].colors[0]);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.SAND);
  const [brushSize, setBrushSize] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [isUIOpen, setIsUIOpen] = useState(true);

  // Function References
  const [resetFn, setResetFn] = useState<(() => void) | null>(null);
  const [downloadFn, setDownloadFn] = useState<(() => void) | null>(null);

  const handleCanvasMount = useCallback((reset: () => void, download: () => void) => {
    setResetFn(() => reset);
    setDownloadFn(() => download);
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Background Canvas Layer - Absolutely Positioned */}
      <div className="absolute inset-0 z-0">
        <SandCanvas 
          currentColor={activeColor}
          brushSize={brushSize}
          tool={activeTool}
          isPaused={isPaused}
          onCanvasMount={handleCanvasMount}
        />
      </div>

      {/* Mobile/Compact UI Toggle (Top Left) */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <button 
          onClick={() => setIsUIOpen(!isUIOpen)}
          className="bg-black/40 backdrop-blur-md border border-white/10 text-white p-3 rounded-full shadow-2xl hover:bg-black/60 transition-all active:scale-95"
        >
          {isUIOpen ? <FaEyeSlash /> : <FaBars />}
        </button>
      </div>

      {/* Controls Layer */}
      {/* Desktop: Floating Panel on Right */}
      <div 
        className={`fixed top-4 bottom-4 right-4 w-80 z-40 hidden md:flex flex-col transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${isUIOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}`}
      >
        <div className="flex-1 bg-glass-900 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <Controls 
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            onClear={() => resetFn?.()}
            onDownload={() => downloadFn?.()}
          />
        </div>
      </div>

      {/* Mobile: Bottom Sheet Drawer */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-40 md:hidden h-[70vh] bg-glass-900 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 cubic-bezier(0.32,0.72,0,1) ${isUIOpen ? 'translate-y-0' : 'translate-y-[110%]'}`}
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
          onClear={() => resetFn?.()}
          onDownload={() => downloadFn?.()}
          onCloseMobile={() => setIsUIOpen(false)}
        />
      </div>

      {/* Zen Mode Hint */}
      {!isUIOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none text-white/30 text-xs tracking-widest uppercase animate-pulse z-30">
          Zen Mode Active
        </div>
      )}
    </div>
  );
};

export default App;