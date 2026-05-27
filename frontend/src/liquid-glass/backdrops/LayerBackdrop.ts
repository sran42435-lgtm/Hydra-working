/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.backdrops.LayerBackdrop.kt
   Licensed under Apache License, Version 2.0
*/

import { Backdrop, DrawScope, Density, LayoutCoordinates, GraphicsLayerScope } from '../core/Backdrop';
import { GraphicsLayer, CanvasGraphicsLayer } from '../core/LayerRecorder';
import { InverseLayerScope } from '../core/InverseLayerScope';

// ============================================================================
// LAYER BACKDROP
// ============================================================================

/**
 * A backdrop that renders content from an externally-recorded graphics layer.
 * Port of LayerBackdrop class.
 * 
 * LayerBackdrop enables "render to texture" functionality:
 * 1. Content is rendered to a GraphicsLayer at one location (via LayerBackdropModifier)
 * 2. That layer is then drawn as a backdrop at another location
 * 
 * This is the key mechanism for:
 * - Exporting rendered content from one element to another
 * - Creating reflection/refraction effects
 * - Reusing rendered output without re-rendering
 */
export class LayerBackdrop implements Backdrop {
  readonly isCoordinatesDependent: boolean = true;

  /** The graphics layer containing recorded content */
  readonly graphicsLayer: GraphicsLayer;

  /** Custom draw function for content rendered into this layer */
  readonly onDraw: (scope: DrawScope) => void;

  /** Coordinates of the source element (set by LayerBackdropModifier) */
  layerCoordinates: LayoutCoordinates | null = null;

  /** Cached inverse layer scope for coordinate transforms */
  private inverseLayerScope: InverseLayerScope | null = null;

  /**
   * @param graphicsLayer - The graphics layer to render
   * @param onDraw - Drawing commands that populate the layer
   */
  constructor(
    graphicsLayer: GraphicsLayer,
    onDraw: (scope: DrawScope) => void = () => {}
  ) {
    this.graphicsLayer = graphicsLayer;
    this.onDraw = onDraw;
  }

  /**
   * Draw the layer content as a backdrop.
   * 
   * Calculates the offset between the source coordinates (where the layer
   * was recorded) and the current draw coordinates, then draws the layer
   * with appropriate translation.
   * 
   * Port of LayerBackdrop.drawBackdrop()
   */
  drawBackdrop(
    scope: DrawScope,
    density: Density,
    coordinates: LayoutCoordinates | null,
    layerBlock?: (GraphicsLayerScope) => void
  ): void {
    if (!coordinates || !this.layerCoordinates) return;

    const ctx = scope.canvas as CanvasRenderingContext2D;

    ctx.save();

    try {
      // Apply inverse transform if layerBlock is provided
      if (layerBlock) {
        const inverseScope = this.obtainInverseLayerScope();
        inverseScope.applyInverseTransform(ctx, density, layerBlock);
      }

      // Calculate offset between source and destination
      const offset = this.calculateOffset(coordinates, this.layerCoordinates);
      
      // Translate so the layer appears at the correct position
      ctx.translate(-offset.x, -offset.y);

      // Draw the recorded layer
      this.graphicsLayer.drawTo(ctx, 0, 0);
    } finally {
      ctx.restore();
    }
  }

  /**
   * Calculate the offset between two sets of coordinates.
   * 
   * First tries localPositionOf (more accurate within the same coordinate space),
   * falls back to positionInWindow difference for cross-hierarchy cases.
   * 
   * Port of the offset calculation in LayerBackdrop.drawBackdrop()
   */
  private calculateOffset(
    from: LayoutCoordinates,
    to: LayoutCoordinates
  ): { x: number; y: number } {
    try {
      // Try local position first (within same coordinate hierarchy)
      return to.localPositionOf(from);
    } catch {
      // Fallback: use window position difference
      const fromWindow = from.positionInWindow();
      const toWindow = to.positionInWindow();
      return {
        x: fromWindow.x - toWindow.x,
        y: fromWindow.y - toWindow.y,
      };
    }
  }

  /**
   * Get or create the inverse layer scope.
   * Reuses the existing scope for performance, resetting it each time.
   * 
   * Port of LayerBackdrop.obtainInverseLayerScope()
   */
  private obtainInverseLayerScope(): InverseLayerScope {
    if (this.inverseLayerScope) {
      this.inverseLayerScope.reset();
      return this.inverseLayerScope;
    }
    
    this.inverseLayerScope = new InverseLayerScope();
    return this.inverseLayerScope;
  }

  /**
   * Release resources.
   */
  release(): void {
    this.graphicsLayer.release();
    this.layerCoordinates = null;
    this.inverseLayerScope = null;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a LayerBackdrop.
 * Port of rememberLayerBackdrop() composable function.
 * 
 * @param graphicsLayer - Optional pre-created graphics layer
 * @param onDraw - Drawing commands for the layer content
 * @returns A new LayerBackdrop instance
 * 
 * @example
 * ```typescript
 * // Create a layer backdrop with default canvas layer
 * const backdrop = layerBackdrop(undefined, (scope) => {
 *   const ctx = scope.canvas as CanvasRenderingContext2D;
 *   ctx.fillStyle = 'blue';
 *   ctx.fillRect(0, 0, 100, 100);
 * });
 * ```
 */
export function layerBackdrop(
  graphicsLayer?: GraphicsLayer,
  onDraw?: (scope: DrawScope) => void
): LayerBackdrop {
  const layer = graphicsLayer || new CanvasGraphicsLayer();
  return new LayerBackdrop(layer, onDraw);
}

/**
 * Create a LayerBackdrop with a WebGL graphics layer.
 * 
 * @param gl - WebGL context
 * @param onDraw - Drawing commands for the layer content
 * @returns A new LayerBackdrop with WebGL backing
 */
export function webglLayerBackdrop(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  onDraw?: (scope: DrawScope) => void
): LayerBackdrop {
  const { WebGLGraphicsLayer } = require('../core/LayerRecorder');
  const layer = new WebGLGraphicsLayer(gl);
  return new LayerBackdrop(layer, onDraw);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LayerBackdrop;
