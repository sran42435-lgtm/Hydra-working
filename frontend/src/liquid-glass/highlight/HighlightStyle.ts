/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.highlight.HighlightStyle.kt
   Licensed under Apache License, Version 2.0
*/

import { BlendMode, DrawScope, Shape } from '../core/Backdrop';
import { RuntimeShaderCache, WebGLRuntimeShader } from '../core/RuntimeShaderCache';
import { DefaultHighlightShaderString, AmbientHighlightShaderString } from '../core/Shaders';

// ============================================================================
// HIGHLIGHT STYLE INTERFACE
// ============================================================================

/**
 * Interface for highlight rendering styles.
 * Port of HighlightStyle sealed interface.
 * 
 * Each style determines:
 * - The color of the highlight
 * - How it blends with the content (blend mode)
 * - Whether to use a shader for advanced effects
 */
export interface HighlightStyle {
  /** Base color of the highlight */
  readonly color: string;

  /** Blend mode for compositing */
  readonly blendMode: BlendMode;

  /**
   * Create a shader for this highlight style.
   * Returns null if no shader is needed (plain rendering).
   * 
   * @param shape - Current shape for corner radii extraction
   * @param cache - Shader cache for compilation
   * @param scope - Current draw scope
   * @returns Compiled shader or null
   */
  createShader(
    shape: Shape,
    cache: RuntimeShaderCache,
    scope: DrawScope
  ): WebGLRuntimeShader | null;

  /**
   * Get the CSS color string for Canvas 2D fallback.
   */
  toCSSColor(): string;
}

// ============================================================================
// PLAIN HIGHLIGHT STYLE
// ============================================================================

/**
 * Plain highlight style - solid color stroke without shader effects.
 * Port of HighlightStyle.Plain
 * 
 * Best performance, simplest appearance.
 * Uses a semi-transparent white with additive blending.
 */
export class HighlightStylePlain implements HighlightStyle {
  readonly color: string;
  readonly blendMode: BlendMode;

  /**
   * @param color - CSS color string (default: semi-transparent white)
   * @param blendMode - Blend mode (default: Plus/additive)
   */
  constructor(
    color: string = 'rgba(255, 255, 255, 0.38)',
    blendMode: BlendMode = BlendMode.Plus
  ) {
    this.color = color;
    this.blendMode = blendMode;
  }

  createShader(
    _shape: Shape,
    _cache: RuntimeShaderCache,
    _scope: DrawScope
  ): null {
    // Plain style doesn't use shaders
    return null;
  }

  toCSSColor(): string {
    return this.color;
  }
}

// ============================================================================
// DEFAULT HIGHLIGHT STYLE
// ============================================================================

/**
 * Default highlight style using SDF-based shader.
 * Port of HighlightStyle.Default
 * 
 * Creates a realistic light reflection on glass edges using:
 * - Signed distance field gradient for edge detection
 * - Angle-based light direction
 * - Configurable falloff for softness
 * 
 * Uses DefaultHighlightShaderString from Shaders.ts
 */
export class HighlightStyleDefault implements HighlightStyle {
  readonly color: string;
  readonly blendMode: BlendMode;
  readonly angle: number; // degrees
  readonly falloff: number;

  /**
   * @param color - CSS color string (default: white with 0.5 alpha)
   * @param blendMode - Blend mode (default: Plus/additive)
   * @param angle - Light angle in degrees (default: 45)
   * @param falloff - Softness of the highlight edge (default: 1.0)
   */
  constructor(
    color: string = 'rgba(255, 255, 255, 0.5)',
    blendMode: BlendMode = BlendMode.Plus,
    angle: number = 45,
    falloff: number = 1.0
  ) {
    this.color = color;
    this.blendMode = blendMode;
    this.angle = angle;
    this.falloff = Math.max(0, falloff);
  }

  /**
   * Create a Default style with intensity-based alpha.
   * @deprecated Use constructor with color parameter instead.
   */
  static withIntensity(
    intensity: number,
    angle: number = 45,
    falloff: number = 1.0
  ): HighlightStyleDefault {
    return new HighlightStyleDefault(
      `rgba(255, 255, 255, ${intensity})`,
      BlendMode.Plus,
      angle,
      falloff
    );
  }

  createShader(
    shape: Shape,
    cache: RuntimeShaderCache,
    scope: DrawScope
  ): WebGLRuntimeShader | null {
    // Get corner radii
    const cornerRadii = this.getCornerRadii(shape, scope);
    if (!cornerRadii) return null;

    // Obtain compiled shader
    const shader = cache.obtainRuntimeShader(
      'Default',
      DefaultHighlightShaderString
    );

    // Set uniforms
    shader.setFloatUniform('size', scope.size.width, scope.size.height);
    shader.setFloatUniform('cornerRadii', ...Array.from(cornerRadii));
    shader.setColorUniform('color', this.parseColorToARGB(this.color));
    shader.setFloatUniform('angle', this.angle * (Math.PI / 180));
    shader.setFloatUniform('falloff', this.falloff);

    return shader;
  }

  toCSSColor(): string {
    return this.color;
  }

  /**
   * Extract corner radii from shape.
   */
  private getCornerRadii(
    shape: Shape,
    scope: DrawScope
  ): Float32Array | null {
    const size = scope.size;
    const maxRadius = Math.min(size.width, size.height) / 2;
    const layoutDirection = scope.layoutDirection;

    try {
      const outline = shape.createOutline(size, layoutDirection, {
        density: scope.density,
        fontScale: scope.fontScale,
      });

      if (outline.type === 'Rounded') {
        return new Float32Array([
          Math.min(outline.radii[0], maxRadius),
          Math.min(outline.radii[1], maxRadius),
          Math.min(outline.radii[2], maxRadius),
          Math.min(outline.radii[3], maxRadius),
        ]);
      }
    } catch {
      // Shape doesn't support corner radii
    }

    return null;
  }

  /**
   * Parse CSS color to ARGB integer (matching Android's Color.toArgb()).
   */
  private parseColorToARGB(cssColor: string): number {
    // Create temporary canvas to parse color
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

    // ARGB format: (a << 24) | (r << 16) | (g << 8) | b
    return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
  }
}

// ============================================================================
// AMBIENT HIGHLIGHT STYLE
// ============================================================================

/**
 * Ambient highlight style - environment-aware edge effect.
 * Port of HighlightStyle.Ambient
 * 
 * Creates an ambient occlusion-like effect on glass edges.
 * Uses AmbientHighlightShaderString which outputs a mask
 * that can be multiplied with content.
 * 
 * Uses DefaultBlendMode (SrcOver) instead of Plus.
 */
export class HighlightStyleAmbient implements HighlightStyle {
  readonly intensity: number;
  readonly color: string;
  readonly blendMode: BlendMode;

  /**
   * @param intensity - Highlight intensity 0.0 to 1.0 (default: 0.38)
   */
  constructor(intensity: number = 0.38) {
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.color = `rgba(255, 255, 255, ${this.intensity})`;
    this.blendMode = BlendMode.SrcOver;
  }

  createShader(
    shape: Shape,
    cache: RuntimeShaderCache,
    scope: DrawScope
  ): WebGLRuntimeShader | null {
    const cornerRadii = this.getCornerRadii(shape, scope);
    if (!cornerRadii) return null;

    const shader = cache.obtainRuntimeShader(
      'Ambient',
      AmbientHighlightShaderString
    );

    shader.setFloatUniform('size', scope.size.width, scope.size.height);
    shader.setFloatUniform('cornerRadii', ...Array.from(cornerRadii));
    shader.setFloatUniform('angle', 45 * (Math.PI / 180));
    shader.setFloatUniform('falloff', 1.0);

    return shader;
  }

  toCSSColor(): string {
    return this.color;
  }

  private getCornerRadii(
    shape: Shape,
    scope: DrawScope
  ): Float32Array | null {
    const size = scope.size;
    const maxRadius = Math.min(size.width, size.height) / 2;

    try {
      const outline = shape.createOutline(size, scope.layoutDirection, {
        density: scope.density,
        fontScale: scope.fontScale,
      });

      if (outline.type === 'Rounded') {
        return new Float32Array([
          Math.min(outline.radii[0], maxRadius),
          Math.min(outline.radii[1], maxRadius),
          Math.min(outline.radii[2], maxRadius),
          Math.min(outline.radii[3], maxRadius),
        ]);
      }
    } catch {
      // Shape doesn't support corner radii
    }

    return null;
  }
}

// ============================================================================
// CUSTOM HIGHLIGHT STYLE
// ============================================================================

/**
 * Custom highlight style with user-defined shader.
 */
export class HighlightStyleCustom implements HighlightStyle {
  readonly color: string;
  readonly blendMode: BlendMode;
  private shaderKey: string;
  private shaderSource: string;
  private uniformSetter: (shader: WebGLRuntimeShader) => void;

  constructor(
    color: string,
    blendMode: BlendMode,
    shaderKey: string,
    shaderSource: string,
    uniformSetter: (shader: WebGLRuntimeShader) => void
  ) {
    this.color = color;
    this.blendMode = blendMode;
    this.shaderKey = shaderKey;
    this.shaderSource = shaderSource;
    this.uniformSetter = uniformSetter;
  }

  createShader(
    _shape: Shape,
    cache: RuntimeShaderCache,
    _scope: DrawScope
  ): WebGLRuntimeShader | null {
    const shader = cache.obtainRuntimeShader(this.shaderKey, this.shaderSource);
    this.uniformSetter(shader);
    return shader;
  }

  toCSSColor(): string {
    return this.color;
  }
}

// ============================================================================
// STYLE PRESETS
// ============================================================================

/**
 * Pre-built highlight style instances.
 * Port of HighlightStyle companion object.
 */
export const HighlightStyles = {
  /** Default style - white 50% alpha, additive blend, 45° angle */
  default: new HighlightStyleDefault(),

  /** Ambient style - white 38% alpha, normal blend */
  ambient: new HighlightStyleAmbient(),

  /** Plain style - white 38% alpha, additive blend, no shader */
  plain: new HighlightStylePlain(),

  /** Strong default - white 70% alpha, sharper falloff */
  strong: new HighlightStyleDefault('rgba(255, 255, 255, 0.7)', BlendMode.Plus, 45, 2.0),

  /** Subtle ambient - white 20% alpha */
  subtle: new HighlightStyleAmbient(0.2),
};

// ============================================================================
// EXPORTS
// ============================================================================

export { HighlightStyles as default };
