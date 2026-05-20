// src/liquid-system/hooks/useOpticalRefraction.ts

import { useEffect, useRef, useCallback } from 'react';
import { glassRenderer } from '../engine/renderer/GlassRenderer';
import { RefractionPass } from '../engine/renderer/RefractionPass';
import { getPointerState } from '../runtime/pointer.runtime';
import { getLightingState } from '../runtime/lighting.runtime';
import { getQualitySettings, subscribeQuality } from '../performance/adaptive-quality';
import { shouldRenderFrame } from '../performance/render-throttle';

export function useOpticalRefraction(
  surfaceId: string,
  intensity: number = 0.5,
  backgroundElement?: HTMLElement | null
) {
  const refractionPassRef = useRef(new RefractionPass());
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const surface = glassRenderer.register(surfaceId, canvasRef.current);
    if (!surface) return;

    const refraction = refractionPassRef.current;

    // === PANGGIL CAPTURE BACKGROUND ===
    const capture = async () => {
      const targetEl =
        backgroundElement || canvasRef.current?.parentElement;
      if (targetEl) {
        await refraction.captureBackground(
          surfaceId,
          targetEl as HTMLElement
        );
      }
    };
    capture();

    // === SETTINGS ADAPTIF ===
    const applySettings = () => {
      const quality = getQualitySettings();
      if (!quality.enableShaders || quality.shaderComplexity === 0) {
        surface.canvas.style.display = 'none';
        return;
      }
      surface.canvas.style.display = 'block';

      refraction.apply(surfaceId, {
        strength: intensity * quality.shaderComplexity,
        chromaticShift: quality.chromaticAberration ? 0.3 : 0,
        glowIntensity: quality.specularLighting ? 0.4 : 0,
        glowColor: [1.0, 0.95, 0.9],
        noiseScale: 0,
        noiseOctaves: 0,
      });
    };

    applySettings();
    const unsubQuality = subscribeQuality(applySettings);

    // === RENDER LOOP ===
    const render = () => {
      if (!shouldRenderFrame()) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      const pointer = getPointerState();
      const lighting = getLightingState();

      const surf = glassRenderer.getSurface(surfaceId);
      if (surf && surf.program) {
        const gl = surf.gl;
        gl.useProgram(surf.program);
        const u = surf.uniforms;
        gl.uniform2f(u.u_touchPoint, pointer.x, 1.0 - pointer.y);
        gl.uniform1f(u.u_pressure, pointer.isDown ? 1.0 : 0.0);
        gl.uniform2f(u.u_resolution, surf.width, surf.height);
        gl.uniform1f(u.u_time, performance.now() / 1000);
      }

      refraction.render(surfaceId);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      glassRenderer.unregister(surfaceId);
      unsubQuality();
    };
  }, [surfaceId, intensity, backgroundElement]);

  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
  }, []);

  return { canvasRef: setCanvasRef };
}
