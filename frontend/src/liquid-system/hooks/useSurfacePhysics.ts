// src/liquid-system/hooks/useSurfacePhysics.ts

import { useRef, useCallback } from 'react';
import { createPressureState, setPressure, updatePressure, PressureState } from '../physics/touch-pressure';
import { computeElasticDeformation, ElasticConfig, defaultElasticConfig } from '../physics/elastic';

export function useSurfacePhysics(config: Partial<ElasticConfig> = {}) {
  const pressureRef = useRef<PressureState>(createPressureState());
  const elasticConfigRef = useRef<ElasticConfig>({ ...defaultElasticConfig, ...config });

  const onPointerDown = useCallback(() => {
    setPressure(pressureRef.current, 1);
  }, []);

  const onPointerUp = useCallback(() => {
    setPressure(pressureRef.current, 0);
  }, []);

  /**
   * Hitung deformasi pada jarak tertentu dari titik sentuh.
   * @param distance - jarak dari titik sentuh (px)
   * @returns nilai deformasi (0–1)
   */
  const getDeformation = useCallback((distance: number): number => {
    const pressure = updatePressure(pressureRef.current);
    const deformation = computeElasticDeformation(distance, pressure, elasticConfigRef.current);
    return deformation / elasticConfigRef.current.maxDeformation; // normalisasi 0–1
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    getDeformation,
    getPressure: () => pressureRef.current.current,
  };
}
