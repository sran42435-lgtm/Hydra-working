/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.effects.RenderEffect.kt
   Licensed under Apache License, Version 2.0
*/

import { BackdropEffectScope, RenderEffect } from '../core/BackdropEffectScope';
import { RuntimeShaderCacheImpl } from '../core/RuntimeShaderCache';

// ============================================================================
// RENDER EFFECT IMPLEMENTATIONS
// ============================================================================

/**
 * Base class for all render effects.
 * Provides chaining capability.
 */
export abstract class BaseRenderEffect implements RenderEffect {
  abstract readonly type: string;
  
  /** Previous effect in the chain */
  previousEffect: RenderEffect | null = null;

  abstract apply(ctx: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext): void;
}

/**
 * Blur render effect.
 * Equivalent to Android's RenderEffect.createBlurEffect()
 */
export class BlurEffect extends BaseRenderEffect {
  readonly type = 'Blur';

  constructor(
    public radiusX: number,
    public radiusY: number,
    public edgeTreatment: 'clamp' | 'repeat' | 'mirror' = 'clamp'
  ) {
    super();
  }

  apply(ctx: CanvasRenderingContext2D): void {
    // Apply previous effect first
    if (this.previousEffect) {
      this.previousEffect.apply(ctx);
    }

    // Apply blur via CSS filter
    const existingFilter = ctx.filter !== 'none' ? ctx.filter : '';
    const blurFilter = `blur(${Math.max(this.radiusX, this.radiusY)}px)`;
    ctx.filter = existingFilter ? `${existingFilter} ${blurFilter}` : blurFilter;
  }
}

/**
 * Color filter effect using color matrix.
 * Equivalent to Android's RenderEffect.createColorFilterEffect()
 */
export class ColorFilterEffect extends BaseRenderEffect {
  readonly type = 'ColorFilter';

  constructor(
    public colorMatrix: number[] | string // CSS filter string or 4x5 matrix
  ) {
    super();
  }

  apply(ctx: CanvasRenderingContext2D): void {
    if (this.previousEffect) {
      this.previousEffect.apply(ctx);
    }

    const existingFilter = ctx.filter !== 'none' ? ctx.filter : '';
    
    let filterStr: string;
    if (typeof this.colorMatrix === 'string') {
      filterStr = this.colorMatrix;
    } else {
      // Convert 4x5 color matrix to CSS filter components
      filterStr = this.matrixToCSSFilter(this.colorMatrix);
    }

    ctx.filter = existingFilter ? `${existingFilter} ${filterStr}` : filterStr;
  }

  /**
   * Convert a 4x5 color matrix to CSS filter string.
   * This is a simplified conversion - full implementation would
   * need to decompose the matrix into individual filter functions.
   */
  private matrixToCSSFilter(matrix: number[]): string {
    // For opacity matrix: [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,alpha,0]
    const alpha = matrix[18]; // Position of alpha multiplier
    if (alpha !== undefined && alpha < 1) {
      return `opacity(${alpha})`;
    }
    
    // For brightness/contrast/saturation, we'd need matrix decomposition
    // Simplified: return empty string for complex matrices
    return '';
  }
}

/**
 * Runtime shader effect (WebGL-based).
 * Equivalent to Android's RenderEffect.createRuntimeShaderEffect()
 */
export class RuntimeShaderEffect extends BaseRenderEffect {
  readonly type = 'RuntimeShader';

  public shaderKey: string;
  public shaderSource: string;
  public uniforms: Map<string, number | number[]>;
  private cache: RuntimeShaderCacheImpl;

  constructor(
    shaderKey: string,
    shaderSource: string,
    cache: RuntimeShaderCacheImpl,
    uniforms: Map<string, number | number[]> = new Map()
  ) {
    super();
    this.shaderKey = shaderKey;
    this.shaderSource = shaderSource;
    this.cache = cache;
    this.uniforms = uniforms;
  }

  apply(ctx: WebGLRenderingContext | WebGL2RenderingContext): void {
    if (this.previousEffect) {
      this.previousEffect.apply(ctx);
    }

    // Obtain compiled shader from cache
    const shader = this.cache.obtainRuntimeShader(this.shaderKey, this.shaderSource);

    // Set all uniforms
    for (const [name, value] of this.uniforms) {
      if (Array.isArray(value)) {
        shader.setFloatUniform(name, ...value);
      } else {
        shader.setFloatUniform(name, value);
      }
    }

    // Use the program
    ctx.useProgram(shader.program);
  }

  /**
   * Set a float uniform value.
   */
  setFloat(name: string, ...values: number[]): this {
    this.uniforms.set(name, values.length === 1 ? values[0] : values);
    return this;
  }

  /**
   * Set a color uniform value (ARGB format).
   */
  setColor(name: string, color: number): this {
    this.uniforms.set(name, color);
    return this;
  }
}

/**
 * Chain multiple render effects together.
 * Equivalent to Android's RenderEffect.createChainEffect()
 */
export class ChainEffect extends BaseRenderEffect {
  readonly type = 'Chain';

  constructor(public effects: RenderEffect[]) {
    super();
  }

  apply(ctx: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext): void {
    for (const effect of this.effects) {
      effect.apply(ctx);
    }
  }
}

/**
 * Offset effect - translates the content.
 */
export class OffsetEffect extends BaseRenderEffect {
  readonly type = 'Offset';

  constructor(
    public offsetX: number,
    public offsetY: number
  ) {
    super();
  }

  apply(ctx: CanvasRenderingContext2D): void {
    if (this.previousEffect) {
      this.previousEffect.apply(ctx);
    }
    ctx.translate(this.offsetX, this.offsetY);
  }
}

// ============================================================================
// EFFECT CHAINING FUNCTIONS
// ============================================================================

/**
 * Add an effect to the current render effect chain.
 * Port of BackdropEffectScope.effect() function.
 * 
 * If there's already a render effect, the new effect is chained
 * before it (prepended to the chain).
 * 
 * @param scope - The backdrop effect scope
 * @param effect - The render effect to add
 */
export function addEffect(
  scope: BackdropEffectScope,
  effect: RenderEffect
): void {
  const currentEffect = scope.renderEffect;

  if (currentEffect && 'previousEffect' in currentEffect) {
    // Prepend: new effect → existing chain
    (effect as BaseRenderEffect).previousEffect = currentEffect;
    scope.renderEffect = effect;
  } else if (currentEffect) {
    // Chain: new effect → existing effect
    scope.renderEffect = new ChainEffect([effect, currentEffect]);
  } else {
    // First effect
    scope.renderEffect = effect;
  }
}

/**
 * Create a render effect from a function.
 * Utility for custom effects.
 */
export function createEffect(
  type: string,
  applyFn: (ctx: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext) => void
): RenderEffect {
  return {
    type,
    apply: applyFn,
  };
}

/**
 * Chain multiple effects together in order.
 * First effect in array is applied first.
 */
export function chainEffects(...effects: RenderEffect[]): ChainEffect {
  return new ChainEffect(effects);
}

// ============================================================================
// EFFECT APPLICATION
// ============================================================================

/**
 * Apply a render effect chain to a canvas context.
 * Handles both Canvas 2D and WebGL contexts.
 * 
 * @param ctx - The rendering context
 * @param effect - The render effect to apply (can be null)
 */
export function applyEffect(
  ctx: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext,
  effect: RenderEffect | null
): void {
  if (!effect) return;

  ctx.save();
  try {
    effect.apply(ctx);
  } finally {
    ctx.restore();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { BaseRenderEffect as default };
