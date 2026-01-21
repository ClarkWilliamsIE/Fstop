
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { EditParams, DEFAULT_PARAMS, Photo, Preset, isPhotoEdited } from './types';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import TopBar from './components/TopBar';
import Filmstrip from './components/Filmstrip';
import { applyPipeline } from './engine';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [clipboard, setClipboard] = useState<EditParams | null>(null);
  const [imageElements, setImageElements] = useState<Record<string, HTMLImageElement>>({});
  const [exportStatus, setExportStatus] = useState<{ current: number, total: number } | null>(null);
  const [lastDismissedId, setLastDismissedId] = useState<string | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const demoPhotos = [
      { id: '1', name: 'Coastline.jpg', src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80', params: { ...DEFAULT_PARAMS } },
      { id: '2', name: 'Urban.jpg', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=2000&q=80', params: { ...DEFAULT_PARAMS } },
      { id: '3', name: 'Highways.jpg', src: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=2000&q=80', params: { ...DEFAULT_PARAMS } },
    ];
    setPhotos(demoPhotos);
    setActivePhotoId('1');

    demoPhotos.forEach(p => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = p.src;
      img.onload = () => {
        setImageElements(prev => ({ ...prev, [p.id]: img }));
      };
    });
  }, []);

  const activePhoto = useMemo(() => 
    photos.find(p => p.id === activePhotoId) || null, 
    [photos, activePhotoId]
  );

  const activeImage = useMemo(() => 
    activePhotoId ? imageElements[activePhotoId] : null, 
    [imageElements, activePhotoId]
  );

  const editedPhotos = useMemo(() => 
    photos.filter(p => isPhotoEdited(p.params) && !p.hiddenFromEdited), 
    [photos]
  );

  const handleUpdateParams = (newParams: EditParams) => {
    if (!activePhotoId) return;
    setPhotos(prev => prev.map(p => 
      p.id === activePhotoId ? { ...p, params: newParams, lastEdited: Date.now(), hiddenFromEdited: false } : p
    ));
  };

  const handleDismissPhoto = (id: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, hiddenFromEdited: true } : p
    ));
    setLastDismissedId(id);
  };

  const handleUndoDismiss = () => {
    if (!lastDismissedId) return;
    setPhotos(prev => prev.map(p => 
      p.id === lastDismissedId ? { ...p, hiddenFromEdited: false } : p
    ));
    setLastDismissedId(null);
  };

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

  const processSingleExport = async (photo: Photo, img: HTMLImageElement, directoryHandle?: any) => {
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

  const handleBatchExport = async (targetPhotos: Photo[] = photos) => {
    if (targetPhotos.length === 0) return;
    
    let directoryHandle: any = null;
    
    if ('showDirectoryPicker' in window) {
      try {
        directoryHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          id: 'f64-export'
        });
      } catch (e) {
        console.warn("Folder selection skipped.");
        return;
      }
    }

    setExportStatus({ current: 0, total: targetPhotos.length });
    
    for (let i = 0; i < targetPhotos.length; i++) {
      const photo = targetPhotos[i];
      const img = imageElements[photo.id];
      if (img) {
        setExportStatus({ current: i + 1, total: targetPhotos.length });
        await processSingleExport(photo, img, directoryHandle);
        if (!directoryHandle) await new Promise(r => setTimeout(r, 600));
      }
    }
    
    setExportStatus(null);
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-[#d4d4d4] overflow-hidden">
      <TopBar 
        onOpen={() => fileInputRef.current?.click()} 
        onExport={() => activePhoto && activeImage && processSingleExport(activePhoto, activeImage)}
        onReset={() => handleUpdateParams(DEFAULT_PARAMS)}
        onCopy={() => activePhoto && setClipboard({ ...activePhoto.params })}
        onPaste={() => clipboard && handleUpdateParams({ ...clipboard })}
        canPaste={!!clipboard}
        isExporting={!!exportStatus}
      />
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />

      <div className="flex flex-1 overflow-hidden relative">
        {exportStatus && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-md">
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col items-center w-80">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent animate-spin rounded-full mb-6" />
              <p className="text-sm font-semibold text-white uppercase tracking-widest text-center">Exporting Collection</p>
              <p className="text-2xl font-mono mt-2 text-blue-400">
                {exportStatus.current} <span className="text-zinc-600">/</span> {exportStatus.total}
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-[#1a1a1a] min-w-0 overflow-hidden">
          <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
            {activeImage ? (
              <Viewport 
                image={activeImage} 
                params={activePhoto!.params} 
                isCropMode={isCropMode} 
                onUpdateCrop={(crop) => handleUpdateParams({ ...activePhoto!.params, crop })}
              />
            ) : (
              <div className="text-zinc-700 font-medium text-sm animate-pulse text-center">
                Select an asset to begin developing
              </div>
            )}
          </div>
          
          <Filmstrip 
            photos={photos} 
            activePhotoId={activePhotoId} 
            onSelect={setActivePhotoId} 
            onAdd={() => fileInputRef.current?.click()}
            onExportSpecific={(photo) => {
              const img = imageElements[photo.id];
              if (img) processSingleExport(photo, img);
            }}
          />
        </div>

        <aside className="w-80 bg-[#1e1e1e] border-l border-zinc-800 flex flex-col h-full z-10 shadow-2xl flex-shrink-0">
          <Sidebar 
            params={activePhoto?.params || DEFAULT_PARAMS} 
            onChange={handleUpdateParams}
            presets={presets}
            onSavePreset={(name) => activePhoto && setPresets(prev => [...prev, { id: Date.now().toString(), name: name || `New Preset`, params: { ...activePhoto.params } }])}
            onApplyPreset={(p) => handleUpdateParams({ ...p.params })}
            editedPhotos={editedPhotos}
            onBatchExportEdited={() => handleBatchExport(editedPhotos)}
            onSelectPhoto={setActivePhotoId}
            onDismissPhoto={handleDismissPhoto}
            onUndoDismiss={handleUndoDismiss}
            hasLastDismissed={!!lastDismissedId}
            isCropMode={isCropMode}
            onToggleCropMode={() => setIsCropMode(!isCropMode)}
          />
        </aside>
      </div>
    </div>
  );
};

export default App;
