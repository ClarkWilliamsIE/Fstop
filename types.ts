
export type HSLChannel = 'red' | 'orange' | 'yellow' | 'green' | 'aqua' | 'blue' | 'purple' | 'magenta';

export interface HSLParams {
  hue: number;
  saturation: number;
  luminance: number;
}

export interface CropParams {
  top: number;    // 0 to 100 percentage
  bottom: number; // 0 to 100 percentage
  left: number;   // 0 to 100 percentage
  right: number;  // 0 to 100 percentage
}

export interface EditParams {
  profile: 'adobe-color' | 'vivid' | 'portrait' | 'landscape';
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  texture: number;
  clarity: number;
  dehaze: number;
  vibrance: number;
  saturation: number;
  curveHighlights: number;
  curveLights: number;
  curveDarks: number;
  curveShadows: number;
  hsl: Record<HSLChannel, HSLParams>;
  vignette: number;
  crop: CropParams;
}

export interface Preset {
  id: string;
  name: string;
  params: EditParams;
}

export interface Photo {
  id: string;
  name: string;
  src: string;
  params: EditParams;
  lastEdited?: number;
  hiddenFromEdited?: boolean;
}

const defaultHSL = (): HSLParams => ({ hue: 0, saturation: 0, luminance: 0 });

export const DEFAULT_PARAMS: EditParams = {
  profile: 'adobe-color',
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  texture: 0,
  clarity: 0,
  dehaze: 0,
  vibrance: 0,
  saturation: 1,
  curveHighlights: 0,
  curveLights: 0,
  curveDarks: 0,
  curveShadows: 0,
  vignette: 0,
  crop: { top: 0, bottom: 0, left: 0, right: 0 },
  hsl: {
    red: defaultHSL(),
    orange: defaultHSL(),
    yellow: defaultHSL(),
    green: defaultHSL(),
    aqua: defaultHSL(),
    blue: defaultHSL(),
    purple: defaultHSL(),
    magenta: defaultHSL(),
  }
};

/**
 * Checks if parameters have been modified from the default state.
 */
export const isPhotoEdited = (params: EditParams): boolean => {
  // Simple check: exposure, contrast, temperature etc.
  if (params.exposure !== 0) return true;
  if (params.contrast !== 0) return true;
  if (params.temperature !== 0) return true;
  if (params.tint !== 0) return true;
  if (params.highlights !== 0) return true;
  if (params.shadows !== 0) return true;
  if (params.whites !== 0) return true;
  if (params.blacks !== 0) return true;
  if (params.clarity !== 0) return true;
  if (params.dehaze !== 0) return true;
  if (params.vibrance !== 0) return true;
  if (params.saturation !== 1) return true;
  if (params.vignette !== 0) return true;
  if (params.profile !== 'adobe-color') return true;
  
  // Crop check
  const { crop } = params;
  if (crop.top !== 0 || crop.bottom !== 0 || crop.left !== 0 || crop.right !== 0) return true;

  // HSL check
  for (const key in params.hsl) {
    const h = params.hsl[key as HSLChannel];
    if (h.hue !== 0 || h.saturation !== 0 || h.luminance !== 0) return true;
  }

  return false;
};
