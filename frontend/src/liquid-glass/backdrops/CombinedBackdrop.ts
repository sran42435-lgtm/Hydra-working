/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.backdrops.CombinedBackdrop.kt
   Licensed under Apache License, Version 2.0
*/

import { Backdrop, DrawScope, Density, LayoutCoordinates, GraphicsLayerScope } from '../core/Backdrop';

// ============================================================================
// COMBINED BACKDROPS
// ============================================================================

/**
 * Combines 2 backdrops into one.
 * Port of Combined2Backdrops.
 * 
 * Both backdrops are drawn in sequence (backdrop1 first, then backdrop2).
 * isCoordinatesDependent is true if EITHER backdrop depends on coordinates.
 */
class Combined2Backdrops implements Backdrop {
  readonly isCoordinatesDependent: boolean;

  constructor(
    private backdrop1: Backdrop,
    private backdrop2: Backdrop
  ) {
    this.isCoordinatesDependent =
      backdrop1.isCoordinatesDependent || backdrop2.isCoordinatesDependent;
  }

  drawBackdrop(
    scope: DrawScope,
    density: Density,
    coordinates: LayoutCoordinates | null,
    layerBlock?: (GraphicsLayerScope) => void
  ): void {
    this.backdrop1.drawBackdrop(scope, density, coordinates, layerBlock);
    this.backdrop2.drawBackdrop(scope, density, coordinates, layerBlock);
  }
}

/**
 * Combines 3 backdrops into one.
 * Port of Combined3Backdrops.
 * 
 * All three backdrops are drawn in sequence.
 * isCoordinatesDependent is true if ANY backdrop depends on coordinates.
 */
class Combined3Backdrops implements Backdrop {
  readonly isCoordinatesDependent: boolean;

  constructor(
    private backdrop1: Backdrop,
    private backdrop2: Backdrop,
    private backdrop3: Backdrop
  ) {
    this.isCoordinatesDependent =
      backdrop1.isCoordinatesDependent ||
      backdrop2.isCoordinatesDependent ||
      backdrop3.isCoordinatesDependent;
  }

  drawBackdrop(
    scope: DrawScope,
    density: Density,
    coordinates: LayoutCoordinates | null,
    layerBlock?: (GraphicsLayerScope) => void
  ): void {
    this.backdrop1.drawBackdrop(scope, density, coordinates, layerBlock);
    this.backdrop2.drawBackdrop(scope, density, coordinates, layerBlock);
    this.backdrop3.drawBackdrop(scope, density, coordinates, layerBlock);
  }
}

/**
 * Combines N backdrops into one.
 * Port of CombinedBackdrops (vararg version).
 * 
 * All backdrops are drawn in order.
 * isCoordinatesDependent uses Array.some() (equivalent to Kotlin's any()).
 */
class CombinedNBackdrops implements Backdrop {
  readonly isCoordinatesDependent: boolean;

  constructor(private backdrops: Backdrop[]) {
    this.isCoordinatesDependent = backdrops.some(b => b.isCoordinatesDependent);
  }

  drawBackdrop(
    scope: DrawScope,
    density: Density,
    coordinates: LayoutCoordinates | null,
    layerBlock?: (GraphicsLayerScope) => void
  ): void {
    for (const backdrop of this.backdrops) {
      backdrop.drawBackdrop(scope, density, coordinates, layerBlock);
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Combine 2 backdrops into one.
 * Port of rememberCombinedBackdrop(backdrop1, backdrop2).
 * 
 * @param backdrop1 - First backdrop (drawn first)
 * @param backdrop2 - Second backdrop (drawn on top)
 * @returns A combined backdrop
 */
export function combinedBackdrop(
  backdrop1: Backdrop,
  backdrop2: Backdrop
): Backdrop {
  return new Combined2Backdrops(backdrop1, backdrop2);
}

/**
 * Combine 3 backdrops into one.
 * Port of rememberCombinedBackdrop(backdrop1, backdrop2, backdrop3).
 * 
 * @param backdrop1 - First backdrop
 * @param backdrop2 - Second backdrop
 * @param backdrop3 - Third backdrop (drawn last)
 * @returns A combined backdrop
 */
export function combinedBackdrop3(
  backdrop1: Backdrop,
  backdrop2: Backdrop,
  backdrop3: Backdrop
): Backdrop {
  return new Combined3Backdrops(backdrop1, backdrop2, backdrop3);
}

/**
 * Combine multiple backdrops into one.
 * Port of rememberCombinedBackdrop(vararg backdrops).
 * 
 * @param backdrops - Array of backdrops (drawn in order)
 * @returns A combined backdrop
 */
export function combinedBackdrops(...backdrops: Backdrop[]): Backdrop {
  if (backdrops.length === 0) {
    // Return empty backdrop for empty array
    return {
      isCoordinatesDependent: false,
      drawBackdrop(): void {},
    };
  }
  
  if (backdrops.length === 1) {
    return backdrops[0];
  }
  
  if (backdrops.length === 2) {
    return new Combined2Backdrops(backdrops[0], backdrops[1]);
  }
  
  if (backdrops.length === 3) {
    return new Combined3Backdrops(backdrops[0], backdrops[1], backdrops[2]);
  }
  
  return new CombinedNBackdrops(backdrops);
}

/**
 * Combine an array of backdrops.
 * Convenience alias for combinedBackdrops().
 */
export function combineBackdrops(backdrops: Backdrop[]): Backdrop {
  return combinedBackdrops(...backdrops);
}

// ============================================================================
// UTILITY: BACKDROP BUILDER
// ============================================================================

/**
 * Builder pattern for combining multiple backdrops fluently.
 * 
 * @example
 * ```typescript
 * const backdrop = new BackdropBuilder()
 *   .add(gradientBackdrop)
 *   .add(blurBackdrop)
 *   .add(noiseBackdrop)
 *   .build();
 * ```
 */
export class BackdropBuilder {
  private backdrops: Backdrop[] = [];

  /**
   * Add a backdrop to the chain.
   */
  add(backdrop: Backdrop): this {
    this.backdrops.push(backdrop);
    return this;
  }

  /**
   * Add multiple backdrops at once.
   */
  addAll(...backdrops: Backdrop[]): this {
    this.backdrops.push(...backdrops);
    return this;
  }

  /**
   * Build the combined backdrop.
   */
  build(): Backdrop {
    return combinedBackdrops(...this.backdrops);
  }

  /**
   * Get the current number of backdrops.
   */
  get count(): number {
    return this.backdrops.length;
  }

  /**
   * Clear all backdrops.
   */
  clear(): void {
    this.backdrops = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default combinedBackdrop;
