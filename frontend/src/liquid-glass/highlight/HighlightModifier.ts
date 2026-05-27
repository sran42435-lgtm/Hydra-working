/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.highlight.HighlightModifier.kt
   Licensed under Apache License, Version 2.0
*/

import { DrawScope, BlendMode } from '../core/Backdrop';
import { Highlight } from './Highlight';
import { HighlightStyle } from './HighlightStyle';
import { ShapeProvider } from '../core/ShapeProvider';
import { RuntimeShaderCacheImpl } from '../core/RuntimeShaderCache';
import { CanvasGraphicsLayer } from '../core/LayerRecorder';
import { clipOutline, drawOutline } from '../core/Outline';
import { GraphicsLayer } from '../core/LayerRecorder';

// ============================================================================
// PAINT CONFIGURATION
// ============================================================================

/**
 * Paint configuration for highlight rendering.
 * Equivalent to Android's Paint with Stroke style.
 */
interface HighlightPaint {
  color: string;
  strokeWidth: number;
  blurRadius: number;
  blendMode: BlendMode;
  shader?: WebGLProgram | null;
}

// ============================================================================
// HIGHLIGHT RENDERER
// ============================================================================

/**
 * Renders highlight effects on glass surfaces.
 * Port of HighlightNode.
 * 
 * The highlight is rendered as a soft stroke along the shape's edge,
 * with optional shader-based lighting effects and blur.
 * 
 * ## Rendering Pipeline:
 * 1. Create outline from shape
 * 2. Configure paint (color, stroke width, blur, shader)
 * 3. Record highlight to offscreen layer
 *    - Clip to outline shape
 *    - Draw outline stroke with paint
 * 4. Composite layer onto main canvas with alpha & blend mode
 */
export class HighlightRenderer {
  private highlightLayer: GraphicsLayer | null = null;
  private clipPath: Path2D | null = null;
  private prevStyle: HighlightStyle | null = null;
  private runtimeShaderCache: RuntimeShaderCacheImpl | null = null;

  /**
   * Create a highlight renderer.
   * 
   * @param gl - Optional WebGL context for shader-based styles
   */
  constructor(gl?: WebGLRenderingContext | WebGL2RenderingContext) {
    if (gl) {
      this.runtimeShaderCache = new RuntimeShaderCacheImpl(gl);
    }
  }

  /**
   * Draw highlight effect onto the canvas.
   * Port of HighlightNode.ContentDrawScope.draw()
   * 
   * @param scope - Current draw scope
   * @param shapeProvider - Shape provider for outline generation
   * @param highlight - Highlight configuration (null = no highlight)
   * @param drawContent - Function to draw the underlying content first
   */
  draw(
    scope: DrawScope,
    shapeProvider: ShapeProvider,
    highlight: Highlight | null,
    drawContent: () => void
  ): void {
    // Skip if no highlight or zero width
    if (!highlight || highlight.width <= 0) {
      drawContent();
      return;
    }

    // Draw content first (highlight goes on top)
    drawContent();

    // Ensure we have a graphics layer
    if (!this.highlightLayer) {
      this.highlightLayer = new CanvasGraphicsLayer();
    }

    const size = scope.size;
    const density = scope.density;
    const layoutDirection = scope.layoutDirection;

    // Create safe size with 2px padding for anti-aliasing
    const safeSize = {
      width: Math.ceil(size.width) + 2,
      height: Math.ceil(size.height) + 2,
    };

    // Generate outline from shape
    const outline = shapeProvider.shape.createOutline(
      size,
      layoutDirection,
      { density, fontScale: scope.fontScale }
    );

    // Prepare clip path for rounded outlines
    const clipPath = outline.type === 'Rounded'
      ? (this.clipPath || new Path2D())
      : null;
    if (clipPath) {
      this.clipPath = clipPath;
    }

    // Configure paint
    const paint = this.configurePaint(highlight, shapeProvider, scope);

    // Record highlight to offscreen layer
    this.highlightLayer.alpha = highlight.alpha;
    this.highlightLayer.blendMode = paint.blendMode as GlobalCompositeOperation;
    this.highlightLayer.topLeft = { x: 0, y: 0 };

    this.highlightLayer.record(safeSize, (recordScope) => {
      const ctx = recordScope.canvas as CanvasRenderingContext2D;

      // Translate to account for 1px padding
      ctx.save();
      ctx.translate(1, 1);

      // Set paint properties
      ctx.strokeStyle = paint.color;
      ctx.lineWidth = paint.strokeWidth;
      ctx.globalCompositeOperation = paint.blendMode as GlobalCompositeOperation;

      // Apply blur if specified
      if (paint.blurRadius > 0) {
        ctx.filter = `blur(${paint.blurRadius}px)`;
      }

      // Clip to outline shape
      ctx.save();
      clipOutline(ctx, outline, clipPath || undefined);

      // Draw the highlight stroke
      drawOutline(ctx, outline);

      ctx.restore();
      ctx.restore();
    });

    // Draw the recorded highlight layer onto main canvas
    const mainCtx = scope.canvas as CanvasRenderingContext2D;
    mainCtx.save();
    mainCtx.translate(-1, -1); // Offset back for padding
    this.highlightLayer.drawTo(mainCtx);
    mainCtx.restore();
  }

  /**
   * Configure paint properties for the highlight.
   * Port of HighlightNode.configurePaint()
   */
  private configurePaint(
    highlight: Highlight,
    shapeProvider: ShapeProvider,
    scope: DrawScope
  ): HighlightPaint {
    const style = highlight.style;
    
    // Calculate stroke width (capped at half the minimum dimension)
    const maxStroke = Math.min(scope.size.width, scope.size.height) / 2;
    const strokeWidth = Math.min(highlight.width, maxStroke) * 2; // ×2 for center-stroke

    // Check if style changed - invalidate shader cache if needed
    if (this.prevStyle !== style) {
      this.prevStyle = style;
    }

    // Try to create shader for WebGL-based styles
    let shader: WebGLProgram | null = null;
    if (this.runtimeShaderCache && style.createShader) {
      const runtimeShader = style.createShader(
        shapeProvider.innerShape,
        this.runtimeShaderCache,
        scope
      );
      if (runtimeShader) {
        shader = runtimeShader.program;
      }
    }

    return {
      color: style.color,
      strokeWidth: Math.ceil(strokeWidth),
      blurRadius: highlight.blurRadius,
      blendMode: style.blendMode,
      shader,
    };
  }

  /**
   * Reset cached state.
   */
  invalidate(): void {
    this.clipPath = null;
    this.prevStyle = null;
  }

  /**
   * Release resources.
   */
  release(): void {
    this.highlightLayer?.release();
    this.highlightLayer = null;
    this.clipPath = null;
    this.prevStyle = null;
    this.runtimeShaderCache?.clear();
    this.runtimeShaderCache = null;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a highlight renderer.
 * 
 * @param gl - Optional WebGL context for shader-based highlight styles
 * @returns A new HighlightRenderer instance
 */
export function createHighlightRenderer(
  gl?: WebGLRenderingContext | WebGL2RenderingContext
): HighlightRenderer {
  return new HighlightRenderer(gl);
}

// ============================================================================
// CSS HIGHLIGHT (FALLBACK)
// ============================================================================

/**
 * Apply highlight using CSS box-shadow as fallback.
 * Useful when canvas rendering is not available.
 * 
 * @param element - The DOM element
 * @param highlight - Highlight configuration
 */
export function highlightCSS(
  element: HTMLElement,
  highlight: Highlight | null
): void {
  if (!highlight || highlight.width <= 0 || highlight.alpha <= 0) {
    element.style.boxShadow = '';
    return;
  }

  const style = highlight.style;
  const spreadRadius = highlight.width;
  const blurRadius = highlight.blurRadius;

  // CSS inset box-shadow simulates inner highlight
  // For outer highlight (glass edge), use regular box-shadow
  element.style.boxShadow = `
    inset 0 0 ${blurRadius}px ${spreadRadius}px ${style.color}
  `;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default HighlightRenderer;
