/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.shadow.InnerShadow.kt
   Licensed under Apache License, Version 2.0
*/

import { BlendMode } from '../core/Backdrop';

// ============================================================================
// INNER SHADOW DATA CLASS
// ============================================================================

/**
 * Configuration for inner shadow effect.
 * Port of InnerShadow data class.
 * 
 * Inner shadow creates depth inside the glass surface,
 * making it appear recessed or concave.
 * 
 * Unlike drop shadow which appears outside the shape,
 * inner shadow is clipped to the inside of the shape.
 * 
 * ## Rendering technique:
 * 1. Clip to shape outline
 * 2. Draw shape with shadow color
 * 3. Translate by offset
 * 4. Erase shape using Clear blend mode (leaves shadow on opposite side)
 * 5. Apply BlurEffect to the layer
 */
export class InnerShadow {
  /** Blur radius for shadow softness */
  readonly radius: number;

  /** Shadow offset direction inside the element */
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
   * @param offsetY - Vertical offset (default: radius)
   * @param color - CSS color string (default: black with 15% alpha)
   * @param alpha - Opacity 0-1 (default: 1.0)
   * @param blendMode - Blend mode (default: SrcOver)
   */
  constructor(
    radius: number = 24,
    offsetX: number = 0,
    offsetY?: number,
    color: string = 'rgba(0, 0, 0, 0.15)',
    alpha: number = 1.0,
    blendMode: BlendMode = BlendMode.SrcOver
  ) {
    this.radius = Math.max(0, radius);
    this.offsetX = offsetX;
    this.offsetY = offsetY ?? this.radius;
    this.color = color;
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.blendMode = blendMode;
  }

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  /**
   * Default inner shadow preset.
   * Subtle depth effect for glass surfaces.
   */
  static readonly Default: InnerShadow = new InnerShadow(
    24, 0, undefined, 'rgba(0, 0, 0, 0.15)', 1.0, BlendMode.SrcOver
  );

  /**
   * Deep inner shadow - strong recessed effect.
   */
  static readonly Deep: InnerShadow = new InnerShadow(
    40, 0, 40, 'rgba(0, 0, 0, 0.25)', 1.0, BlendMode.SrcOver
  );

  /**
   * Subtle inner shadow - light depth.
   */
  static readonly Subtle: InnerShadow = new InnerShadow(
    8, 0, 8, 'rgba(0, 0, 0, 0.08)', 1.0, BlendMode.SrcOver
  );

  /**
   * Top inner shadow - light from above.
   */
  static readonly Top: InnerShadow = new InnerShadow(
    20, 0, 20, 'rgba(0, 0, 0, 0.12)', 1.0, BlendMode.SrcOver
  );

  /**
   * Bottom inner shadow - light from below.
   */
  static readonly Bottom: InnerShadow = new InnerShadow(
    20, 0, -20, 'rgba(255, 255, 255, 0.1)', 1.0, BlendMode.Plus
  );

  /**
   * iOS-style inner shadow.
   */
  static readonly iOS: InnerShadow = new InnerShadow(
    30, 0, 30, 'rgba(0, 0, 0, 0.12)', 1.0, BlendMode.SrcOver
  );

  /**
   * No inner shadow.
   */
  static readonly None: InnerShadow | null = null;
}

// ============================================================================
// INNER SHADOW BUILDER
// ============================================================================

/**
 * Fluent builder for InnerShadow configuration.
 * 
 * @example
 * ```typescript
 * const innerShadow = new InnerShadowBuilder()
 *   .radius(30)
 *   .offset(0, 20)
 *   .color('rgba(0, 0, 0, 0.15)')
 *   .alpha(0.8)
 *   .build();
 * ```
 */
export class InnerShadowBuilder {
  private _radius: number = 24;
  private _offsetX: number = 0;
  private _offsetY?: number;
  private _color: string = 'rgba(0, 0, 0, 0.15)';
  private _alpha: number = 1.0;
  private _blendMode: BlendMode = BlendMode.SrcOver;

  radius(value: number): this {
    this._radius = value;
    if (this._offsetY === undefined) {
      this._offsetY = value;
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

  /**
   * Set shadow direction from light source angle.
   * 0° = from right, 90° = from bottom, etc.
   */
  direction(angleDegrees: number, distance: number = 24): this {
    const radians = (angleDegrees * Math.PI) / 180;
    this._offsetX = -Math.cos(radians) * distance;
    this._offsetY = Math.sin(radians) * distance;
    return this;
  }

  build(): InnerShadow {
    return new InnerShadow(
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
    default: () => new InnerShadowBuilder(),
    deep: () => new InnerShadowBuilder().radius(40).offset(0, 40).color('rgba(0, 0, 0, 0.25)'),
    subtle: () => new InnerShadowBuilder().radius(8).offset(0, 8).color('rgba(0, 0, 0, 0.08)'),
    top: () => new InnerShadowBuilder().radius(20).offset(0, 20).color('rgba(0, 0, 0, 0.12)'),
    ios: () => new InnerShadowBuilder().radius(30).offset(0, 30).color('rgba(0, 0, 0, 0.12)'),
  };
}

// ============================================================================
// INNER SHADOW UTILITIES
// ============================================================================

/**
 * Create an inner shadow with custom parameters.
 * Shorthand factory function.
 */
export function createInnerShadow(
  radius: number = 24,
  offsetX: number = 0,
  offsetY?: number,
  color: string = 'rgba(0, 0, 0, 0.15)',
  alpha: number = 1.0
): InnerShadow {
  return new InnerShadow(radius, offsetX, offsetY, color, alpha);
}

/**
 * Check if an inner shadow is effectively visible.
 */
export function isInnerShadowVisible(shadow: InnerShadow | null): boolean {
  if (!shadow) return false;
  return shadow.radius > 0 && shadow.alpha > 0;
}

/**
 * Calculate required extra space for inner shadow rendering.
 * Inner shadows don't typically need extra padding since
 * they're clipped to the inside of the shape.
 */
export function getInnerShadowPadding(shadow: InnerShadow): number {
  // Inner shadow is clipped inside, but blur may need some extra space
  return Math.ceil(shadow.radius * 0.5);
}

/**
 * Lerp between two inner shadows (for animations).
 * Port of lerp() function in InnerShadow.kt
 */
export function lerpInnerShadow(
  start: InnerShadow,
  end: InnerShadow,
  fraction: number
): InnerShadow {
  const t = Math.max(0, Math.min(1, fraction));

  return new InnerShadow(
    start.radius + (end.radius - start.radius) * t,
    start.offsetX + (end.offsetX - start.offsetX) * t,
    start.offsetY + (end.offsetY - start.offsetY) * t,
    lerpColor(start.color, end.color, t),
    start.alpha + (end.alpha - start.alpha) * t,
    t < 0.5 ? start.blendMode : end.blendMode,
  );
}

/**
 * Simple color lerp.
 */
function lerpColor(start: string, end: string, t: number): string {
  return t < 0.5 ? start : end;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default InnerShadow;
