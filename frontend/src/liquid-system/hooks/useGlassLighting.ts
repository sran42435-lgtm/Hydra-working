// src/liquid-system/hooks/useGlassLighting.ts

import { useEffect, useState } from 'react';
import { getLightingState, subscribeLighting, LightingState } from '../runtime/lighting.runtime';

export function useGlassLighting() {
  const [lighting, setLighting] = useState<LightingState>(getLightingState());

  useEffect(() => {
    return subscribeLighting(setLighting);
  }, []);

  return lighting;
}
