/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.effects.Lens.kt
   Licensed under Apache License, Version 2.0
*/

import { BackdropEffectScope } from '../core/BackdropEffectScope';
import { RuntimeShaderEffect } from './RenderEffect';
import { addEffect } from './RenderEffect';
import { RuntimeShaderCacheImpl } from '../core/RuntimeShaderCache';
import {
  RoundedRectRefractionShaderString,
  RoundedRectRefractionWithDispersionShaderString,
} from '../core/Shaders';
import { ShapeProvider, RoundedRectShape } from '../core/ShapeProvider';

// ============================================================================
// LENS EFFECT (SDF-BASED REFRACTION)
// ============================================================================

/**
 * Apply a lens/refraction effect to the backdrop.
 * Port of BackdropEffectScope.lens()
 * 
 * Creates a realistic glass refraction effect using Signed Distance Fields (SDF).
 * The content behind the glass appears distorted as if viewed through a lens.
 * 
 * ## Supported Shapes:
 * - RoundedRectShape (with per-corner radii)
 * - Other CornerBasedShape implementations
 * - Falls back with error for unsupported shapes
 * 
 * ## Effects:
 * - **Refraction**: Light bending through glass
 * - **Chromatic Aberration**: Color separation at edges (prism effect)
 * - **Depth Effect**: Additional realism with center-weighted distortion
 * 
 * @param scope - The backdrop effect scope
 * @param refractionHeight - Height of the refraction zone from edge (pixels, > 0)
 * @param refractionAmount - Strength of refraction distortion (pixels, > 0)
 * @param options - Additional options
 * @param options.depthEffect - Enable depth-based distortion (default: false)
 * @param options.chromaticAberration - Enable chromatic dispersion (default: false)
 * @param shaderCache - Runtime shader cache (required for WebGL)
 * 
 * @example
 * ```typescript
 * // Simple lens refraction
 * lens(scope, 20, 10, { depthEffect: true }, shaderCache);
 * 
 * // Full glass with chromatic aberration
 * lens(scope, 30, 15, { 
 *   depthEffect: true, 
 *   chromaticAberration: true 
 * }, shaderCache);
 * ```
 */
export function lens(
  scope: BackdropEffectScope,
  refractionHeight: number,
  refractionAmount: number,
  options: {
    depthEffect?: boolean;
    chromaticAberration?: boolean;
  } = {},
  shaderCache?: RuntimeShaderCacheImpl
): void {
  // Validate parameters
  if (refractionHeight <= 0 || refractionAmount <= 0) return;
  if (!shaderCache) {
    console.warn('Lens effect requires WebGL shader cache. Falling back to no effect.');
    return;
  }

  // Adjust padding: reduce padding by refraction height
  // (the refraction effect handles edge bleeding internally)
  if (scope.padding > 0) {
    scope.padding = Math.max(0, scope.padding - refractionHeight);
  }

  // Get corner radii from shape
  const cornerRadii = getCornerRadii(scope);
  
  if (!cornerRadii) {
    throw new Error(
      'Only RoundedRectShape or CornerBasedShape is supported in lens effects.'
    );
  }

  const { depthEffect = false, chromaticAberration = false } = options;

  // Select shader based on options
  const shaderKey = chromaticAberration
    ? 'RefractionWithDispersion'
    : 'Refraction';

  const shaderSource = chromaticAberration
    ? RoundedRectRefractionWithDispersionShaderString
    : RoundedRectRefractionShaderString;

  // Build uniforms
  const uniforms = new Map<string, number | number[]>();

  uniforms.set('size', [scope.size.width, scope.size.height]);
  uniforms.set('offset', [-scope.padding, -scope.padding]);
  uniforms.set('cornerRadii', Array.from(cornerRadii));
  uniforms.set('refractionHeight', refractionHeight);
  uniforms.set('refractionAmount', -refractionAmount); // Negative for inward refraction
  uniforms.set('depthEffect', depthEffect ? 1 : 0);

  if (chromaticAberration) {
    uniforms.set('chromaticAberration', 1);
  }

  // Create runtime shader effect
  const effect = new RuntimeShaderEffect(
    shaderKey,
    shaderSource,
    shaderCache,
    uniforms
  );

  // Add to effect chain
  addEffect(scope, effect);
}

// ============================================================================
// CORNER RADII EXTRACTION
// ============================================================================

/**
 * Extract corner radii from the current shape.
 * Port of BackdropEffectScope.cornerRadii in Lens.kt
 * 
 * Supports:
 * - RoundedRectShape: Direct corner access
 * - AbsoluteRoundedCornerShape: Per-corner with maxRadius clamping
 * - CornerBasedShape: Direction-aware (LTR/RTL swap)
 * 
 * Returns null for unsupported shapes.
 * 
 * @returns Float32Array [topLeft, topRight, bottomRight, bottomLeft] or null
 */
function getCornerRadii(scope: BackdropEffectScope): Float32Array | null {
  const shape = scope.shape;
  const size = scope.size;
  const layoutDirection = scope.layoutDirection;
  const maxRadius = Math.min(size.width, size.height) / 2;

  if (shape instanceof RoundedRectShape) {
    // Direct corner access from RoundedRectShape
    const outline = shape.createOutline(size, layoutDirection, scope);
    if (outline.type === 'Rounded') {
      return clampRadii(outline.radii, maxRadius);
    }
  }

  // For other shapes, try to create outline and extract
  try {
    const outline = shape.createOutline(size, layoutDirection, scope);
    if (outline.type === 'Rounded') {
      return clampRadii(outline.radii, maxRadius);
    }
  } catch {
    // Shape doesn't support corner radii
  }

  return null;
}

/**
 * Clamp each radius to maxRadius.
 */
function clampRadii(radii: Float32Array, maxRadius: number): Float32Array {
  return new Float32Array([
    Math.min(radii[0], maxRadius),
    Math.min(radii[1], maxRadius),
    Math.min(radii[2], maxRadius),
    Math.min(radii[3], maxRadius),
  ]);
}

// ============================================================================
// LENS PRESETS
// ============================================================================

/**
 * Subtle lens effect - barely noticeable distortion.
 */
export function lensSubtle(
  scope: BackdropEffectScope,
  shaderCache?: RuntimeShaderCacheImpl
): void {
  lens(scope, 10, 3, { depthEffect: false }, shaderCache);
}

/**
 * Standard lens effect - noticeable glass distortion.
 */
export function lensStandard(
  scope: BackdropEffectScope,
  shaderCache?: RuntimeShaderCacheImpl
): void {
  lens(scope, 20, 8, { depthEffect: true }, shaderCache);
}

/**
 * Premium lens effect - full glass with chromatic aberration.
 * This is the iOS 26.5 style glass effect.
 */
export function lensPremium(
  scope: BackdropEffectScope,
  shaderCache?: RuntimeShaderCacheImpl
): void {
  lens(
    scope, 
    30, 
    12, 
    { 
      depthEffect: true, 
      chromaticAberration: true 
    }, 
    shaderCache
  );
}

/**
 * Extreme lens effect - heavy distortion for special effects.
 */
export function lensExtreme(
  scope: BackdropEffectScope,
  shaderCache?: RuntimeShaderCacheImpl
): void {
  lens(
    scope, 
    50, 
    25, 
    { 
      depthEffect: true, 
      chromaticAberration: true 
    }, 
    shaderCache
  );
}

// ============================================================================
// CSS FALLBACK LENS
// ============================================================================

/**
 * CSS-only lens approximation using backdrop-filter.
 * Falls back gracefully when WebGL is not available.
 * 
 * Uses a combination of:
 * - blur: softens the background
 * - brightness/contrast: simulates light bending
 * - saturate: enhances colors like real glass
 * 
 * @param element - The DOM element
 * @param intensity - 0.0 to 1.0
 */
export function lensCSS(
  element: HTMLElement,
  intensity: number = 0.5
): void {
  const blurAmount = 10 * intensity;
  const brightness = 1 + 0.1 * intensity;
  const saturation = 1 + 0.3 * intensity;
  const contrast = 1 + 0.1 * intensity;

  const filters = [
    `blur(${blurAmount}px)`,
    `brightness(${brightness})`,
    `saturate(${saturation})`,
    `contrast(${contrast})`,
  ];

  element.style.backdropFilter = filters.join(' ');
  element.style.webkitBackdropFilter = filters.join(' ');
}

// ============================================================================
// LENS BUILDER
// ============================================================================

/**
 * Fluent builder for lens effect configuration.
 * 
 * @example
 * ```typescript
 * new LensBuilder()
 *   .height(30)
 *   .amount(12)
 *   .withDepth()
 *   .withChromaticAberration()
 *   .apply(scope, shaderCache);
 * ```
 */
export class LensBuilder {
  private _height: number = 20;
  private _amount: number = 8;
  private _depthEffect: boolean = false;
  private _chromaticAberration: boolean = false;

  height(value: number): this {
    this._height = value;
    return this;
  }

  amount(value: number): this {
    this._amount = value;
    return this;
  }

  withDepth(): this {
    this._depthEffect = true;
    return this;
  }

  withoutDepth(): this {
    this._depthEffect = false;
    return this;
  }

  withChromaticAberration(): this {
    this._chromaticAberration = true;
    return this;
  }

  withoutChromaticAberration(): this {
    this._chromaticAberration = false;
    return this;
  }

  /**
   * Apply the lens effect to a scope.
   */
  apply(
    scope: BackdropEffectScope,
    shaderCache?: RuntimeShaderCacheImpl
  ): void {
    lens(scope, this._height, this._amount, {
      depthEffect: this._depthEffect,
      chromaticAberration: this._chromaticAberration,
    }, shaderCache);
  }

  /**
   * Get preset configurations.
   */
  static presets = {
    subtle: () => new LensBuilder().height(10).amount(3),
    standard: () => new LensBuilder().height(20).amount(8).withDepth(),
    premium: () => new LensBuilder().height(30).amount(12).withDepth().withChromaticAberration(),
    extreme: () => new LensBuilder().height(50).amount(25).withDepth().withChromaticAberration(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default lens;
