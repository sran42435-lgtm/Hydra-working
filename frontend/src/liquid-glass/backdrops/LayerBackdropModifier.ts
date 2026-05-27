/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.backdrops.LayerBackdropModifier.kt
   Licensed under Apache License, Version 2.0
*/

import { LayerBackdrop } from './LayerBackdrop';
import { DrawScope, LayoutCoordinates } from '../core/Backdrop';
import { GraphicsLayer } from '../core/LayerRecorder';

// ============================================================================
// LAYER BACKDROP MODIFIER
// ============================================================================

/**
 * Configuration for layer backdrop modifier.
 */
export interface LayerBackdropConfig {
  /** The layer backdrop to connect */
  backdrop: LayerBackdrop;
}

/**
 * Apply a layer backdrop modifier to a rendering node.
 * 
 * This modifier records the content of a node into the backdrop's
 * graphics layer, enabling it to be used as a backdrop elsewhere.
 * 
 * Port of Modifier.layerBackdrop() extension function.
 * 
 * ## How it works:
 * 1. The modifier intercepts the draw pass
 * 2. Content is drawn normally (drawContent)
 * 3. Content is ALSO recorded into the backdrop's graphics layer
 * 4. The backdrop's layerCoordinates are updated on position changes
 * 
 * @param config - Configuration with the target layer backdrop
 * @returns A modifier function that can be applied to rendering nodes
 * 
 * @example
 * ```typescript
 * // In a component that renders content:
 * const backdrop = layerBackdrop();
 * 
 * // Apply modifier to record content into the backdrop
 * const modifier = layerBackdropModifier({ backdrop });
 * 
 * // During render:
 * modifier.draw(scope, () => {
 *   // draw content
 * });
 * ```
 */
export function layerBackdropModifier(config: LayerBackdropConfig) {
  const { backdrop } = config;

  return {
    /**
     * Draw with layer recording.
     * Port of LayerBackdropNode.ContentDrawScope.draw()
     */
    draw(scope: DrawScope, drawContent: () => void): void {
      // First, draw the actual content
      drawContent();

      // Then, record content into the backdrop's graphics layer
      const layer = backdrop.graphicsLayer;
      const size = {
        width: Math.ceil(scope.size.width),
        height: Math.ceil(scope.size.height),
      };

      layer.record(size, (recordScope) => {
        // Execute the backdrop's custom draw function
        backdrop.onDraw(recordScope);
      });
    },

    /**
     * Update position information.
     * Port of LayerBackdropNode.onGloballyPositioned()
     * 
     * @param coordinates - Current layout coordinates
     */
    onPositioned(coordinates: LayoutCoordinates): void {
      if (coordinates.isAttached) {
        backdrop.layerCoordinates = coordinates;
      }
    },

    /**
     * Clean up when detached.
     * Port of LayerBackdropNode.onDetach()
     */
    onDetach(): void {
      backdrop.layerCoordinates = null;
    },

    /**
     * Get the associated backdrop.
     */
    getBackdrop(): LayerBackdrop {
      return backdrop;
    },
  };
}

// ============================================================================
// WEB COMPONENT INTEGRATION
// ============================================================================

/**
 * Custom element mixin for layer backdrop support.
 * 
 * Adds layer backdrop recording capability to any custom element
 * that uses canvas-based rendering.
 * 
 * @example
 * ```typescript
 * class GlassPanel extends LayerBackdropElement {
 *   render() {
 *     // Draw content - automatically recorded to layer backdrop
 *   }
 * }
 * ```
 */
export abstract class LayerBackdropElement {
  private backdrop: LayerBackdrop | null = null;
  private modifier: ReturnType<typeof layerBackdropModifier> | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  /**
   * Enable layer backdrop recording for this element.
   */
  enableLayerBackdrop(backdrop: LayerBackdrop): void {
    this.backdrop = backdrop;
    this.modifier = layerBackdropModifier({ backdrop });
    this.startObserving();
  }

  /**
   * Disable layer backdrop recording.
   */
  disableLayerBackdrop(): void {
    this.stopObserving();
    this.modifier?.onDetach();
    this.backdrop = null;
    this.modifier = null;
  }

  /**
   * Get the layer backdrop if enabled.
   */
  getLayerBackdrop(): LayerBackdrop | null {
    return this.backdrop;
  }

  /**
   * Render method that subclasses implement.
   * Automatically records to layer backdrop if enabled.
   */
  protected abstract render(scope: DrawScope): void;

  /**
   * Perform rendering with layer recording.
   */
  protected performRender(scope: DrawScope): void {
    if (this.modifier) {
      this.modifier.draw(scope, () => this.render(scope));
    } else {
      this.render(scope);
    }
  }

  /**
   * Update coordinates when element position changes.
   */
  protected updateCoordinates(x: number, y: number, width: number, height: number): void {
    if (!this.modifier) return;

    const coordinates: LayoutCoordinates = {
      x, y, width, height,
      isAttached: true,
      localPositionOf(other: LayoutCoordinates): { x: number; y: number } {
        return { x: other.x - x, y: other.y - y };
      },
      positionInWindow(): { x: number; y: number } {
        return { x, y };
      },
    };

    this.modifier.onPositioned(coordinates);
  }

  /**
   * Start observing position and size changes.
   */
  private startObserving(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const rect = entry.target.getBoundingClientRect();
          this.updateCoordinates(rect.x, rect.y, rect.width, rect.height);
        }
      });
      // Subclasses should call observe on their root element
    }

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => {
        // Re-check position on DOM changes
      });
      // Subclasses should call observe on their root element
    }
  }

  /**
   * Stop observing.
   */
  private stopObserving(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

/**
 * React hook for layer backdrop integration.
 * 
 * @example
 * ```tsx
 * function GlassPanel() {
 *   const { backdrop, ref } = useLayerBackdrop();
 *   
 *   return (
 *     <div ref={ref}>
 *       <canvas /> {/* Content recorded to backdrop * /}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLayerBackdrop() {
  // This is a skeleton for React integration
  // Full implementation would use useRef, useEffect, etc.
  
  const backdrop = new LayerBackdrop(
    new (require('../core/LayerRecorder').CanvasGraphicsLayer)()
  );

  return {
    backdrop,
    ref: null as any, // Would be useRef<HTMLDivElement>(null)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default layerBackdropModifier;
