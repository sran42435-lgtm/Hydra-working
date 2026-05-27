/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.shadow.Shadow.kt
   Licensed under Apache License, Version 2.0
*/

import { BlendMode } from '../core/Backdrop';

// ============================================================================
// SHADOW DATA CLASS
// ============================================================================

/**
 * Configuration for drop shadow effect.
 * Port of Shadow data class.
 * 
 * Creates a soft shadow behind the glass surface,
 * giving it depth and separation from the background.
 * 
 * The shadow uses a mask-based technique:
 * 1. Draw blurred shape at offset position
 * 2. Erase the center using Clear blend mode
 * 3. Result: shadow only appears outside the shape
 */
export class Shadow {
  /** Blur radius for shadow softness */
  readonly radius: number;

  /** Shadow offset from the element */
  readonly offsetX: number;
  readonly offsetY: number;

  /** Shadow color (typically dark with alpha) */
  readonly color: string;

  /** Overall shadow opacity (0.0 to 1.0) */
  readonly alpha: number;

  /** Blend mode for compositing */
  readonly blendMode: BlendMode;

  /**
   * @param radius - Blur radius in pixels (default: 24)
   * @param offsetX - Horizontal offset (default: 0)
   * @param offsetY - Vertical offset (default: radius / 6)
   * @param color - CSS color string (default: black with 10% alpha)
   * @param alpha - Opacity 0-1 (default: 1.0)
   * @param blendMode - Blend mode (default: SrcOver)
   */
  constructor(
    radius: number = 24,
    offsetX: number = 0,
    offsetY?: number,
    color: string = 'rgba(0, 0, 0, 0.1)',
    alpha: number = 1.0,
    blendMode: BlendMode = BlendMode.SrcOver
  ) {
    this.radius = Math.max(0, radius);
    this.offsetX = offsetX;
    this.offsetY = offsetY ?? this.radius / 6;
    this.color = color;
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.blendMode = blendMode;
  }

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  /**
   * Default shadow preset.
   * Soft, subtle shadow that works for most glass surfaces.
   */
  static readonly Default: Shadow = new Shadow(
    24, 0, undefined, 'rgba(0, 0, 0, 0.1)', 1.0, BlendMode.SrcOver
  );

  /**
   * Elevated shadow - for raised/floating glass.
   * Larger radius and more offset for "floating" appearance.
   */
  static readonly Elevated: Shadow = new Shadow(
    40, 0, 10, 'rgba(0, 0, 0, 0.15)', 1.0, BlendMode.SrcOver
  );

  /**
   * Close shadow - for glass close to the surface.
   * Small radius, minimal offset.
   */
  static readonly Close: Shadow = new Shadow(
    8, 0, 2, 'rgba(0, 0, 0, 0.08)', 1.0, BlendMode.SrcOver
  );

  /**
   * Dark shadow - for dramatic depth.
   */
  static readonly Dark: Shadow = new Shadow(
    32, 0, 8, 'rgba(0, 0, 0, 0.25)', 1.0, BlendMode.SrcOver
  );

  /**
   * Light shadow - barely visible depth.
   */
  static readonly Light: Shadow = new Shadow(
    12, 0, 3, 'rgba(0, 0, 0, 0.05)', 1.0, BlendMode.SrcOver
  );

  /**
   * iOS-style shadow - crisp and elevated.
   */
  static readonly iOS: Shadow = new Shadow(
    30, 0, 10, 'rgba(0, 0, 0, 0.12)', 1.0, BlendMode.SrcOver
  );

  /**
   * No shadow.
   */
  static readonly None: Shadow | null = null;
}

// ============================================================================
// SHADOW BUILDER
// ============================================================================

/**
 * Fluent builder for Shadow configuration.
 * 
 * @example
 * ```typescript
 * const shadow = new ShadowBuilder()
 *   .radius(30)
 *   .offset(0, 10)
 *   .color('rgba(0, 0, 0, 0.15)')
 *   .alpha(0.8)
 *   .build();
 * ```
 */
export class ShadowBuilder {
  private _radius: number = 24;
  private _offsetX: number = 0;
  private _offsetY?: number;
  private _color: string = 'rgba(0, 0, 0, 0.1)';
  private _alpha: number = 1.0;
  private _blendMode: BlendMode = BlendMode.SrcOver;

  radius(value: number): this {
    this._radius = value;
    if (this._offsetY === undefined) {
      this._offsetY = value / 6;
    }
    return this;
  }

  offset(x: number, y: number): this {
    this._offsetX = x;
    this._offsetY = y;
    return this;
  }

  offsetX(value: number): this {
    this._offsetX = value;
    return this;
  }

  offsetY(value: number): this {
    this._offsetY = value;
    return this;
  }

  color(value: string): this {
    this._color = value;
    return this;
  }

  alpha(value: number): this {
    this._alpha = value;
    return this;
  }

  blendMode(value: BlendMode): this {
    this._blendMode = value;
    return this;
  }

  build(): Shadow {
    return new Shadow(
      this._radius,
      this._offsetX,
      this._offsetY,
      this._color,
      this._alpha,
      this._blendMode
    );
  }

  /**
   * Get preset configurations.
   */
  static presets = {
    default: () => new ShadowBuilder(),
    elevated: () => new ShadowBuilder().radius(40).offset(0, 10).color('rgba(0, 0, 0, 0.15)'),
    close: () => new ShadowBuilder().radius(8).offset(0, 2).color('rgba(0, 0, 0, 0.08)'),
    dark: () => new ShadowBuilder().radius(32).offset(0, 8).color('rgba(0, 0, 0, 0.25)'),
    light: () => new ShadowBuilder().radius(12).offset(0, 3).color('rgba(0, 0, 0, 0.05)'),
    ios: () => new ShadowBuilder().radius(30).offset(0, 10).color('rgba(0, 0, 0, 0.12)'),
  };
}

// ============================================================================
// SHADOW UTILITIES
// ============================================================================

/**
 * Create a shadow with custom parameters.
 * Shorthand factory function.
 */
export function createShadow(
  radius: number = 24,
  offsetX: number = 0,
  offsetY?: number,
  color: string = 'rgba(0, 0, 0, 0.1)',
  alpha: number = 1.0
): Shadow {
  return new Shadow(radius, offsetX, offsetY, color, alpha);
}

/**
 * Check if a shadow is effectively visible.
 */
export function isShadowVisible(shadow: Shadow | null): boolean {
  if (!shadow) return false;
  return shadow.radius > 0 && shadow.alpha > 0;
}

/**
 * Calculate the required padding for shadow rendering.
 * Shadow needs extra space to prevent clipping.
 * Formula: radius * 4 + |offset|
 */
export function getShadowPadding(shadow: Shadow): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const spread = shadow.radius * 4;
  const absOffsetX = Math.abs(shadow.offsetX);
  const absOffsetY = Math.abs(shadow.offsetY);

  return {
    top: spread + (shadow.offsetY < 0 ? absOffsetY : 0),
    right: spread + (shadow.offsetX > 0 ? absOffsetX : 0),
    bottom: spread + (shadow.offsetY > 0 ? absOffsetY : 0),
    left: spread + (shadow.offsetX < 0 ? absOffsetX : 0),
  };
}

/**
 * Lerp between two shadows (for animations).
 */
export function lerpShadow(
  start: Shadow,
  end: Shadow,
  fraction: number
): Shadow {
  const t = Math.max(0, Math.min(1, fraction));

  return new Shadow(
    start.radius + (end.radius - start.radius) * t,
    start.offsetX + (end.offsetX - start.offsetX) * t,
    start.offsetY + (end.offsetY - start.offsetY) * t,
    lerpColor(start.color, end.color, t),
    start.alpha + (end.alpha - start.alpha) * t,
    t < 0.5 ? start.blendMode : end.blendMode,
  );
}

/**
 * Simple color lerp for CSS color strings.
 * Note: Full implementation would parse RGBA components.
 */
function lerpColor(start: string, end: string, t: number): string {
  // Simplified: just return start or end based on threshold
  return t < 0.5 ? start : end;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Shadow;
