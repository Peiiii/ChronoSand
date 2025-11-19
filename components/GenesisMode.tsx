
import React, { useState, useEffect, useRef } from 'react';
import { generateWorldBlueprint } from '../services/geminiService';
import SandCanvas, { SandCanvasHandle } from './SandCanvas';
import { FaMagic, FaTrash, FaChevronRight, FaPaperPlane, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { IoSparklesSharp, IoChatbubbleEllipsesOutline } from 'react-icons/io5';

const GenesisMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  // --- Local Physics State (Isolated World) ---
  const sandRef = useRef<SandCanvasHandle>(null);
  
  // Auto-scroll to bottom of chat logic
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { emoji: "🌋", text: "Volcano eruption at night" },
    { emoji: "🌊", text: "Deep sea underwater city" },
    { emoji: "🌲", text: "Forest fire spreading" },
    { emoji: "🏜️", text: "Desert oasis with palm trees" },
    { emoji: "☢️", text: "Toxic wasteland with acid rain" },
    { emoji: "🏰", text: "Floating stone castle" },
    { emoji: "☄️", text: "Meteor shower impact zone" }
  ];

  const handleGenerate = async (inputPrompt: string = prompt) => {
    if (!inputPrompt.trim()) return;
    
    setIsGenerating(true);
    setStatus('Designing world blueprint...');
    setPrompt(''); // Clear input like a chat
    
    try {
      // 1. Clear the canvas first for a fresh start
      sandRef.current?.reset();
      
      // 2. Get blueprint from AI
      const blueprint = await generateWorldBlueprint(inputPrompt);
      
      setStatus(`Constructing: ${blueprint.name}`);
      
      // 3. Draw to canvas
      sandRef.current?.drawBlueprint(blueprint.shapes);
      
      setStatus(`Completed: ${blueprint.name}`);
    } catch (e) {
      setStatus('Generation Failed. Please try again.');
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [status, isGenerating]);

  return (
    <>
      {/* --- Isolated Physics World Layer --- */}
      <div className="absolute inset-0 z-0">
        <SandCanvas 
          ref={sandRef}
          // Genesis mode primarily uses AI generation, but user can still interact with default tool
          isPaused={false} 
        />
      </div>

      {/* --- Toggle Button (Visible when panel is closed) --- */}
      {!isPanelOpen && (
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="fixed right-6 bottom-8 z-40 w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <IoSparklesSharp size={24} />
        </button>
      )}

      {/* --- Right Side Panel Container (Desktop & Mobile adaptive) --- */}
      <div 
        className={`
          fixed z-40 transition-all duration-500 ease-cubic-bezier
          /* Desktop Position */
          md:top-24 md:right-6 md:bottom-6 md:w-[340px] md:left-auto
          /* Mobile Position */
          left-0 right-0 bottom-0 h-[60vh] rounded-t-[32px] md:rounded-[32px]
          
          ${isPanelOpen 
            ? 'translate-y-0 md:translate-x-0 opacity-100 pointer-events-auto' 
            : 'translate-y-full md:translate-y-0 md:translate-x-[120%] opacity-0 pointer-events-none'
          }
        `}
      >
        {/* The Glass Panel */}
        <div className="w-full h-full bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 md:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 md:bg-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <IoSparklesSharp className="text-purple-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-lg leading-none">GENESIS</h2>
                <p className="text-[10px] text-white/40 font-medium tracking-widest uppercase mt-1">World Architect</p>
              </div>
            </div>
            
            {/* Close / Minimize Button */}
            <button 
              onClick={() => setIsPanelOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white bg-white/5 rounded-full transition-colors"
            >
              <div className="md:hidden"><FaChevronDown /></div>
              <div className="hidden md:block"><FaChevronRight /></div>
            </button>
          </div>

          {/* Chat / Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6" ref={scrollRef}>
            
            {/* AI Message Bubble */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20 mt-1">
                <FaMagic size={12} className="text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm p-4 text-sm text-white/90 leading-relaxed">
                   {status ? (
                     <div className="flex items-center gap-2">
                       {isGenerating && <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />}
                       <span className={isGenerating ? "animate-pulse text-purple-200" : ""}>{status}</span>
                     </div>
                   ) : (
                     "Greetings. I am the Architect. Describe a world, and I will shape the elements to build it for you."
                   )}
                </div>
              </div>
            </div>

            {/* Suggestions Grid */}
            {!isGenerating && (
              <div className="pl-11 space-y-3">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Quick Inspirations</p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleGenerate(s.text)}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all text-left active:scale-98"
                    >
                      <span className="text-lg filter grayscale group-hover:grayscale-0 transition-all">{s.emoji}</span>
                      <span className="text-xs text-white/70 group-hover:text-white font-medium">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Area */}
          <div className="p-4 bg-black/20 border-t border-white/5 space-y-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-20 group-focus-within:opacity-50 transition-opacity blur-sm"></div>
              <div className="relative flex items-center bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="Describe your world..."
                  className="flex-1 bg-transparent border-none text-sm text-white placeholder-white/30 px-4 py-3.5 focus:ring-0"
                  disabled={isGenerating}
                />
                <button
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim() || isGenerating}
                  className={`
                    p-2 mr-2 rounded-lg transition-all
                    ${prompt.trim() && !isGenerating 
                      ? 'bg-purple-600 text-white hover:bg-purple-500' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed'}
                  `}
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FaPaperPlane size={12} />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center px-1">
              <button 
                onClick={() => { sandRef.current?.reset(); setStatus('Canvas Cleared.'); }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-red-400 uppercase tracking-wider transition-colors"
              >
                <FaTrash size={10} /> Clear Canvas
              </button>
              <span className="text-[9px] text-white/20 font-medium tracking-widest">GEMINI 2.5</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default GenesisMode;
