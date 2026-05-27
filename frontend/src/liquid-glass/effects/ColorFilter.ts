/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.effects.ColorFilter.kt
   Licensed under Apache License, Version 2.0
*/

import { BackdropEffectScope, RuntimeShaderRenderEffect } from '../core/BackdropEffectScope';
import { ColorFilterEffect, RuntimeShaderEffect } from './RenderEffect';
import { addEffect } from './RenderEffect';
import { RuntimeShaderCacheImpl } from '../core/RuntimeShaderCache';
import { GammaAdjustmentShaderString } from '../core/Shaders';

// ============================================================================
// COLOR FILTER EFFECTS
// ============================================================================

/**
 * Apply a color filter using a CSS filter string.
 * Port of BackdropEffectScope.colorFilter(ColorFilter).
 * 
 * @param scope - The backdrop effect scope
 * @param cssFilter - CSS filter string (e.g., 'brightness(1.5) contrast(1.2)')
 * 
 * @example
 * ```typescript
 * colorFilter(scope, 'grayscale(100%)');
 * colorFilter(scope, 'sepia(50%) hue-rotate(90deg)');
 * ```
 */
export function colorFilter(
  scope: BackdropEffectScope,
  cssFilter: string
): void {
  if (!cssFilter) return;

  const effect = new ColorFilterEffect(cssFilter);
  addEffect(scope, effect);
}

// ============================================================================
// OPACITY
// ============================================================================

/**
 * Adjust opacity of the backdrop.
 * Port of BackdropEffectScope.opacity().
 * 
 * Uses color matrix to multiply alpha channel.
 * 
 * @param scope - The backdrop effect scope
 * @param alpha - Opacity value (0.0 to 1.0)
 * 
 * @example
 * ```typescript
 * opacity(scope, 0.5); // 50% opacity
 * ```
 */
export function opacity(
  scope: BackdropEffectScope,
  alpha: number
): void {
  // Clamp alpha to 0-1
  alpha = Math.max(0, Math.min(1, alpha));

  // Color matrix for opacity:
  // | 1 0 0 0 0 |
  // | 0 1 0 0 0 |
  // | 0 0 1 0 0 |
  // | 0 0 0 a 0 |
  const matrix = [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, alpha, 0,
  ];

  colorFilter(scope, `opacity(${alpha})`);
}

// ============================================================================
// COLOR CONTROLS (Brightness, Contrast, Saturation)
// ============================================================================

/**
 * Adjust brightness, contrast, and saturation of the backdrop.
 * Port of BackdropEffectScope.colorControls().
 * 
 * Uses the standard color matrix formula:
 * - cr = contrast × 0.213 × (1 - saturation)
 * - cg = contrast × 0.715 × (1 - saturation)  
 * - cb = contrast × 0.072 × (1 - saturation)
 * - cs = contrast × saturation
 * - t = (0.5 - contrast × 0.5 + brightness) × 255
 * 
 * @param scope - The backdrop effect scope
 * @param brightness - Brightness adjustment (-1 to 1, default: 0)
 * @param contrast - Contrast multiplier (default: 1)
 * @param saturation - Saturation multiplier (default: 1)
 * 
 * @example
 * ```typescript
 * colorControls(scope, 0.1, 1.2, 1.5); // Brighter, more contrast, more saturation
 * ```
 */
export function colorControls(
  scope: BackdropEffectScope,
  brightness: number = 0,
  contrast: number = 1,
  saturation: number = 1
): void {
  // No-op if values are at defaults
  if (brightness === 0 && contrast === 1 && saturation === 1) return;

  // Build CSS filter string for better browser performance
  const filters: string[] = [];

  if (brightness !== 0) {
    // CSS brightness is 0-∞, where 1 is normal
    // Our brightness is -1 to 1 offset from normal
    filters.push(`brightness(${1 + brightness})`);
  }

  if (contrast !== 1) {
    filters.push(`contrast(${contrast})`);
  }

  if (saturation !== 1) {
    filters.push(`saturate(${saturation})`);
  }

  colorFilter(scope, filters.join(' '));
}

/**
 * Calculate the color controls matrix manually (for WebGL usage).
 * Port of colorControlsColorFilter().
 * 
 * @returns 4x5 color matrix as array
 */
export function colorControlsMatrix(
  brightness: number = 0,
  contrast: number = 1,
  saturation: number = 1
): number[] {
  const invSat = 1 - saturation;
  const r = 0.213 * invSat;
  const g = 0.715 * invSat;
  const b = 0.072 * invSat;

  const c = contrast;
  const t = (0.5 - c * 0.5 + brightness) * 255;
  const s = saturation;

  const cr = c * r;
  const cg = c * g;
  const cb = c * b;
  const cs = c * s;

  // 4x5 matrix (20 values)
  return [
    cr + cs, cg,     cb,     0, t,
    cr,      cg + cs, cb,    0, t,
    cr,      cg,      cb + cs, 0, t,
    0,       0,       0,      1, 0,
  ];
}

// ============================================================================
// VIBRANCY
// ============================================================================

/**
 * Apply vibrancy effect (increased saturation).
 * Port of BackdropEffectScope.vibrancy().
 * 
 * This is a preset that boosts saturation by 1.5x,
 * similar to iOS vibrancy effect.
 * 
 * @param scope - The backdrop effect scope
 */
export function vibrancy(scope: BackdropEffectScope): void {
  colorControls(scope, 0, 1, 1.5);
}

// ============================================================================
// EXPOSURE ADJUSTMENT
// ============================================================================

/**
 * Adjust exposure (EV stops).
 * Port of BackdropEffectScope.exposureAdjustment().
 * 
 * Each +1 EV doubles the brightness.
 * Scale = 2^(ev / 2.2) to account for gamma.
 * 
 * @param scope - The backdrop effect scope
 * @param ev - Exposure value in stops (e.g., +1 = double brightness)
 * 
 * @example
 * ```typescript
 * exposureAdjustment(scope, 1);  // +1 EV (brighter)
 * exposureAdjustment(scope, -1); // -1 EV (darker)
 * ```
 */
export function exposureAdjustment(
  scope: BackdropEffectScope,
  ev: number
): void {
  // Scale = 2^(ev / 2.2)
  const scale = Math.pow(2, ev / 2.2);

  // Use brightness for simple exposure
  colorFilter(scope, `brightness(${scale})`);
}

// ============================================================================
// GAMMA ADJUSTMENT
// ============================================================================

/**
 * Apply gamma adjustment using a runtime shader.
 * Port of BackdropEffectScope.gammaAdjustment().
 * 
 * Gamma adjustment modifies the luminance curve:
 * - gamma > 1: darker midtones, brighter highlights
 * - gamma < 1: brighter midtones, darker shadows
 * - gamma = 1: no change
 * 
 * Uses the GammaAdjustment shader from Shaders.ts.
 * 
 * @param scope - The backdrop effect scope
 * @param power - Gamma power value (default: 1.0 = no change)
 * @param shaderCache - Runtime shader cache for WebGL context
 * 
 * @example
 * ```typescript
 * gammaAdjustment(scope, 2.2); // sRGB to linear
 * gammaAdjustment(scope, 1/2.2); // linear to sRGB
 * ```
 */
export function gammaAdjustment(
  scope: BackdropEffectScope,
  power: number,
  shaderCache?: RuntimeShaderCacheImpl
): void {
  if (!shaderCache) {
    // Fallback: use CSS brightness as approximation
    // gamma 2.2 ≈ brightness adjustment
    const brightness = Math.pow(0.5, power - 1);
    colorFilter(scope, `brightness(${brightness})`);
    return;
  }

  // Use runtime shader for accurate gamma
  const uniforms = new Map<string, number | number[]>();
  uniforms.set('power', power);

  const effect = new RuntimeShaderEffect(
    'GammaAdjustment',
    GammaAdjustmentShaderString,
    shaderCache,
    uniforms
  );

  addEffect(scope, effect);
}

// ============================================================================
// GRAYSCALE & SEPIA
// ============================================================================

/**
 * Convert backdrop to grayscale.
 * 
 * @param scope - The backdrop effect scope
 * @param amount - 0 = color, 1 = fully grayscale
 */
export function grayscale(
  scope: BackdropEffectScope,
  amount: number = 1
): void {
  colorFilter(scope, `grayscale(${amount})`);
}

/**
 * Apply sepia tone effect.
 * 
 * @param scope - The backdrop effect scope
 * @param amount - 0 = none, 1 = full sepia
 */
export function sepia(
  scope: BackdropEffectScope,
  amount: number = 1
): void {
  colorFilter(scope, `sepia(${amount})`);
}

/**
 * Rotate hues.
 * 
 * @param scope - The backdrop effect scope
 * @param degrees - Rotation in degrees
 */
export function hueRotate(
  scope: BackdropEffectScope,
  degrees: number
): void {
  colorFilter(scope, `hue-rotate(${degrees}deg)`);
}

/**
 * Invert colors.
 * 
 * @param scope - The backdrop effect scope
 * @param amount - 0 = none, 1 = fully inverted
 */
export function invert(
  scope: BackdropEffectScope,
  amount: number = 1
): void {
  colorFilter(scope, `invert(${amount})`);
}

// ============================================================================
// COLOR FILTER PRESETS
// ============================================================================

/**
 * iOS-style vibrant backdrop preset.
 * Combines blur and vibrancy for classic iOS glass look.
 */
export function colorFilterIOS(scope: BackdropEffectScope): void {
  vibrancy(scope);
  colorControls(scope, 0.05, 1.1, 1.3);
}

/**
 * Dark mode tint.
 */
export function darkTint(scope: BackdropEffectScope): void {
  colorControls(scope, -0.2, 0.9, 0.8);
}

/**
 * Light mode tint.
 */
export function lightTint(scope: BackdropEffectScope): void {
  colorControls(scope, 0.1, 1.0, 0.9);
}

/**
 * Monochrome glass effect.
 */
export function monochromeGlass(scope: BackdropEffectScope): void {
  grayscale(scope, 0.8);
  colorControls(scope, 0, 1.2, 0);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default colorFilter;
