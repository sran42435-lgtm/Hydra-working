// Adaptive quality scaler berdasarkan GPU budget

import { getGPUBudget, subscribeGPUBudget, GPUBudget } from './gpu-budget';

export interface QualitySettings {
  blurRadius: number;
  enableShaders: boolean;
  enableRipple: boolean;
  maxRippleCount: number;
  shaderComplexity: number;
  chromaticAberration: boolean;
  specularLighting: boolean;
  rimLighting: boolean;
  noiseDetail: number;          // 0..1
  animationFrameSkip: number;   // 1 = setiap frame, 2 = setiap 2 frame, dst.
}

type QualityListener = (settings: QualitySettings) => void;
const qualityListeners = new Set<QualityListener>();

let currentSettings: QualitySettings = computeSettings(getGPUBudget());

function computeSettings(budget: GPUBudget): QualitySettings {
  const { tier, maxBlurRadius, maxRippleCount, canUseShaders, canUseRipple, shaderComplexity } = budget;

  return {
    blurRadius: maxBlurRadius,
    enableShaders: canUseShaders,
    enableRipple: canUseRipple,
    maxRippleCount,
    shaderComplexity,
    chromaticAberration: shaderComplexity > 0.4,
    specularLighting: shaderComplexity > 0.2,
    rimLighting: shaderComplexity > 0.2,
    noiseDetail: shaderComplexity,
    animationFrameSkip: tier === 'low' ? 2 : 1,
  };
}

export function getQualitySettings(): QualitySettings {
  return currentSettings;
}

export function subscribeQuality(fn: QualityListener): () => void {
  qualityListeners.add(fn);
  return () => qualityListeners.delete(fn);
}

// Auto‑adapt saat budget berubah
subscribeGPUBudget((budget) => {
  const newSettings = computeSettings(budget);
  if (JSON.stringify(newSettings) !== JSON.stringify(currentSettings)) {
    currentSettings = newSettings;
    qualityListeners.forEach((fn) => fn(currentSettings));
  }
});
