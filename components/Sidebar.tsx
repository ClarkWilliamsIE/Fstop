
import React, { useState } from 'react';
import { EditParams, HSLChannel, HSLParams, Preset, CropParams, Photo } from '../types';

interface SidebarProps {
  params: EditParams;
  onChange: (params: EditParams) => void;
  presets: Preset[];
  onSavePreset: (name: string) => void;
  onApplyPreset: (preset: Preset) => void;
  editedPhotos: Photo[];
  onBatchExportEdited: () => void;
  onSelectPhoto: (id: string) => void;
  onDismissPhoto: (id: string) => void;
  onUndoDismiss: () => void;
  hasLastDismissed: boolean;
  isCropMode: boolean;
  onToggleCropMode: () => void;
}

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-800">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 flex justify-between items-center hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4 pt-0 space-y-4">{children}</div>}
    </div>
  );
};

const Slider: React.FC<{
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
}> = ({ label, min, max, step, value, onChange }) => (
  <div className="group">
    <div className="flex justify-between items-center mb-1">
      <label className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</label>
      <span className="text-[10px] text-zinc-500 font-mono">
        {value > 0 ? `+${value.toFixed(step >= 1 ? 0 : 2)}` : value.toFixed(step >= 1 ? 0 : 2)}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full cursor-pointer accent-blue-500"
    />
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  params, onChange, presets, onSavePreset, onApplyPreset, editedPhotos, onBatchExportEdited, onSelectPhoto, onDismissPhoto, onUndoDismiss, hasLastDismissed, isCropMode, onToggleCropMode
}) => {
  const [activeTab, setActiveTab] = useState<'develop' | 'history'>('develop');
  const [hslMode, setHslMode] = useState<'hue' | 'saturation' | 'luminance'>('saturation');
  const [newPresetName, setNewPresetName] = useState('');
  const [isAspectLocked, setIsAspectLocked] = useState(false);

  const updateParam = (key: keyof EditParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const updateHSL = (channel: HSLChannel, field: keyof HSLParams, value: number) => {
    const newHSL = { ...params.hsl };
    newHSL[channel] = { ...newHSL[channel], [field]: value };
    updateParam('hsl', newHSL);
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Tab Switcher */}
      <div className="flex bg-[#1a1a1a] p-1.5 border-b border-zinc-800 shrink-0">
        <button 
          onClick={() => setActiveTab('develop')}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'develop' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Develop
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Edited Assets
          {editedPhotos.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-[8px] flex items-center justify-center text-white shadow-lg">
              {editedPhotos.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'develop' ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/20">
              <div className="flex gap-2 mb-3">
                <button 
                  onClick={onToggleCropMode}
                  className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${isCropMode ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}`}
                >
                  <svg className={`w-5 h-5 ${isCropMode ? 'text-white' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isCropMode ? 'text-white' : 'text-zinc-500'}`}>Crop Tool</span>
                </button>
              </div>

              {isCropMode && (
                <div className="flex items-center justify-between px-1 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Proportions</span>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200">Lock Aspect</span>
                    <input 
                      type="checkbox" 
                      className="w-3 h-3 accent-blue-500" 
                      checked={isAspectLocked} 
                      onChange={(e) => {
                        setIsAspectLocked(e.target.checked);
                        // Communicate lock state to window/global for the Viewport to read
                        (window as any).__cropAspectLocked = e.target.checked;
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <Accordion title="Presets">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="New preset name..."
                    className="bg-zinc-900 border border-zinc-800 rounded p-1.5 text-[11px] flex-1 outline-none focus:border-blue-500 text-zinc-300"
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (onSavePreset(newPresetName), setNewPresetName(''))}
                  />
                  <button 
                    onClick={() => { onSavePreset(newPresetName); setNewPresetName(''); }} 
                    className="px-3 bg-zinc-800 hover:bg-zinc-700 rounded text-xs border border-zinc-700 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-1">
                  {presets.length === 0 && <p className="text-[10px] text-zinc-600 italic px-1">No custom presets.</p>}
                  {presets.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => onApplyPreset(p)} 
                      className="w-full text-left text-[11px] py-1.5 px-3 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-all border border-transparent hover:border-zinc-700 truncate"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </Accordion>

            <Accordion title="Basic" defaultOpen>
              <div className="space-y-5">
                <div className="space-y-4">
                  <Slider label="Temp" min={-100} max={100} step={1} value={params.temperature} onChange={(v) => updateParam('temperature', v)} />
                  <Slider label="Tint" min={-100} max={100} step={1} value={params.tint} onChange={(v) => updateParam('tint', v)} />
                </div>
                <div className="pt-4 border-t border-zinc-800 space-y-4">
                  <Slider label="Exposure" min={-4} max={4} step={0.01} value={params.exposure} onChange={(v) => updateParam('exposure', v)} />
                  <Slider label="Contrast" min={-100} max={100} step={1} value={params.contrast} onChange={(v) => updateParam('contrast', v)} />
                  <Slider label="Highlights" min={-100} max={100} step={1} value={params.highlights} onChange={(v) => updateParam('highlights', v)} />
                  <Slider label="Shadows" min={-100} max={100} step={1} value={params.shadows} onChange={(v) => updateParam('shadows', v)} />
                </div>
                <div className="pt-4 border-t border-zinc-800 space-y-4">
                  <Slider label="Clarity" min={-100} max={100} step={1} value={params.clarity} onChange={(v) => updateParam('clarity', v)} />
                  <Slider label="Dehaze" min={-100} max={100} step={1} value={params.dehaze} onChange={(v) => updateParam('dehaze', v)} />
                  <Slider label="Vibrance" min={-100} max={100} step={1} value={params.vibrance} onChange={(v) => updateParam('vibrance', v)} />
                  <Slider label="Saturation" min={0} max={2} step={0.01} value={params.saturation} onChange={(v) => updateParam('saturation', v)} />
                </div>
                <div className="pt-4 border-t border-zinc-800 space-y-4">
                  <Slider label="Vignette" min={0} max={1} step={0.01} value={params.vignette} onChange={(v) => updateParam('vignette', v)} />
                </div>
              </div>
            </Accordion>

            <Accordion title="Color Mixer">
              <div className="flex bg-zinc-900 rounded p-1 mb-4">
                {(['hue', 'saturation', 'luminance'] as const).map(m => (
                  <button key={m} onClick={() => setHslMode(m)} className={`flex-1 py-1 text-[9px] capitalize rounded transition-all ${hslMode === m ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-400'}`}>{m}</button>
                ))}
              </div>
              <div className="space-y-3">
                {(Object.keys(params.hsl) as HSLChannel[]).map(ch => (
                  <Slider key={ch} label={ch} min={-100} max={100} step={1} value={params.hsl[ch][hslMode]} onChange={v => updateHSL(ch, hslMode, v)} />
                ))}
              </div>
            </Accordion>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Edited Assets</h3>
                <span className="text-[10px] text-zinc-600 font-mono">{editedPhotos.length} Items</span>
              </div>
              <button 
                disabled={editedPhotos.length === 0}
                onClick={onBatchExportEdited}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-[11px] font-bold rounded transition-all shadow-lg shadow-blue-900/10 mb-2 uppercase tracking-wide"
              >
                Export Collection
              </button>
              
              {hasLastDismissed && (
                <button 
                  onClick={onUndoDismiss}
                  className="w-full py-1.5 mt-1 bg-zinc-800 hover:bg-zinc-700 text-blue-400 text-[10px] font-medium rounded border border-zinc-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  Undo Remove
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {editedPhotos.length === 0 ? (
                <div className="text-center py-16 text-zinc-600">
                  <div className="text-4xl mb-3 opacity-10">📸</div>
                  <p className="text-[11px] px-8 text-center leading-relaxed">Modify a photo to see it here. Dismiss ready assets to finalize your batch.</p>
                </div>
              ) : (
                editedPhotos.map(photo => (
                  <div 
                    key={photo.id} 
                    className="flex gap-3 p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-all group relative cursor-pointer active:scale-95"
                    onClick={() => onSelectPhoto(photo.id)}
                  >
                    <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-black border border-zinc-800">
                      <img src={photo.src} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={photo.name} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[11px] font-medium text-zinc-300 truncate group-hover:text-white transition-colors pr-6">{photo.name}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">Modified</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissPhoto(photo.id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-zinc-950/50 opacity-0 group-hover:opacity-100 hover:bg-red-900/50 transition-all text-zinc-500 hover:text-white"
                      title="Remove from batch"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
