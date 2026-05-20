// src/liquid-system/hooks/useRipple.ts

import { useRef, useCallback, useState } from 'react';
import {
  createRipple,
  getRippleAmplitude,
  getRippleRadius,
  isRippleDead,
  RippleState,
  defaultRippleConfig,
} from '../physics/ripple.physics';
import { getQualitySettings } from '../performance/adaptive-quality';

export function useRipple() {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const ripplesRef = useRef<RippleState[]>([]);

  const addRipple = useCallback((x: number, y: number) => {
    const settings = getQualitySettings();
    if (!settings.enableRipple) return;

    const config = { ...defaultRippleConfig };
    const ripple = createRipple(x, y, config);
    ripplesRef.current = [...ripplesRef.current, ripple];
    setRipples(ripplesRef.current);
    startLoopIfNeeded();
  }, []);

  const removeRipple = useCallback((id: number) => {
    ripplesRef.current = ripplesRef.current.filter((r) => r.id !== id);
    setRipples(ripplesRef.current);
  }, []);

  const startLoopIfNeeded = useCallback(() => {
    if (animFrameRef.current !== null) return;

    const loop = () => {
      const now = performance.now();
      let changed = false;

      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        if (isRippleDead(ripple, now)) {
          changed = true;
          return false;
        }
        return true;
      });

      if (changed) {
        setRipples([...ripplesRef.current]);
      }

      if (ripplesRef.current.length > 0) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  return { ripples, addRipple, removeRipple };
}
