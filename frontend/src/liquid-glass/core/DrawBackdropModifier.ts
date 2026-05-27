/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.DrawBackdropModifier.kt
   Licensed under Apache License, Version 2.0
*/

import { Backdrop, DrawScope, Density, LayoutCoordinates, GraphicsLayerScope, BlendMode } from './Backdrop';
import { ShapeProvider } from './ShapeProvider';
import { BackdropEffectScopeImpl } from './BackdropEffectScope';
import { CanvasGraphicsLayer, GraphicsLayer, recordLayer } from './LayerRecorder';
import { Highlight } from '../highlight/Highlight';
import { HighlightRenderer } from '../highlight/HighlightModifier';
import { Shadow } from '../shadow/Shadow';
import { ShadowRenderer } from '../shadow/ShadowModifier';
import { InnerShadow } from '../shadow/InnerShadow';
import { InnerShadowRenderer } from '../shadow/InnerShadowModifier';
import { LayerBackdrop } from '../backdrops/LayerBackdrop';

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default draw backdrop callback.
 * Simply executes the provided draw function.
 * Port of DefaultOnDrawBackdrop.
 */
const defaultOnDrawBackdrop = (
  scope: DrawScope,
  drawBackdrop: () => void
): void => {
  drawBackdrop();
};

/**
 * Default highlight factory.
 * Port of DefaultHighlight.
 */
const defaultHighlight = (): Highlight => Highlight.Default;

/**
 * Default shadow factory.
 * Port of DefaultShadow.
 */
const defaultShadow = (): Shadow => Shadow.Default;

// ============================================================================
// DRAW BACKDROP OPTIONS
// ============================================================================

/**
 * Configuration options for drawBackdrop.
 * Port of Modifier.drawBackdrop() parameters.
 */
export interface DrawBackdropOptions {
  /** The backdrop to render */
  backdrop: Backdrop;

  /** Shape factory for clipping and effects */
  shape: () => ShapeProvider;

  /** Effect pipeline to apply */
  effects: (scope: BackdropEffectScopeImpl) => void;

  /** Highlight configuration (null or factory) */
  highlight?: (() => Highlight | null) | null;

  /** Drop shadow configuration (null or factory) */
  shadow?: (() => Shadow | null) | null;

  /** Inner shadow configuration (null or factory) */
  innerShadow?: (() => InnerShadow | null) | null;

  /** Graphics layer scope configuration */
  layerBlock?: (GraphicsLayerScope) => void;

  /** Exported layer backdrop (for layer export) */
  exportedBackdrop?: LayerBackdrop | null;

  /** Draw behind the backdrop */
  onDrawBehind?: (scope: DrawScope) => void;

  /** Custom draw backdrop interceptor */
  onDrawBackdrop?: (scope: DrawScope, drawBackdrop: () => void) => void;

  /** Draw between backdrop and content */
  onDrawSurface?: (scope: DrawScope) => void;

  /** Draw on top of everything */
  onDrawFront?: (scope: DrawScope) => void;

  /** WebGL context for shader effects */
  gl?: WebGLRenderingContext | WebGL2RenderingContext;
}

// ============================================================================
// DRAW BACKDROP NODE
// ============================================================================

/**
 * Main orchestrator for rendering liquid glass effects.
 * Port of DrawBackdropNode.
 * 
 * This is the central rendering node that coordinates:
 * 1. Effect application (blur, lens, color filters)
 * 2. Shadow rendering (behind content)
 * 3. Backdrop rendering (the glass surface)
 * 4. Highlight rendering (on top of glass)
 * 5. Content rendering (the actual UI)
 * 6. Layer export (for re-use elsewhere)
 * 
 * ## Rendering Order:
 * ```
 * onDrawBehind()
 * └── Inner Shadow
 *     └── Backdrop Layer (recorded to offscreen)
 *         ├── Shadow (behind)
 *         ├── Backdrop content
 *         └── Highlight (on top)
 *     └── onDrawSurface()
 *     └── drawContent()
 *     └── onDrawFront()
 * └── Exported Backdrop recording
 * ```
 */
export class DrawBackdropNode {
  // Configuration
  private backdrop: Backdrop;
  private shapeProvider: ShapeProvider;
  private effects: (scope: BackdropEffectScopeImpl) => void;
  private layerBlock?: (GraphicsLayerScope) => void;
  private exportedBackdrop?: LayerBackdrop | null;
  private onDrawBehind?: (scope: DrawScope) => void;
  private onDrawBackdrop: (scope: DrawScope, drawBackdrop: () => void) => void;
  private onDrawSurface?: (scope: DrawScope) => void;
  private onDrawFront?: (scope: DrawScope) => void;

  // Effect scope
  private effectScope: BackdropEffectScopeImpl;

  // Renderers
  private highlightRenderer: HighlightRenderer | null = null;
  private shadowRenderer: ShadowRenderer | null = null;
  private innerShadowRenderer: InnerShadowRenderer | null = null;

  // Highlight & shadow factories
  private highlightFactory: (() => Highlight | null) | null;
  private shadowFactory: (() => Shadow | null) | null;
  private innerShadowFactory: (() => InnerShadow | null) | null;

  // Graphics layer
  private graphicsLayer: GraphicsLayer | null = null;

  // State
  private layoutCoordinates: LayoutCoordinates | null = null;
  private padding: number = 0;

  constructor(options: DrawBackdropOptions) {
    this.backdrop = options.backdrop;
    this.shapeProvider = options.shape();
    this.effects = options.effects;
    this.layerBlock = options.layerBlock;
    this.exportedBackdrop = options.exportedBackdrop;
    this.onDrawBehind = options.onDrawBehind;
    this.onDrawBackdrop = options.onDrawBackdrop || defaultOnDrawBackdrop;
    this.onDrawSurface = options.onDrawSurface;
    this.onDrawFront = options.onDrawFront;

    this.highlightFactory = options.highlight !== undefined 
      ? options.highlight 
      : defaultHighlight;
    this.shadowFactory = options.shadow !== undefined 
      ? options.shadow 
      : defaultShadow;
    this.innerShadowFactory = options.innerShadow || null;

    // Initialize effect scope
    this.effectScope = new BackdropEffectScopeImpl(options.gl);
    this.effectScope.shape = this.shapeProvider.innerShape;

    // Initialize renderers
    this.highlightRenderer = new HighlightRenderer(options.gl);
    this.shadowRenderer = new ShadowRenderer();
    this.innerShadowRenderer = new InnerShadowRenderer();
  }

  // ==========================================================================
  // MEASURE
  // ==========================================================================

  /**
   * Calculate required size including padding for effects.
   * Port of MeasureScope.measure()
   */
  measure(
    width: number,
    height: number,
    constraints?: { minWidth?: number; maxWidth?: number; minHeight?: number; maxHeight?: number }
  ): { width: number; height: number; padding: number } {
    this.updateEffects();
    const padding = this.padding;
    
    return {
      width: width + padding * 2,
      height: height + padding * 2,
      padding,
    };
  }

  // ==========================================================================
  // DRAW
  // ==========================================================================

  /**
   * Draw the complete glass surface with all effects.
   * Port of ContentDrawScope.draw()
   */
  draw(
    scope: DrawScope,
    drawContent: () => void
  ): void {
    // Update effect scope if state changed
    if (this.effectScope.update(scope)) {
      this.updateEffects();
    }

    const padding = this.padding;

    // ---- Phase 1: Draw Behind ----
    this.onDrawBehind?.(scope);

    // ---- Phase 2: Draw Inner Shadow (on top of behind, under glass) ----
    const innerShadow = this.innerShadowFactory?.();
    if (innerShadow && this.innerShadowRenderer) {
      this.innerShadowRenderer.draw(
        scope,
        this.shapeProvider,
        innerShadow,
        () => {} // Inner shadow draws content first internally
      );
    }

    // ---- Phase 3: Draw Backdrop Layer ----
    this.drawBackdropLayer(scope, padding);

    // ---- Phase 4: Draw Surface ----
    this.onDrawSurface?.(scope);

    // ---- Phase 5: Draw Content ----
    drawContent();

    // ---- Phase 6: Draw Front ----
    this.onDrawFront?.(scope);

    // ---- Phase 7: Export Layer ----
    if (this.exportedBackdrop?.graphicsLayer) {
      this.exportLayer(scope);
    }
  }

  /**
   * Draw the backdrop layer with shadow, backdrop content, and highlight.
   * Port of drawBackdropLayer local function.
   */
  private drawBackdropLayer(scope: DrawScope, padding: number): void {
    const layer = this.graphicsLayer;
    if (!layer) return;

    // Calculate layer size with padding
    const layerSize = {
      width: Math.ceil(scope.size.width) + Math.ceil(padding) * 2,
      height: Math.ceil(scope.size.height) + Math.ceil(padding) * 2,
    };

    // Record backdrop rendering into graphics layer
    this.recordBackdropBlock(scope, layer, layerSize, padding);

    // Position the layer
    const mainCtx = scope.canvas as CanvasRenderingContext2D;
    mainCtx.save();

    if (padding !== 0) {
      mainCtx.translate(-padding, -padding);
    }

    // Draw the recorded layer
    layer.drawTo(mainCtx);

    mainCtx.restore();
  }

  /**
   * Record backdrop content into the graphics layer.
   * Port of recordBackdropBlock local function.
   */
  private recordBackdropBlock(
    scope: DrawScope,
    layer: GraphicsLayer,
    layerSize: { width: number; height: number },
    padding: number
  ): void {
    const highlight = this.highlightFactory?.();
    const shadow = this.shadowFactory?.();

    layer.record(layerSize, (recordScope) => {
      const ctx = recordScope.canvas as CanvasRenderingContext2D;
      
      // Apply padding translation
      if (padding !== 0) {
        ctx.save();
        ctx.translate(padding, padding);
      }

      // Draw shadow first (behind backdrop)
      if (shadow && this.shadowRenderer) {
        this.shadowRenderer.draw(
          recordScope,
          this.shapeProvider,
          shadow,
          () => {} // Shadow handles its own content drawing
        );
      }

      // Draw the actual backdrop
      this.onDrawBackdrop(recordScope, () => {
        this.backdrop.drawBackdrop(
          recordScope,
          this.effectScope,
          this.layoutCoordinates,
          this.layerBlock
        );
      });

      // Draw highlight on top of backdrop
      if (highlight && this.highlightRenderer) {
        this.highlightRenderer.draw(
          recordScope,
          this.shapeProvider,
          highlight,
          () => {} // Highlight handles its own content drawing
        );
      }

      if (padding !== 0) {
        ctx.restore();
      }
    });
  }

  /**
   * Export the rendered layer for re-use elsewhere.
   * Port of the export logic at the end of draw().
   */
  private exportLayer(scope: DrawScope): void {
    const layer = this.exportedBackdrop?.graphicsLayer;
    if (!layer) return;

    recordLayer(
      scope,
      layer,
      {
        width: Math.ceil(scope.size.width),
        height: Math.ceil(scope.size.height),
      },
      { density: scope.density, fontScale: scope.fontScale },
      (recordScope) => {
        this.onDrawBehind?.(recordScope);
        this.drawBackdropLayer(recordScope, this.padding);
        this.onDrawSurface?.(recordScope);
        this.onDrawFront?.(recordScope);
      }
    );
  }

  // ==========================================================================
  // POSITION TRACKING
  // ==========================================================================

  /**
   * Update layout coordinates.
   * Port of onGloballyPositioned()
   */
  onPositioned(coordinates: LayoutCoordinates): void {
    if (!coordinates.isAttached) return;

    if (this.backdrop.isCoordinatesDependent) {
      this.layoutCoordinates = coordinates;
    } else {
      if (this.layoutCoordinates !== null) {
        this.layoutCoordinates = null;
      }
    }

    if (this.exportedBackdrop) {
      this.exportedBackdrop.layerCoordinates = coordinates;
    }
  }

  // ==========================================================================
  // EFFECT MANAGEMENT
  // ==========================================================================

  /**
   * Update effects by applying the effects block.
   * Port of updateEffects() + observeEffects()
   */
  private updateEffects(): void {
    this.effectScope.apply(this.effects);
    this.padding = this.effectScope.padding;
    // renderEffect is handled inside effectScope
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Initialize resources.
   * Port of onAttach()
   */
  attach(): void {
    this.graphicsLayer = new CanvasGraphicsLayer();
    this.updateEffects();
  }

  /**
   * Release resources.
   * Port of onDetach()
   */
  detach(): void {
    this.graphicsLayer?.release();
    this.graphicsLayer = null;

    this.effectScope.reset();
    this.layoutCoordinates = null;

    if (this.exportedBackdrop) {
      this.exportedBackdrop.layerCoordinates = null;
    }

    this.highlightRenderer?.release();
    this.shadowRenderer?.release();
    this.innerShadowRenderer?.release();
  }

  /**
   * Invalidate cached state.
   */
  invalidate(): void {
    this.highlightRenderer?.invalidate();
    this.updateEffects();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a DrawBackdropNode with full configuration.
 * Port of Modifier.drawBackdrop()
 */
export function drawBackdrop(options: DrawBackdropOptions): DrawBackdropNode {
  return new DrawBackdropNode(options);
}

/**
 * Create a DrawBackdropNode with plain configuration (no highlight/shadow defaults).
 * Port of Modifier.drawPlainBackdrop()
 */
export function drawPlainBackdrop(options: Omit<DrawBackdropOptions, 'highlight' | 'shadow' | 'innerShadow'>): DrawBackdropNode {
  return new DrawBackdropNode({
    ...options,
    highlight: null,
    shadow: null,
    innerShadow: null,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DrawBackdropNode;
