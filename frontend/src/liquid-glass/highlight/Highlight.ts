/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.highlight.Highlight.kt
   Licensed under Apache License, Version 2.0
*/

import { BlendMode } from '../core/Backdrop';
import { HighlightStyle, HighlightStylePlain, HighlightStyleDefault, HighlightStyleAmbient } from './HighlightStyle';

// ============================================================================
// HIGHLIGHT DATA CLASS
// ============================================================================

/**
 * Configuration for the glass highlight effect.
 * Port of Highlight data class.
 * 
 * The highlight creates a glossy, light-reflecting edge effect
 * that makes glass surfaces look realistic and premium.
 * 
 * It simulates light hitting the edges of the glass surface,
 * creating bright spots that move with the viewing angle.
 */
export class Highlight {
  /** Width of the highlight stroke in pixels */
  readonly width: number;

  /** Blur radius for softening the highlight edges */
  readonly blurRadius: number;

  /** Overall highlight opacity (0.0 to 1.0) */
  readonly alpha: number;

  /** Style that determines how the highlight is rendered */
  readonly style: HighlightStyle;

  /**
   * @param width - Stroke width in pixels (default: 0.5)
   * @param blurRadius - Blur radius (default: width / 2)
   * @param alpha - Opacity 0-1 (default: 1.0)
   * @param style - Highlight style (default: Default)
   */
  constructor(
    width: number = 0.5,
    blurRadius?: number,
    alpha: number = 1.0,
    style: HighlightStyle = HighlightStyle.default
  ) {
    this.width = Math.max(0, width);
    this.blurRadius = blurRadius ?? this.width / 2;
    this.alpha = Math.max(0, Math.min(1, alpha));
    this.style = style;
  }

  // ==========================================================================
  // PRESETS
  // ==========================================================================

  /**
   * Default highlight preset.
   * Subtle white edge glow - suitable for most glass surfaces.
   */
  static readonly Default: Highlight = new Highlight(
    0.5,
    undefined,
    1.0,
    HighlightStyle.default
  );

  /**
   * Ambient highlight preset.
   * Creates an ambient occlusion-style edge effect.
   * No color - uses the style's built-in ambient shader.
   */
  static readonly Ambient: Highlight = new Highlight(
    0.5,
    undefined,
    1.0,
    HighlightStyle.ambient
  );

  /**
   * Plain highlight preset.
   * Simple solid stroke without shader effects.
   * Best performance, subtle appearance.
   */
  static readonly Plain: Highlight = new Highlight(
    0.5,
    undefined,
    1.0,
    HighlightStyle.plain
  );

  /**
   * Strong highlight for prominent glass.
   */
  static readonly Strong: Highlight = new Highlight(
    2.0,
    1.0,
    0.8,
    HighlightStyle.default
  );

  /**
   * Subtle highlight for minimal glass.
   */
  static readonly Subtle: Highlight = new Highlight(
    0.3,
    0.15,
    0.5,
    HighlightStyle.plain
  );

  /**
   * iOS-style highlight.
   * Crisp edge with moderate glow - mimics iOS glass aesthetic.
   */
  static readonly iOS: Highlight = new Highlight(
    1.0,
    0.5,
    0.7,
    HighlightStyle.default
  );

  /**
   * No highlight.
   */
  static readonly None: Highlight | null = null;
}

// ============================================================================
// HIGHLIGHT BUILDER
// ============================================================================

/**
 * Fluent builder for Highlight configuration.
 * 
 * @example
 * ```typescript
 * const highlight = new HighlightBuilder()
 *   .width(2)
 *   .blur(1)
 *   .alpha(0.8)
 *   .style('default')
 *   .build();
 * ```
 */
export class HighlightBuilder {
  private _width: number = 0.5;
  private _blurRadius?: number;
  private _alpha: number = 1.0;
  private _style: HighlightStyle = HighlightStyle.default;

  width(value: number): this {
    this._width = value;
    return this;
  }

  blur(value: number): this {
    this._blurRadius = value;
    return this;
  }

  alpha(value: number): this {
    this._alpha = value;
    return this;
  }

  style(value: HighlightStyle | 'default' | 'ambient' | 'plain'): this {
    if (typeof value === 'string') {
      switch (value) {
        case 'default':
          this._style = HighlightStyle.default;
          break;
        case 'ambient':
          this._style = HighlightStyle.ambient;
          break;
        case 'plain':
          this._style = HighlightStyle.plain;
          break;
      }
    } else {
      this._style = value;
    }
    return this;
  }

  /**
   * Use default highlight style with custom angle and falloff.
   */
  styleDefault(angle: number = 45, falloff: number = 1): this {
    this._style = new HighlightStyleDefault(angle, falloff);
    return this;
  }

  /**
   * Use plain highlight style with custom color and blend mode.
   */
  stylePlain(
    color: string = 'rgba(255, 255, 255, 0.38)',
    blendMode: BlendMode = BlendMode.Plus
  ): this {
    this._style = new HighlightStylePlain(color, blendMode);
    return this;
  }

  /**
   * Use ambient highlight style.
   */
  styleAmbient(intensity: number = 0.38): this {
    this._style = new HighlightStyleAmbient(intensity);
    return this;
  }

  build(): Highlight {
    return new Highlight(
      this._width,
      this._blurRadius,
      this._alpha,
      this._style
    );
  }

  /**
   * Get preset configurations.
   */
  static presets = {
    default: () => new HighlightBuilder().width(0.5).alpha(1.0).styleDefault(45, 1),
    ambient: () => new HighlightBuilder().width(0.5).alpha(1.0).styleAmbient(0.38),
    plain: () => new HighlightBuilder().width(0.5).alpha(1.0).stylePlain(),
    ios: () => new HighlightBuilder().width(1.0).blur(0.5).alpha(0.7).styleDefault(45, 1),
    strong: () => new HighlightBuilder().width(2.0).blur(1.0).alpha(0.8).styleDefault(45, 1),
    subtle: () => new HighlightBuilder().width(0.3).blur(0.15).alpha(0.5).stylePlain(),
  };
}

// ============================================================================
// HIGHLIGHT UTILITIES
// ============================================================================

/**
 * Create a highlight with custom parameters.
 * Shorthand factory function.
 */
export function createHighlight(
  width: number = 0.5,
  blurRadius?: number,
  alpha: number = 1.0,
  style?: HighlightStyle
): Highlight {
  return new Highlight(width, blurRadius, alpha, style);
}

/**
 * Check if a highlight is effectively visible.
 */
export function isHighlightVisible(highlight: Highlight | null): boolean {
  if (!highlight) return false;
  return highlight.width > 0 && highlight.alpha > 0;
}

/**
 * Lerp between two highlights (for animations).
 */
export function lerpHighlight(
  start: Highlight,
  end: Highlight,
  fraction: number
): Highlight {
  const t = Math.max(0, Math.min(1, fraction));
  
  return new Highlight(
    start.width + (end.width - start.width) * t,
    start.blurRadius + (end.blurRadius - start.blurRadius) * t,
    start.alpha + (end.alpha - start.alpha) * t,
    t < 0.5 ? start.style : end.style, // Style snaps at midpoint
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Highlight;
