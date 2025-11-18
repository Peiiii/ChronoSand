import React, { useState, useEffect } from 'react';
import { Palette, ToolType } from '../types';
import { DEFAULT_PALETTES } from '../constants';
import { generatePalette } from '../services/geminiService';
import { 
  FaPlay, FaPause, FaTrash, FaEraser, FaMagic, 
  FaSquare, FaCircle, FaDownload, FaTimes
} from 'react-icons/fa';
import { MdColorLens, MdBrush } from 'react-icons/md';

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
    setGenStatus('Thinking...');
    try {
      const newPalette = await generatePalette(prompt);
      setPalettes([newPalette, ...palettes]);
      setActiveColor(newPalette.colors[0]);
      setGenStatus('Done!');
      setTimeout(() => setGenStatus(''), 2000);
    } catch (e) {
      setGenStatus('Error');
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full text-white/90">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 border-b border-white/10 bg-black/20">
        <h2 className="font-display font-bold text-xl">Controls</h2>
        <button onClick={onCloseMobile} className="p-2 text-white/60 hover:text-white">
          <FaTimes size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        
        {/* Branding */}
        <div className="hidden md:block">
          <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-amber-200 via-purple-300 to-indigo-400 bg-clip-text text-transparent tracking-wide">
            ChronoSand
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-[0.2em] mt-1">AI Physics Engine</p>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`col-span-1 flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all border ${isPaused ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : 'bg-amber-500/20 border-amber-500/50 text-amber-200'} hover:bg-white/5`}
          >
            {isPaused ? <FaPlay size={16} /> : <FaPause size={16} />}
            <span className="text-[10px] font-bold uppercase tracking-wider">{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          
          <button 
            onClick={onClear}
            className="col-span-1 flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30 transition-all"
          >
            <FaTrash size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Clear</span>
          </button>

          <button 
            onClick={onDownload}
            className="col-span-1 flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-blue-500/20 border border-blue-500/50 text-blue-200 hover:bg-blue-500/30 transition-all"
          >
            <FaDownload size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
          </button>
        </div>

        {/* Tools */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/40 font-bold">
            <span>Tool</span>
          </div>
          <div className="bg-black/20 p-1 rounded-xl flex border border-white/5">
            {[
              { id: ToolType.SAND, icon: FaCircle, label: 'Sand' },
              { id: ToolType.STONE, icon: FaSquare, label: 'Stone' },
              { id: ToolType.ERASER, icon: FaEraser, label: 'Erase' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${activeTool === t.id ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
              >
                <t.icon size={12} />
                <span className="font-medium text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Brush Size */}
        <div className="space-y-3">
           <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/40 font-bold">
            <span className="flex items-center gap-1"><MdBrush /> Brush Size</span>
            <span className="text-white/80">{brushSize}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400 hover:accent-indigo-300 transition-all"
          />
        </div>

        {/* AI Palette Generator */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 space-y-3 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full pointer-events-none"></div>
          
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300 relative z-10">
            <FaMagic /> Gemini Palette Gen
          </h3>
          
          <div className="flex gap-2 relative z-10">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Cyberpunk Neon"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleGeneratePalette()}
            />
            <button 
              onClick={handleGeneratePalette}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <FaMagic />}
            </button>
          </div>
          {genStatus && <div className="text-[10px] text-right text-indigo-200 italic">{genStatus}</div>}
        </div>

        {/* Palettes */}
        <div className="space-y-4 pb-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/40 font-bold">
            <MdColorLens size={14} />
            <span>Color Library</span>
          </div>
          
          <div className="space-y-4">
            {palettes.map((palette, pid) => (
              <div key={pid} className="group">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[11px] font-medium text-white/60 group-hover:text-indigo-300 transition-colors">{palette.name}</span>
                </div>
                <div className="flex h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg">
                  {palette.colors.map((color, cid) => (
                    <button
                      key={cid}
                      onClick={() => { setActiveColor(color); setActiveTool(ToolType.SAND); }}
                      className={`flex-1 h-full transition-all hover:flex-[1.5] focus:outline-none relative group/color`}
                      style={{ backgroundColor: color }}
                    >
                      {activeColor === color && activeTool === ToolType.SAND && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="hidden md:block p-4 text-[10px] text-white/20 text-center border-t border-white/5">
        Powered by Google Gemini 2.5 Flash
      </div>
    </div>
  );
};

export default Controls;