
import React, { useState } from 'react';
import ClassicMode from './components/ClassicMode';
import GenesisMode from './components/GenesisMode';
import { FaCube, FaFlask } from 'react-icons/fa';

enum AppMode {
  CLASSIC = 'CLASSIC',
  GENESIS = 'GENESIS',
}

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.GENESIS);

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden font-sans text-white">
      
      {/* --- Global Mode Switcher (Floating Capsule) --- */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 p-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl">
        
        <button
          onClick={() => setCurrentMode(AppMode.CLASSIC)}
          className={`
            relative px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-2
            ${currentMode === AppMode.CLASSIC 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
              : 'text-white/40 hover:bg-white/5 hover:text-white'}
          `}
        >
          <FaCube size={10} />
          Sandbox
        </button>

        <button
          onClick={() => setCurrentMode(AppMode.GENESIS)}
          className={`
            relative px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center gap-2
            ${currentMode === AppMode.GENESIS 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
              : 'text-white/40 hover:bg-white/5 hover:text-white'}
          `}
        >
          <FaFlask size={10} />
          Genesis
        </button>

      </div>

      {/* --- Content Layers --- */}
      
      {/* Classic Mode (Sandbox) */}
      {currentMode === AppMode.CLASSIC && (
        <ClassicMode />
      )}

      {/* Genesis Mode (AI Generation) */}
      {currentMode === AppMode.GENESIS && (
        <GenesisMode />
      )}

    </div>
  );
};

export default App;
