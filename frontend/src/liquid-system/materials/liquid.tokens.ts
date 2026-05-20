// src/liquid-system/materials/liquid.tokens.ts

export interface LiquidTokens {
  surface: {
    blur: number;
    opacity: number;
    background: string;
    border: string;
    shadow: string;
    radius: number;
  };
  depth: {
    elevation: number;
    spread: number;
    ambient: string;
    directional: string;
  };
  light: {
    ambientIntensity: number;
    directionalIntensity: number;
    specularIntensity: number;
    specularColor: string;
    rimIntensity: number;
    rimColor: string;
  };
  motion: {
    springStiffness: number;
    springDamping: number;
    springMass: number;
    hoverScale: number;
    tapScale: number;
    rippleDuration: number;
  };
  interaction: {
    touchPressureMultiplier: number;
    distortionMax: number;
    glowRadius: number;
    glowIntensity: number;
    chromaticShift: number;
  };
}

export const liquidTokens: LiquidTokens = {
  surface: {
    blur: 24,
    opacity: 0.08,
    background: "rgba(253, 246, 240, 0.7)",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    shadow: "0 2px 8px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.4)",
    radius: 50, // percentage for circle
  },
  depth: {
    elevation: 8,
    spread: 16,
    ambient: "rgba(0, 0, 0, 0.06)",
    directional: "rgba(0, 0, 0, 0.12)",
  },
  light: {
    ambientIntensity: 0.15,
    directionalIntensity: 0.25,
    specularIntensity: 0.4,
    specularColor: "rgba(255, 255, 255, 0.6)",
    rimIntensity: 0.2,
    rimColor: "rgba(180, 130, 110, 0.3)",
  },
  motion: {
    springStiffness: 400,
    springDamping: 17,
    springMass: 0.8,
    hoverScale: 1.06,
    tapScale: 0.94,
    rippleDuration: 600,
  },
  interaction: {
    touchPressureMultiplier: 1.5,
    distortionMax: 8,
    glowRadius: 40,
    glowIntensity: 0.25,
    chromaticShift: 1.2,
  },
};
