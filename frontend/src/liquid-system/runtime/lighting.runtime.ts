// Global dynamic lighting model

export interface LightingState {
  ambientIntensity: number;      // cahaya lingkungan (0..1)
  directionalX: number;          // arah cahaya utama X (-1..1)
  directionalY: number;          // arah cahaya utama Y (-1..1)
  directionalIntensity: number;  // intensitas directional (0..1)
  specularIntensity: number;     // intensitas kilap (0..1)
  rimIntensity: number;          // intensitas rim light (0..1)
  tint: string;                  // warna bias (rgba)
}

type LightingListener = (state: LightingState) => void;

const lightingListeners = new Set<LightingListener>();

let lightingState: LightingState = {
  ambientIntensity: 0.15,
  directionalX: 0.5,
  directionalY: -0.5,
  directionalIntensity: 0.25,
  specularIntensity: 0.4,
  rimIntensity: 0.2,
  tint: 'rgba(255, 255, 255, 0.6)',
};

export function getLightingState(): LightingState {
  return lightingState;
}

export function subscribeLighting(fn: LightingListener): () => void {
  lightingListeners.add(fn);
  return () => lightingListeners.delete(fn);
}

export function setLightingState(partial: Partial<LightingState>) {
  lightingState = { ...lightingState, ...partial };
  lightingListeners.forEach((fn) => fn(lightingState));
}

// Update arah cahaya berdasarkan posisi pointer
import { subscribePointer, PointerState } from './pointer.runtime';

subscribePointer((pointer: PointerState) => {
  // Arah cahaya mengikuti pointer, tapi lebih subtle
  const targetX = (pointer.x - 0.5) * 0.6;
  const targetY = (pointer.y - 0.5) * 0.6;

  // Lerp halus untuk menghindari perubahan mendadak
  lightingState.directionalX += (targetX - lightingState.directionalX) * 0.05;
  lightingState.directionalY += (targetY - lightingState.directionalY) * 0.05;

  // Intensitas naik saat ditekan
  const pressureBonus = pointer.isDown ? pointer.pressure * 0.15 : 0;
  lightingState.specularIntensity +=
    ((0.4 + pressureBonus) - lightingState.specularIntensity) * 0.1;

  lightingListeners.forEach((fn) => fn(lightingState));
});
