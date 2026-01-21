import React, { useState, useRef, useEffect, useMemo } from 'react';
import { EditParams, DEFAULT_PARAMS, Photo, Preset, isPhotoEdited } from './types';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import TopBar from './components/TopBar';
import Filmstrip from './components/Filmstrip';
import { applyPipeline } from './engine';
import { supabase } from './lib/supabase'; // Ensure this file exists

const App: React.FC = () => {
  // --- Existing State ---
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [clipboard, setClipboard] = useState<EditParams | null>(null);
  const [imageElements, setImageElements] = useState<Record<string, HTMLImageElement>>({});
  const [exportStatus, setExportStatus] = useState<{ current: number, total: number } | null>(null);
  const [lastDismissedId, setLastDismissedId] = useState<string | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  
  // --- New Auth & Paywall State ---
  const [session, setSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usage, setUsage] = useState(0);
  const [isPro, setIsPro] = useState(false);
  
  const FREE_LIMIT = 30;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Check Auth & Fetch Usage on Load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUsageAndProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUsageAndProfile(session.user.id);
      else {
        setUsage(0);
        setIsPro(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUsageAndProfile = async (userId: string) => {
    // A. Check Pro Status
    const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', userId).single();
    if (profile) setIsPro(profile.is_pro);

    // B. Check Usage (This Month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    
    const { count } = await supabase
      .from('export_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());
      
    if (count !== null) setUsage(count);
  };

  // --- Existing Image Loading Logic (Preserved) ---
  useEffect(() => {
    const demoPhotos = [
      { id: '1', name: 'Coastline.jpg', src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80', params: { ...DEFAULT_PARAMS } },
    ];
    setPhotos(demoPhotos);
    setActivePhotoId('1');
    demoPhotos.forEach(p => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = p.src;
      img.onload = () => setImageElements(prev => ({ ...prev, [p.id]: img }));
    });
  }, []);

  const activePhoto = useMemo(() => photos.find(p => p.id === activePhotoId) || null, [photos, activePhotoId]);
  const activeImage = useMemo(() => activePhotoId ? imageElements[activePhotoId] : null, [imageElements, activePhotoId]);
  const editedPhotos = useMemo(() => photos.filter(p => isPhotoEdited(p.params) && !p.hiddenFromEdited), [photos]);

  const handleUpdateParams = (newParams: EditParams) => {
    if (!activePhotoId) return;
    setPhotos(prev => prev.map(p => p.id === activePhotoId ? { ...p, params: newParams, lastEdited: Date.now(), hiddenFromEdited: false } : p));
  };
  
  const handleDismissPhoto = (id: string) => { setPhotos(prev => prev.map(p => p.id === id ? { ...p, hiddenFromEdited: true } : p)); setLastDismissedId(id); };
  const handleUndoDismiss = () => { if (!lastDismissedId) return; setPhotos(prev => prev.map(p => p.id === lastDismissedId ? { ...p, hiddenFromEdited: false } : p)); setLastDismissedId(null); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const id = Math.random().toString(36).substr(2, 9);
          const src = event.target?.result as string;
          const newPhoto: Photo = { id, name: file.name, src, params: { ...DEFAULT_PARAMS } };
          const img = new Image();
          img.onload = () => {
            setImageElements(prev => ({ ...prev, [id]: img }));
            setPhotos(prev => [...prev, newPhoto]);
            setActivePhotoId(id);
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // --- NEW: Quota Check Logic ---
  const checkQuota = (amount: number): boolean => {
    if (!session) {
      setShowAuthModal(true);
      return false;
    }
    if (isPro) return true;
    if (usage + amount > FREE_LIMIT) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const logExport = async (amount: number) => {
    if (!session) return;
    const { error } = await supabase.from('export_logs').insert(
      Array(amount).fill({ user_id: session.user.id })
    );
    if (!error) setUsage(prev => prev + amount);
  };

  // --- Wrapped Export Logic ---
  const handleSingleExport = async () => {
    if (!activePhoto || !activeImage) return;
    if (!checkQuota(1)) return; // STOP if quota exceeded

    await processSingleExport(activePhoto, activeImage);
    await logExport(1); // Log usage
  };

  const processSingleExport = async (photo: Photo, img: HTMLImageElement, directoryHandle?: any) => {
    // ... (This function remains exactly the same as your original file) ...
    // COPY THE CONTENT OF processSingleExport FROM YOUR PREVIOUS App.tsx HERE
    // For brevity I am not re-typing the canvas logic, but you MUST keep it.
    const canvas = document.createElement('canvas');
    const { crop } = photo.params;
    
    const sx = (crop.left / 100) * img.width;
    const sy = (crop.top / 100) * img.height;
    const sw = img.width * (1 - (crop.left + crop.right) / 100);
    const sh = img.height * (1 - (crop.top + crop.bottom) / 100);

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const imgData = ctx.getImageData(0, 0, sw, sh);
      applyPipeline(imgData, photo.params, sw, sh);
      ctx.putImageData(imgData, 0, 0);

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.95));
      if (!blob) return;

      if (directoryHandle) {
        try {
          const fileHandle = await directoryHandle.getFileHandle(photo.name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (e) {
          console.error("Failed to write to folder", e);
        }
      } else {
        const link = document.createElement('a');
        link.download = `f64_${photo.name}`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    }
  };

  const handleBatchExportWrapped = async () => {
    if (editedPhotos.length === 0) return;
    if (!checkQuota(editedPhotos.length)) return; // STOP if batch exceeds quota

    // ... (Original Batch Logic) ...
    let directoryHandle: any = null;
    if ('showDirectoryPicker' in window) {
      try {
        directoryHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite', id: 'f64-export' });
      } catch (e) { return; }
    }
    setExportStatus({ current: 0, total: editedPhotos.length });
    
    for (let i = 0; i < editedPhotos.length; i++) {
      const photo = editedPhotos[i];
      const img = imageElements[photo.id];
      if (img) {
        setExportStatus({ current: i + 1, total: editedPhotos.length });
        await processSingleExport(photo, img, directoryHandle);
        if (!directoryHandle) await new Promise(r => setTimeout(r, 600));
      }
    }
    setExportStatus(null);
    await logExport(editedPhotos.length);
  };

  // --- Render ---
  return (
    <div className="flex flex-col h-screen bg-[#121212] text-[#d4d4d4] overflow-hidden">
      <TopBar 
        onOpen={() => fileInputRef.current?.click()} 
        onExport={handleSingleExport} // CHANGED to wrapped version
        onReset={() => handleUpdateParams(DEFAULT_PARAMS)}
        onCopy={() => activePhoto && setClipboard({ ...activePhoto.params })}
        onPaste={() => clipboard && handleUpdateParams({ ...clipboard })}
        canPaste={!!clipboard}
        isExporting={!!exportStatus}
      />
      
      {/* Show logged in status or "Upgrade" in a small bar */}
      <div className="absolute top-2 right-44 z-50 text-[10px] bg-black/50 px-2 py-1 rounded border border-white/10 flex items-center gap-2">
         {session ? (
           <>
             <span className={isPro ? "text-yellow-400 font-bold" : "text-zinc-400"}>
               {isPro ? "PRO LICENSE" : `${usage}/${FREE_LIMIT} Free Exports`}
             </span>
             <button onClick={() => supabase.auth.signOut()} className="hover:text-white underline">Logout</button>
           </>
         ) : (
           <button onClick={() => setShowAuthModal(true)} className="text-blue-400 hover:text-blue-300 font-bold">Sign In to Save</button>
         )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />

      {/* --- EXPORT PROGRESS MODAL (Existing) --- */}
      {exportStatus && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-md">
           <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col items-center w-80">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent animate-spin rounded-full mb-6" />
            <p className="text-sm font-semibold text-white uppercase tracking-widest text-center">Exporting Collection</p>
            <p className="text-2xl font-mono mt-2 text-blue-400">{exportStatus.current} <span className="text-zinc-600">/</span> {exportStatus.total}</p>
          </div>
        </div>
      )}

      {/* --- AUTH MODAL (New) --- */}
      {showAuthModal && (
        <div className="absolute inset-0 z-[60] bg-black/90 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-zinc-900 p-8 rounded border border-zinc-700 w-80 text-center">
            <h2 className="text-xl text-white font-light mb-4 tracking-widest uppercase">Sign In</h2>
            <button 
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              className="w-full bg-white text-black font-bold py-2 rounded mb-3 hover:bg-gray-200 transition"
            >
              Sign in with Google
            </button>
            <button onClick={() => setShowAuthModal(false)} className="text-xs text-zinc-500 hover:text-white mt-4">Cancel</button>
          </div>
        </div>
      )}

      {/* --- PAYWALL MODAL (New) --- */}
      {showPaywall && (
        <div className="absolute inset-0 z-[60] bg-black/90 flex items-center justify-center backdrop-blur-md">
           <div className="bg-zinc-900 p-8 rounded-2xl border border-blue-500/30 shadow-2xl max-w-md text-center">
             <h2 className="text-2xl font-bold text-white mb-2">Free Limit Reached</h2>
             <p className="text-zinc-400 mb-6">You've used your 30 free exports for this month.</p>
             <a 
               href="YOUR_STRIPE_PAYMENT_LINK_HERE" 
               target="_blank"
               rel="noopener noreferrer"
               className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded uppercase tracking-widest mb-4 transition-all"
             >
               Unlock Unlimited ($2/mo)
             </a>
             <button onClick={() => setShowPaywall(false)} className="text-xs text-zinc-500 hover:text-white">Maybe Later</button>
           </div>
        </div>
      )}

      {/* ... Rest of UI (Viewport, Filmstrip, Sidebar) ... */}
      <div className="flex-1 flex flex-col bg-[#1a1a1a] min-w-0 overflow-hidden">
        <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
          {activeImage ? (
            <Viewport image={activeImage} params={activePhoto!.params} isCropMode={isCropMode} onUpdateCrop={(crop) => handleUpdateParams({ ...activePhoto!.params, crop })} />
          ) : (
            <div className="text-zinc-700 font-medium text-sm animate-pulse text-center">Select an asset to begin developing</div>
          )}
        </div>
        <Filmstrip photos={photos} activePhotoId={activePhotoId} onSelect={setActivePhotoId} onAdd={() => fileInputRef.current?.click()} onExportSpecific={(photo) => { const img = imageElements[photo.id]; if (img) { setActivePhotoId(photo.id); handleSingleExport(); } }} />
      </div>

      <aside className="w-80 bg-[#1e1e1e] border-l border-zinc-800 flex flex-col h-full z-10 shadow-2xl flex-shrink-0">
        <Sidebar 
          params={activePhoto?.params || DEFAULT_PARAMS} 
          onChange={handleUpdateParams}
          presets={presets}
          onSavePreset={(name) => activePhoto && setPresets(prev => [...prev, { id: Date.now().toString(), name: name || `New Preset`, params: { ...activePhoto.params } }])}
          onApplyPreset={(p) => handleUpdateParams({ ...p.params })}
          editedPhotos={editedPhotos}
          onBatchExportEdited={handleBatchExportWrapped} // CHANGED to wrapped version
          onSelectPhoto={setActivePhotoId}
          onDismissPhoto={handleDismissPhoto}
          onUndoDismiss={handleUndoDismiss}
          hasLastDismissed={!!lastDismissedId}
          isCropMode={isCropMode}
          onToggleCropMode={() => setIsCropMode(!isCropMode)}
        />
      </aside>
    </div>
  );
};

export default App;
