/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.BackdropEffectScope.kt
   Licensed under Apache License, Version 2.0
*/

import { Density, DrawScope, Shape, BlendMode } from './Backdrop';
import { RuntimeShaderCache, RuntimeShaderCacheImpl, createRuntimeShaderCache } from './RuntimeShaderCache';

// ============================================================================
// RENDER EFFECT (Simplified for Web)
// ============================================================================

/**
 * Represents a render effect that can be applied to a graphics layer.
 * Port of Android's RenderEffect.
 */
export interface RenderEffect {
  /** Unique type identifier for this effect */
  readonly type: string;
  
  /**
   * Apply this effect to a canvas context.
   * For WebGL effects, this sets up shader programs.
   */
  apply(ctx: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext): void;
}

// ============================================================================
// BACKDROP EFFECT SCOPE INTERFACE
// ============================================================================

/**
 * Sealed interface for backdrop effect scope.
 * Port of BackdropEffectScope sealed interface.
 * 
 * Extends Density and RuntimeShaderCache to provide:
 * - Density information for pixel calculations
 * - Shader caching for runtime shader effects
 * - Size, layout direction, and shape access
 * - Padding management for effects that bleed outside bounds
 * - Render effect chaining
 */
export interface BackdropEffectScope extends Density, RuntimeShaderCache {
  /** Current size of the backdrop area */
  readonly size: { width: number; height: number };

  /** Layout direction (LTR/RTL) */
  readonly layoutDirection: 'Ltr' | 'Rtl';

  /** Current shape of the backdrop */
  readonly shape: Shape;

  /** 
   * Padding to add around the backdrop for effects that bleed outside bounds.
   * e.g., blur needs extra space to avoid clipping the blur spread.
   */
  padding: number;

  /**
   * Current render effect chain.
   * null if no effects are applied.
   */
  renderEffect: RenderEffect | null;

  /**
   * Get corner radii if the shape supports it.
   * Returns [topLeft, topRight, bottomRight, bottomLeft] or null.
   */
  readonly cornerRadii: Float32Array | null;
}

// ============================================================================
// BACKDROP EFFECT SCOPE IMPLEMENTATION
// ============================================================================

/**
 * Default implementation of BackdropEffectScope.
 * Port of BackdropEffectScopeImpl abstract class.
 */
export class BackdropEffectScopeImpl implements BackdropEffectScope {
  // Density properties
  density: number = 1;
  fontScale: number = 1;

  // Size and layout
  size: { width: number; height: number } = { width: 0, height: 0 };
  layoutDirection: 'Ltr' | 'Rtl' = 'Ltr';

  // Padding for bleed effects
  padding: number = 0;

  // Render effect chain
  renderEffect: RenderEffect | null = null;

  // Shape (set externally by DrawBackdropNode)
  private _shape: Shape | null = null;

  // Runtime shader cache
  private runtimeShaderCache: RuntimeShaderCacheImpl;

  // Cached values for change detection
  private cachedDensity: number = 1;
  private cachedFontScale: number = 1;
  private cachedSize: { width: number; height: number } = { width: 0, height: 0 };
  private cachedLayoutDirection: 'Ltr' | 'Rtl' = 'Ltr';

  constructor(gl?: WebGLRenderingContext | WebGL2RenderingContext) {
    if (gl) {
      this.runtimeShaderCache = createRuntimeShaderCache(gl) as RuntimeShaderCacheImpl;
    } else {
      // Create a no-op cache if no WebGL context (effects won't use shaders)
      this.runtimeShaderCache = new RuntimeShaderCacheImpl(
        document.createElement('canvas').getContext('webgl') || 
        document.createElement('canvas').getContext('webgl2') as any
      );
    }
  }

  // ==========================================================================
  // SHAPE ACCESS
  // ==========================================================================

  /**
   * Get the current shape.
   */
  get shape(): Shape {
    if (!this._shape) {
      throw new Error('Shape not set in BackdropEffectScope');
    }
    return this._shape;
  }

  /**
   * Set the shape (called by DrawBackdropNode).
   */
  set shape(value: Shape) {
    this._shape = value;
  }

  // ==========================================================================
  // CORNER RADII EXTRACTION
  // ==========================================================================

  /**
   * Get corner radii for SDF-based effects.
   * Port of BackdropEffectScope.cornerRadii in Lens.kt
   * 
   * Supports:
   * - RoundedRectShape with per-corner radii
   * - Uniform radius shapes
   * 
   * Returns null for non-rounded shapes.
   */
  get cornerRadii(): Float32Array | null {
    const shape = this._shape;
    if (!shape) return null;

    try {
      const outline = shape.createOutline(this.size, this.layoutDirection, this);
      
      if (outline.type === 'Rounded') {
        return outline.radii;
      }
      
      // For rectangle, return zero radii
      if (outline.type === 'Rectangle') {
        return new Float32Array([0, 0, 0, 0]);
      }
      
      // Generic paths don't have corner radii
      return null;
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // CHANGE DETECTION
  // ==========================================================================

  /**
   * Update scope from current draw state.
   * Returns true if any properties changed.
   * 
   * Port of BackdropEffectScopeImpl.update()
   */
  update(scope: DrawScope): boolean {
    const newDensity = scope.density;
    const newFontScale = scope.fontScale;
    const newSize = scope.size;
    const newLayoutDirection = scope.layoutDirection;

    const changed =
      newDensity !== this.cachedDensity ||
      newFontScale !== this.cachedFontScale ||
      newSize.width !== this.cachedSize.width ||
      newSize.height !== this.cachedSize.height ||
      newLayoutDirection !== this.cachedLayoutDirection;

    if (changed) {
      this.density = newDensity;
      this.fontScale = newFontScale;
      this.size = { ...newSize };
      this.layoutDirection = newLayoutDirection;

      // Update cache
      this.cachedDensity = newDensity;
      this.cachedFontScale = newFontScale;
      this.cachedSize = { ...newSize };
      this.cachedLayoutDirection = newLayoutDirection;
    }

    return changed;
  }

  // ==========================================================================
  // EFFECT APPLICATION
  // ==========================================================================

  /**
   * Apply effects to this scope.
   * Resets padding and renderEffect, then executes the effects block.
   * 
   * Port of BackdropEffectScopeImpl.apply()
   */
  apply(effects: (scope: BackdropEffectScope) => void): void {
    this.padding = 0;
    this.renderEffect = null;
    effects(this);
  }

  // ==========================================================================
  // RESET
  // ==========================================================================

  /**
   * Reset all properties to default values.
   * 
   * Port of BackdropEffectScopeImpl.reset()
   */
  reset(): void {
    this.density = 1;
    this.fontScale = 1;
    this.size = { width: 0, height: 0 };
    this.layoutDirection = 'Ltr';
    this.padding = 0;
    this.renderEffect = null;

    this.cachedDensity = 1;
    this.cachedFontScale = 1;
    this.cachedSize = { width: 0, height: 0 };
    this.cachedLayoutDirection = 'Ltr';

    this.runtimeShaderCache.clear();
  }

  // ==========================================================================
  // RUNTIME SHADER CACHE DELEGATION
  // ==========================================================================

  /**
   * Obtain a compiled runtime shader.
   * Delegates to internal RuntimeShaderCacheImpl.
   */
  obtainRuntimeShader(key: string, source: string): import('./RuntimeShaderCache').WebGLRuntimeShader {
    return this.runtimeShaderCache.obtainRuntimeShader(key, source);
  }
}

// ============================================================================
// PRE-BUILT RENDER EFFECTS
// ============================================================================

/**
 * Blur render effect.
 */
export class BlurRenderEffect implements RenderEffect {
  readonly type = 'Blur';

  constructor(
    public radiusX: number,
    public radiusY: number,
    public edgeTreatment: 'clamp' | 'repeat' | 'mirror' = 'clamp'
  ) {}

  apply(ctx: CanvasRenderingContext2D): void {
    ctx.filter = `blur(${this.radiusX}px)`;
  }
}

/**
 * Color filter render effect using CSS filters.
 */
export class ColorFilterRenderEffect implements RenderEffect {
  readonly type = 'ColorFilter';
  
  constructor(public cssFilter: string) {}

  apply(ctx: CanvasRenderingContext2D): void {
    // Append to existing filter
    const existingFilter = ctx.filter !== 'none' ? ctx.filter : '';
    ctx.filter = existingFilter 
      ? `${existingFilter} ${this.cssFilter}`
      : this.cssFilter;
  }
}

/**
 * Runtime shader render effect (WebGL-based).
 */
export class RuntimeShaderRenderEffect implements RenderEffect {
  readonly type = 'RuntimeShader';

  constructor(
    public shaderKey: string,
    public shaderSource: string,
    public uniforms: Map<string, number | number[]> = new Map()
  ) {}

  apply(ctx: WebGLRenderingContext | WebGL2RenderingContext): void {
    // WebGL shader effects are applied via the runtime shader cache
    // This is a placeholder - actual implementation uses the shader cache
  }
}

/**
 * Chain multiple render effects together.
 */
export class ChainRenderEffect implements RenderEffect {
  readonly type = 'Chain';

  constructor(public effects: RenderEffect[]) {}

  apply(ctx: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext): void {
    for (const effect of this.effects) {
      effect.apply(ctx);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BackdropEffectScopeImpl;
