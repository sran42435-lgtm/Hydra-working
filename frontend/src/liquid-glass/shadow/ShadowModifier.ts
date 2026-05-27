/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.shadow.ShadowModifier.kt
   Licensed under Apache License, Version 2.0
*/

import { DrawScope, BlendMode } from '../core/Backdrop';
import { Shadow, getShadowPadding } from './Shadow';
import { ShapeProvider } from '../core/ShapeProvider';
import { CanvasGraphicsLayer } from '../core/LayerRecorder';
import { drawOutline } from '../core/Outline';
import { GraphicsLayer } from '../core/LayerRecorder';

// ============================================================================
// SHADOW MASK PAINT
// ============================================================================

/**
 * Paint used for erasing the center of the shadow.
 * Uses Clear blend mode to punch a hole in the blurred shape.
 * 
 * Port of ShadowMaskPaint in ShadowModifier.kt
 */
const SHADOW_MASK_PAINT = {
  blendMode: BlendMode.Clear,
  color: 'transparent',
};

// ============================================================================
// SHADOW RENDERER
// ============================================================================

/**
 * Renders drop shadow effects for glass surfaces.
 * Port of ShadowNode.
 * 
 * ## Rendering Pipeline (Mask-based technique):
 * 1. Create shadow layer (offscreen, Offscreen compositing)
 * 2. Record shadow into layer:
 *    a. Translate to offset position + padding
 *    b. Draw shape outline with blur paint (shadow color + blur)
 *    c. Draw shape outline with ShadowMaskPaint (Clear blend)
 *       - This erases the center, leaving shadow only on edges
 *    d. Translate back
 * 3. Draw shadow layer onto main canvas (offset negatively for padding)
 * 4. Draw content on top of shadow
 * 
 * The Clear blend mode on the mask paint creates the "hollow" shadow
 * that only appears outside the shape boundaries.
 */
export class ShadowRenderer {
  private shadowLayer: GraphicsLayer | null = null;

  /**
   * Draw drop shadow effect onto the canvas.
   * Port of ShadowNode.ContentDrawScope.draw()
   * 
   * @param scope - Current draw scope
   * @param shapeProvider - Shape provider for outline generation
   * @param shadow - Shadow configuration (null = no shadow)
   * @param drawContent - Function to draw the content (after shadow)
   */
  draw(
    scope: DrawScope,
    shapeProvider: ShapeProvider,
    shadow: Shadow | null,
    drawContent: () => void
  ): void {
    // Skip if no shadow
    if (!shadow) {
      drawContent();
      return;
    }

    // Ensure we have a graphics layer
    if (!this.shadowLayer) {
      this.shadowLayer = new CanvasGraphicsLayer();
      this.shadowLayer.compositingStrategy = 'Offscreen';
    }

    const size = scope.size;
    const density = scope.density;
    const layoutDirection = scope.layoutDirection;

    // Calculate shadow dimensions
    const radius = shadow.radius;
    const offsetX = shadow.offsetX;
    const offsetY = shadow.offsetY;
    const padding = getShadowPadding(shadow);

    // Shadow layer size must accommodate blur spread + offset
    const shadowWidth = Math.ceil(size.width + radius * 4 + Math.abs(offsetX));
    const shadowHeight = Math.ceil(size.height + radius * 4 + Math.abs(offsetY));

    // Generate outline from shape
    const outline = shapeProvider.shape.createOutline(
      size,
      layoutDirection,
      { density, fontScale: scope.fontScale }
    );

    // Configure shadow layer
    this.shadowLayer.alpha = shadow.alpha;
    this.shadowLayer.blendMode = shadow.blendMode as GlobalCompositeOperation;
    this.shadowLayer.topLeft = { x: 0, y: 0 };

    // Record shadow into offscreen layer
    this.shadowLayer.record(
      { width: shadowWidth, height: shadowHeight },
      (recordScope) => {
        const ctx = recordScope.canvas as CanvasRenderingContext2D;

        // Translate to account for blur padding and offset
        ctx.save();
        ctx.translate(radius * 2 + offsetX, radius * 2 + offsetY);

        // Configure paint for shadow
        ctx.fillStyle = shadow.color;
        ctx.strokeStyle = shadow.color;
        
        // Apply blur
        if (radius > 0) {
          ctx.filter = `blur(${radius}px)`;
        }

        // Draw the shape (creates blurred silhouette)
        drawOutline(ctx, outline);

        // Fill the shape for solid shadow base
        ctx.fill();

        // Now erase the center using Clear blend mode
        ctx.save();
        ctx.globalCompositeOperation = SHADOW_MASK_PAINT.blendMode as GlobalCompositeOperation;
        
        // Translate back by offset to align mask with original position
        ctx.translate(-offsetX, -offsetY);
        drawOutline(ctx, outline);
        ctx.fill();
        
        ctx.restore();
        ctx.restore();
      }
    );

    // Draw shadow layer onto main canvas
    const mainCtx = scope.canvas as CanvasRenderingContext2D;
    mainCtx.save();
    
    // Translate negatively to center the shadow
    mainCtx.translate(-radius * 2, -radius * 2);
    this.shadowLayer.drawTo(mainCtx);
    
    mainCtx.restore();

    // Draw content on top of shadow
    drawContent();
  }

  /**
   * Release resources.
   */
  release(): void {
    this.shadowLayer?.release();
    this.shadowLayer = null;
  }
}

// ============================================================================
// CSS SHADOW (FALLBACK)
// ============================================================================

/**
 * Apply shadow using CSS box-shadow as fallback.
 * Much better performance than canvas rendering when applicable.
 * 
 * @param element - The DOM element
 * @param shadow - Shadow configuration
 */
export function shadowCSS(
  element: HTMLElement,
  shadow: Shadow | null
): void {
  if (!shadow || shadow.radius <= 0 || shadow.alpha <= 0) {
    element.style.boxShadow = '';
    return;
  }

  const { radius, offsetX, offsetY, color, alpha } = shadow;

  // CSS box-shadow: offsetX offsetY blurRadius spreadRadius color
  element.style.boxShadow = `
    ${offsetX}px ${offsetY}px ${radius}px ${radius / 2}px ${color}
  `;

  // Apply alpha via opacity on a pseudo-element if needed
  if (alpha < 1) {
    element.style.setProperty('--shadow-opacity', String(alpha));
  }
}

/**
 * Apply shadow using CSS filter drop-shadow.
 * Alternative to box-shadow that follows the element's shape.
 * 
 * @param element - The DOM element
 * @param shadow - Shadow configuration
 */
export function shadowCSSDropShadow(
  element: HTMLElement,
  shadow: Shadow | null
): void {
  if (!shadow || shadow.radius <= 0 || shadow.alpha <= 0) {
    element.style.filter = element.style.filter?.replace(
      /drop-shadow\([^)]*\)/g, ''
    ).trim() || '';
    return;
  }

  const { radius, offsetX, offsetY, color } = shadow;
  const dropShadow = `drop-shadow(${offsetX}px ${offsetY}px ${radius}px ${color})`;

  // Append to existing filter
  const existingFilter = element.style.filter && element.style.filter !== 'none'
    ? element.style.filter.replace(/drop-shadow\([^)]*\)/g, '').trim()
    : '';

  element.style.filter = existingFilter
    ? `${existingFilter} ${dropShadow}`
    : dropShadow;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a shadow renderer.
 */
export function createShadowRenderer(): ShadowRenderer {
  return new ShadowRenderer();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ShadowRenderer;
