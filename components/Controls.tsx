import React, { useState, useEffect } from 'react';
import { Palette, ToolType } from '../types';
import { DEFAULT_PALETTES } from '../constants';
import { generatePalette } from '../services/geminiService';
import { 
  FaPlay, FaPause, FaTrash, FaEraser, FaMagic, 
  FaSquare, FaCircle, FaDownload, FaTimes, FaFire
} from 'react-icons/fa';
import { IoSparklesSharp } from "react-icons/io5";
import { MdColorLens, MdBrush, MdLayers } from 'react-icons/md';

interface ControlsProps {
  activeColor: string;
  setActiveColor: (c: string) => void;
  activeTool: ToolType;
  setActiveTool: (t: ToolType) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  isPaused: boolean;
  setIsPaused: (p: boolean) => void;
  onClear: () => void;
  onDownload: () => void;
  onCloseMobile?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  activeColor,
  setActiveColor,
  activeTool,
  setActiveTool,
  brushSize,
  setBrushSize,
  isPaused,
  setIsPaused,
  onClear,
  onDownload,
  onCloseMobile
}) => {
  const [palettes, setPalettes] = useState<Palette[]>(DEFAULT_PALETTES);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  const handleGeneratePalette = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenStatus('CONNECTING TO GEMINI...');
    try {
      const newPalette = await generatePalette(prompt);
      setPalettes([newPalette, ...palettes]);
      setActiveColor(newPalette.colors[0]);
      setGenStatus('PALETTE ACQUIRED');
      setTimeout(() => setGenStatus(''), 3000);
    } catch (e) {
      setGenStatus('TRANSMISSION FAILED');
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to determine text color based on background brightness
  const getContrastYIQ = (hexcolor: string) => {
    hexcolor = hexcolor.replace("#", "");
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  }

  return (
    <div className="flex flex-col h-full text-white/90 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-display font-bold text-xl tracking-wider text-white">CONTROLS</h2>
        <button onClick={onCloseMobile} className="p-2 text-white/60 hover:text-white bg-white/5 rounded-full">
          <FaTimes size={16} />
        </button>
      </div>

      {/* Desktop Header / Title Area */}
      <div className="hidden md:block p-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FaFire className="text-white text-sm" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide leading-none">
              CHRONO<span className="text-indigo-400">SAND</span>
            </h1>
            <p className="text-[10px] text-white/40 font-medium tracking-[0.3em] uppercase mt-0.5">
              Gemini Physics Engine
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 space-y-6 custom-scrollbar">
        
        {/* 1. Simulation Actions (Bento Row 1) */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`group relative col-span-1 h-20 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 overflow-hidden ${isPaused 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
              : 'bg-glass-200 border-white/5 text-white hover:bg-glass-300'}`}
          >
            <div className={`absolute inset-0 bg-current opacity-0 group-hover:opacity-5 transition-opacity`} />
            {isPaused ? <FaPlay size={18} /> : <FaPause size={18} />}
            <span className="text-[10px] font-bold uppercase tracking-widest">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          
          <button 
            onClick={onClear}
            className="group relative col-span-1 h-20 rounded-2xl bg-glass-100 border border-white/5 text-white/70 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-all flex flex-col items-center justify-center gap-2"
          >
             <FaTrash size={18} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Clear</span>
          </button>

          <button 
            onClick={onDownload}
            className="group relative col-span-1 h-20 rounded-2xl bg-glass-100 border border-white/5 text-white/70 hover:text-blue-300 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all flex flex-col items-center justify-center gap-2"
          >
            <FaDownload size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Save</span>
          </button>
        </div>

        {/* 2. Tools & Brush (Bento Row 2) */}
        <div className="bg-glass-100 rounded-3xl p-4 border border-white/5 space-y-4">
          {/* Tool Selector */}
          <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl">
            {[
              { id: ToolType.SAND, icon: FaCircle, label: 'Sand' },
              { id: ToolType.STONE, icon: FaSquare, label: 'Wall' },
              { id: ToolType.ERASER, icon: FaEraser, label: 'Erase' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTool === t.id ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-white/40 hover:text-white/70'}`}
              >
                <t.icon size={10} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Brush Size Slider with Visual Preview */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-white/50 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><MdBrush /> Brush Size</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-white">{brushSize}px</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="60"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />
              <div 
                className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center shrink-0"
                title="Size Preview"
              >
                <div 
                  className="rounded-full bg-white" 
                  style={{ 
                    width: Math.min(24, Math.max(2, brushSize / 2)), 
                    height: Math.min(24, Math.max(2, brushSize / 2)) 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. AI Palette Generator */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 p-1">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          <div className="bg-black/20 p-4 rounded-[20px] backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
                <IoSparklesSharp /> Gemini Palette
              </h3>
              {genStatus && <span className="text-[9px] text-indigo-300 animate-pulse">{genStatus}</span>}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type a theme..."
                  className="relative w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleGeneratePalette()}
                />
              </div>
              <button 
                onClick={handleGeneratePalette}
                disabled={isGenerating}
                className="relative bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white w-11 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <FaMagic size={14} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Color Library */}
        <div className="space-y-4 pb-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 font-bold pl-1">
            <MdLayers size={14} />
            <span>Color Schemes</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {palettes.map((palette, pid) => (
              <div 
                key={pid} 
                className="group bg-glass-100 hover:bg-glass-200 border border-white/5 rounded-2xl p-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider group-hover:text-indigo-300 transition-colors">{palette.name}</span>
                </div>
                <div className="flex h-10 rounded-xl overflow-hidden ring-1 ring-white/5 group-hover:ring-white/20 transition-all shadow-sm">
                  {palette.colors.map((color, cid) => (
                    <button
                      key={cid}
                      onClick={() => { setActiveColor(color); setActiveTool(ToolType.SAND); }}
                      className="flex-1 h-full relative focus:outline-none group/color"
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {/* Active Indicator */}
                      {activeColor === color && activeTool === ToolType.SAND && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full shadow-sm ring-2 ring-black/20"></div>
                        </div>
                      )}
                      {/* Hover Shine */}
                      <div className="absolute inset-0 bg-white opacity-0 group-hover/color:opacity-20 transition-opacity"></div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="hidden md:block p-4 text-[9px] text-white/20 text-center border-t border-white/5 bg-black/20 backdrop-blur-xl">
        POWERED BY GOOGLE GEMINI 2.5 FLASH
      </div>
    </div>
  );
};

export default Controls;