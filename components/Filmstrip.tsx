
import React from 'react';
import { Photo } from '../types';

interface FilmstripProps {
  photos: Photo[];
  activePhotoId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onExportSpecific: (photo: Photo) => void;
}

const Filmstrip: React.FC<FilmstripProps> = ({ photos, activePhotoId, onSelect, onAdd, onExportSpecific }) => {
  return (
    <div className="h-32 bg-[#181818] border-t border-zinc-800 flex items-center px-6 overflow-x-auto overflow-y-hidden flex-nowrap gap-4 shrink-0 snap-x scroll-smooth filmstrip-container">
      {/* Import Button */}
      <button 
        onClick={onAdd}
        className="flex-shrink-0 w-24 h-24 bg-zinc-900 border border-zinc-800 border-dashed hover:border-blue-500 hover:bg-zinc-800 rounded-lg flex flex-col items-center justify-center transition-all group active:scale-95"
      >
        <span className="text-2xl text-zinc-600 group-hover:text-blue-500 font-light">+</span>
        <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 mt-1 uppercase tracking-widest font-bold text-center">Import</span>
      </button>

      {/* Asset Thumbnails */}
      {photos.map(p => (
        <div key={p.id} className="relative flex-shrink-0 group">
          <button
            onClick={() => onSelect(p.id)}
            className={`w-24 h-24 rounded-lg bg-zinc-900 border-2 overflow-hidden transition-all snap-start active:scale-95 ${
              activePhotoId === p.id 
                ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-[1.05] z-10' 
                : 'border-transparent opacity-60 hover:opacity-100 hover:border-zinc-700'
            }`}
          >
            <img 
              src={p.src} 
              alt={p.name} 
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
            <div className={`absolute inset-0 transition-opacity duration-300 ${activePhotoId === p.id ? 'opacity-0' : 'bg-black/30 group-hover:opacity-0'}`} />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] text-white truncate block font-medium shadow-sm">{p.name}</span>
            </div>
            
            {activePhotoId === p.id && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 border border-white/20" />
            )}
          </button>

          {/* Individual Export Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExportSpecific(p);
            }}
            className="absolute top-1.5 left-1.5 p-1.5 bg-black/80 hover:bg-blue-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl transform hover:scale-110 active:scale-90 border border-white/10"
            title="Quick Export"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      ))}
      
      {/* Scroll End Spacer */}
      <div className="flex-shrink-0 w-8 h-full pointer-events-none" />
    </div>
  );
};

export default Filmstrip;
