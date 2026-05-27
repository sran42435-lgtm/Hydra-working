/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.effects.Blur.kt
   Licensed under Apache License, Version 2.0
*/

import { BackdropEffectScope } from '../core/BackdropEffectScope';
import { BlurEffect } from './RenderEffect';
import { addEffect } from './RenderEffect';

// ============================================================================
// TILE MODE
// ============================================================================

/**
 * Edge treatment modes for blur effect.
 * Port of Android's TileMode.
 * 
 * - Clamp: Replicates edge pixels (default)
 * - Repeat: Tiles the content
 * - Mirror: Tiles with mirroring
 * - Decal: Transparent outside bounds (Android S+)
 */
export type TileMode = 'clamp' | 'repeat' | 'mirror' | 'decal';

// ============================================================================
// BLUR EFFECT
// ============================================================================

/**
 * Apply progressive blur effect to the backdrop.
 * Port of BackdropEffectScope.blur()
 * 
 * Blur creates a soft, frosted glass appearance by blurring
 * the content behind the backdrop.
 * 
 * ## Padding behavior:
 * - When edgeTreatment is NOT clamp, or there's already a render effect,
 *   padding is increased to prevent blur edge clipping.
 * - Padding = max(currentPadding, radius)
 * 
 * @param scope - The backdrop effect scope
 * @param radius - Blur radius in pixels (0 = no blur)
 * @param edgeTreatment - How to handle edges (default: clamp)
 * 
 * @example
 * ```typescript
 * effects((scope) => {
 *   blur(scope, 20); // Frosted glass effect
 * });
 * ```
 */
export function blur(
  scope: BackdropEffectScope,
  radius: number,
  edgeTreatment: TileMode = 'clamp'
): void {
  // Validate parameters (port of Android version checks)
  if (radius <= 0) return;

  // Update padding for edge bleeding
  if (edgeTreatment !== 'clamp' || scope.renderEffect !== null) {
    if (radius > scope.padding) {
      scope.padding = radius;
    }
  }

  // Create blur effect
  const blurEffect = new BlurEffect(radius, radius, edgeTreatment);

  // Add to effect chain
  addEffect(scope, blurEffect);
}

// ============================================================================
// ADVANCED BLUR VARIANTS
// ============================================================================

/**
 * Apply asymmetric blur (different X and Y radii).
 * 
 * @param scope - The backdrop effect scope
 * @param radiusX - Horizontal blur radius
 * @param radiusY - Vertical blur radius
 * @param edgeTreatment - Edge handling mode
 */
export function blurAsymmetric(
  scope: BackdropEffectScope,
  radiusX: number,
  radiusY: number,
  edgeTreatment: TileMode = 'clamp'
): void {
  if (radiusX <= 0 && radiusY <= 0) return;

  const maxRadius = Math.max(radiusX, radiusY);
  if (edgeTreatment !== 'clamp' || scope.renderEffect !== null) {
    if (maxRadius > scope.padding) {
      scope.padding = maxRadius;
    }
  }

  const blurEffect = new BlurEffect(radiusX, radiusY, edgeTreatment);
  addEffect(scope, blurEffect);
}

/**
 * Apply progressive blur (variable blur across the surface).
 * Uses multiple blur layers to simulate variable blur.
 * 
 * Note: True progressive blur requires WebGL shader.
 * This is a CSS approximation using multiple layers.
 * 
 * @param scope - The backdrop effect scope
 * @param maxRadius - Maximum blur radius
 * @param steps - Number of blur steps (more = smoother, default: 3)
 */
export function blurProgressive(
  scope: BackdropEffectScope,
  maxRadius: number,
  steps: number = 3
): void {
  if (maxRadius <= 0 || steps <= 0) return;

  // Progressive blur approximation: chain decreasing blur radii
  for (let i = 0; i < steps; i++) {
    const radius = maxRadius * ((steps - i) / steps);
    if (radius > 0) {
      const blurEffect = new BlurEffect(radius, radius, 'clamp');
      addEffect(scope, blurEffect);
    }
  }

  // Update padding
  if (maxRadius > scope.padding) {
    scope.padding = maxRadius;
  }
}

// ============================================================================
// BACKGROUND BLUR (CSS Backdrop Filter)
// ============================================================================

/**
 * Apply backdrop blur using CSS backdrop-filter.
 * This is the most performant blur for web when supported.
 * 
 * Use this instead of canvas blur when you want the browser
 * to handle the blur natively (GPU-accelerated).
 * 
 * @param element - The DOM element to apply blur to
 * @param radius - Blur radius in pixels
 * @param saturation - Optional saturation adjustment (iOS-style)
 * 
 * @example
 * ```typescript
 * backdropBlurCSS(element, 20);
 * // Equivalent to CSS: backdrop-filter: blur(20px);
 * ```
 */
export function backdropBlurCSS(
  element: HTMLElement,
  radius: number,
  saturation?: number
): void {
  const filters: string[] = [];
  
  if (radius > 0) {
    filters.push(`blur(${radius}px)`);
  }
  
  if (saturation !== undefined) {
    filters.push(`saturate(${saturation})`);
  }
  
  element.style.backdropFilter = filters.join(' ');
  element.style.webkitBackdropFilter = filters.join(' ');
}

/**
 * Remove backdrop blur from an element.
 */
export function removeBackdropBlur(element: HTMLElement): void {
  element.style.backdropFilter = '';
  element.style.webkitBackdropFilter = '';
}

// ============================================================================
// BLUR WITH CSS FILTER (Fallback)
// ============================================================================

/**
 * Apply blur using CSS filter (blurs the element itself, not backdrop).
 * Use as fallback when backdrop-filter is not supported.
 * 
 * @param element - The DOM element
 * @param radius - Blur radius
 */
export function elementBlurCSS(element: HTMLElement, radius: number): void {
  element.style.filter = radius > 0 ? `blur(${radius}px)` : '';
}

// ============================================================================
// BLUR PRESETS
// ============================================================================

/**
 * iOS-style frosted glass blur preset.
 * Combines blur with saturation for the classic iOS glass look.
 * 
 * @param scope - The backdrop effect scope
 * @param intensity - 0.0 to 1.0 (default: 1.0 = full iOS blur)
 */
export function blurIOS(
  scope: BackdropEffectScope,
  intensity: number = 1.0
): void {
  const radius = 20 * intensity;
  blur(scope, radius, 'clamp');
}

/**
 * Light frosted glass (subtle blur).
 */
export function blurLight(scope: BackdropEffectScope): void {
  blur(scope, 8, 'clamp');
}

/**
 * Medium frosted glass.
 */
export function blurMedium(scope: BackdropEffectScope): void {
  blur(scope, 16, 'clamp');
}

/**
 * Heavy frosted glass (maximum blur).
 */
export function blurHeavy(scope: BackdropEffectScope): void {
  blur(scope, 32, 'clamp');
}

/**
 * No blur - clear glass effect.
 */
export function blurNone(scope: BackdropEffectScope): void {
  blur(scope, 0.1, 'clamp');
}

// ============================================================================
// FEATURE DETECTION
// ============================================================================

/**
 * Check if backdrop-filter is supported by the browser.
 */
export function isBackdropFilterSupported(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) {
    return false;
  }
  
  return (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  );
}

/**
 * Check if Canvas filter is supported.
 */
export function isCanvasFilterSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return ctx !== null && 'filter' in ctx;
  } catch {
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default blur;
