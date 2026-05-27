/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.backdrops.EmptyBackdrop.kt
   Licensed under Apache License, Version 2.0
*/

import { Backdrop, DrawScope, Density, LayoutCoordinates, GraphicsLayerScope } from '../core/Backdrop';

// ============================================================================
// EMPTY BACKDROP (Null Object Pattern)
// ============================================================================

/**
 * Singleton empty backdrop instance.
 * Port of EmptyBackdrop object in EmptyBackdrop.kt
 */
class EmptyBackdropImpl implements Backdrop {
  readonly isCoordinatesDependent: boolean = false;

  drawBackdrop(
    _scope: DrawScope,
    _density: Density,
    _coordinates: LayoutCoordinates | null,
    _layerBlock?: (GraphicsLayerScope) => void
  ): void {
    // No-op: draws nothing
  }
}

/**
 * Singleton instance (equivalent to Kotlin's object EmptyBackdrop).
 */
const EMPTY_BACKDROP_INSTANCE: EmptyBackdropImpl = new EmptyBackdropImpl();

/**
 * Factory function to get the empty backdrop.
 * Port of emptyBackdrop() function.
 * 
 * Returns a singleton that draws nothing. Useful as a default
 * or placeholder backdrop.
 * 
 * @returns The singleton empty backdrop instance
 */
export function emptyBackdrop(): Backdrop {
  return EMPTY_BACKDROP_INSTANCE;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default emptyBackdrop;
