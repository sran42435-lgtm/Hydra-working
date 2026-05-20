// src/liquid-system/materials/glass.presets.ts

export interface GlassPreset {
  name: string;
  blur: number;
  opacity: number;
  refractionIndex: number;
  chromaticAberration: boolean;
  glow: number;
  background: string;
  border: string;
}

export const crystalGlass: GlassPreset = {
  name: "crystal",
  blur: 24,
  opacity: 0.08,
  refractionIndex: 1.1,
  chromaticAberration: true,
  glow: 0.18,
  background: "rgba(253, 246, 240, 0.7)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
};

export const frostedGlass: GlassPreset = {
  name: "frosted",
  blur: 40,
  opacity: 0.15,
  refractionIndex: 1.0,
  chromaticAberration: false,
  glow: 0.12,
  background: "rgba(240, 240, 240, 0.8)",
  border: "1px solid rgba(255, 255, 255, 0.5)",
};

export const tintedGlass: GlassPreset = {
  name: "tinted",
  blur: 20,
  opacity: 0.12,
  refractionIndex: 1.15,
  chromaticAberration: true,
  glow: 0.22,
  background: "rgba(180, 130, 110, 0.2)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
};

export const mirrorGlass: GlassPreset = {
  name: "mirror",
  blur: 8,
  opacity: 0.05,
  refractionIndex: 1.4,
  chromaticAberration: false,
  glow: 0.3,
  background: "rgba(255, 255, 255, 0.3)",
  border: "1px solid rgba(255, 255, 255, 0.6)",
};

export const glassPresets = {
  crystal: crystalGlass,
  frosted: frostedGlass,
  tinted: tintedGlass,
  mirror: mirrorGlass,
} as const;
