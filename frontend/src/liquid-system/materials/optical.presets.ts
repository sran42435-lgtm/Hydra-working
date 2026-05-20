// src/liquid-system/materials/optical.presets.ts

export interface OpticalPreset {
  name: string;
  refractionStrength: number;
  chromaticShift: number;
  causticsIntensity: number;
  noiseScale: number;
  noiseOctaves: number;
  distortionScale: number;
}

export const subtleOptical: OpticalPreset = {
  name: "subtle",
  refractionStrength: 0.02,
  chromaticShift: 1.1,
  causticsIntensity: 0.03,
  noiseScale: 0.5,
  noiseOctaves: 2,
  distortionScale: 3,
};

export const balancedOptical: OpticalPreset = {
  name: "balanced",
  refractionStrength: 0.04,
  chromaticShift: 1.2,
  causticsIntensity: 0.06,
  noiseScale: 1.0,
  noiseOctaves: 3,
  distortionScale: 6,
};

export const intenseOptical: OpticalPreset = {
  name: "intense",
  refractionStrength: 0.08,
  chromaticShift: 1.4,
  causticsIntensity: 0.12,
  noiseScale: 2.0,
  noiseOctaves: 4,
  distortionScale: 12,
};

export const opticalPresets = {
  subtle: subtleOptical,
  balanced: balancedOptical,
  intense: intenseOptical,
} as const;
