
import React from 'react';

interface TopBarProps {
  onOpen: () => void;
  onExport: () => void;
  onReset: () => void;
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
  isExporting: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ 
  onOpen, onExport, onReset, onCopy, onPaste, canPaste, isExporting 
}) => {
  return (
    <header className="h-14 bg-[#1e1e1e] border-b border-zinc-800 flex items-center justify-between px-6 z-20 shadow-lg shrink-0">
      <div className="flex items-center space-x-6">
        <h1 className="text-sm font-light tracking-[0.2em] text-white flex items-center mr-4 select-none">
          <span className="w-8 h-8 border border-white/20 rounded-full flex items-center justify-center text-[10px] mr-3 font-bold bg-gradient-to-br from-zinc-700 to-zinc-900 shadow-xl">
            f/64
          </span>
          <span className="font-semibold text-zinc-100">F/STOP</span>
          <span className="text-zinc-500 ml-1">64</span>
        </h1>
        
        <div className="flex items-center space-x-1 border-l border-zinc-800 pl-6 h-8">
          <button 
            onClick={onCopy}
            className="px-3 py-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors rounded hover:bg-zinc-800"
          >
            Copy
          </button>
          <button 
            disabled={!canPaste}
            onClick={onPaste}
            className={`px-3 py-1 text-[11px] font-medium transition-colors rounded ${canPaste ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`}
          >
            Paste
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button 
          onClick={onReset}
          className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Reset
        </button>
        <button 
          onClick={onOpen}
          className="px-4 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded transition-all border border-zinc-700"
        >
          Import
        </button>
        <div className="h-4 w-px bg-zinc-800 mx-1" />
        <button 
          disabled={isExporting}
          onClick={onExport}
          className={`px-5 py-1.5 text-xs font-bold rounded transition-all shadow-sm uppercase tracking-widest ${isExporting ? 'bg-blue-800 text-blue-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
        >
          {isExporting ? 'Exporting...' : 'Export Active'}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
