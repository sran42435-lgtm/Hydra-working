/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.backdrops.CanvasBackdrop.kt
   Licensed under Apache License, Version 2.0
*/

import { Backdrop, DrawScope, Density, LayoutCoordinates, GraphicsLayerScope } from '../core/Backdrop';

// ============================================================================
// CANVAS BACKDROP
// ============================================================================

/**
 * A backdrop that renders custom drawing commands.
 * Port of CanvasBackdrop class.
 * 
 * This is the simplest functional backdrop - it executes arbitrary
 * drawing commands on the canvas when rendered.
 * 
 * @example
 * ```typescript
 * const backdrop = canvasBackdrop((scope) => {
 *   const ctx = scope.canvas as CanvasRenderingContext2D;
 *   ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
 *   ctx.fillRect(0, 0, scope.size.width, scope.size.height);
 * });
 * ```
 */
class CanvasBackdropImpl implements Backdrop {
  readonly isCoordinatesDependent: boolean = false;

  private onDraw: (scope: DrawScope) => void;

  /**
   * @param onDraw - Custom drawing function executed on render
   */
  constructor(onDraw: (scope: DrawScope) => void) {
    this.onDraw = onDraw;
  }

  drawBackdrop(
    scope: DrawScope,
    _density: Density,
    _coordinates: LayoutCoordinates | null,
    _layerBlock?: (GraphicsLayerScope) => void
  ): void {
    this.onDraw(scope);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a canvas backdrop with custom drawing commands.
 * Port of rememberCanvasBackdrop() composable function.
 * 
 * @param onDraw - Custom drawing function that receives the draw scope
 * @returns A Backdrop that renders the custom drawing
 */
export function canvasBackdrop(
  onDraw: (scope: DrawScope) => void
): Backdrop {
  return new CanvasBackdropImpl(onDraw);
}

/**
 * Create a solid color backdrop.
 * Convenience wrapper around canvasBackdrop.
 * 
 * @param color - CSS color string
 * @returns A Backdrop that fills with solid color
 */
export function solidColorBackdrop(color: string): Backdrop {
  return canvasBackdrop((scope) => {
    const ctx = scope.canvas as CanvasRenderingContext2D;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, scope.size.width, scope.size.height);
  });
}

/**
 * Create a gradient backdrop.
 * Convenience wrapper around canvasBackdrop.
 * 
 * @param gradientFactory - Function that creates a CanvasGradient
 * @returns A Backdrop that fills with the gradient
 */
export function gradientBackdrop(
  gradientFactory: (scope: DrawScope) => CanvasGradient
): Backdrop {
  return canvasBackdrop((scope) => {
    const ctx = scope.canvas as CanvasRenderingContext2D;
    const gradient = gradientFactory(scope);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, scope.size.width, scope.size.height);
  });
}

/**
 * Create an image backdrop.
 * Convenience wrapper around canvasBackdrop.
 * 
 * @param image - HTMLImageElement or URL string
 * @param fit - How the image should fit ('fill' | 'contain' | 'cover')
 * @returns A Backdrop that renders the image
 */
export function imageBackdrop(
  image: HTMLImageElement | string,
  fit: 'fill' | 'contain' | 'cover' = 'cover'
): Backdrop {
  let imgElement: HTMLImageElement | null = null;
  
  if (typeof image === 'string') {
    imgElement = new Image();
    imgElement.src = image;
  } else {
    imgElement = image;
  }

  return canvasBackdrop((scope) => {
    const ctx = scope.canvas as CanvasRenderingContext2D;
    const { width, height } = scope.size;
    const img = imgElement!;

    if (!img.complete) return;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawWidth: number, drawHeight: number;
    let drawX: number, drawY: number;

    switch (fit) {
      case 'contain':
        if (imgRatio > canvasRatio) {
          drawWidth = width;
          drawHeight = width / imgRatio;
          drawX = 0;
          drawY = (height - drawHeight) / 2;
        } else {
          drawHeight = height;
          drawWidth = height * imgRatio;
          drawX = (width - drawWidth) / 2;
          drawY = 0;
        }
        break;

      case 'cover':
        if (imgRatio > canvasRatio) {
          drawHeight = height;
          drawWidth = height * imgRatio;
          drawX = (width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = width;
          drawHeight = width / imgRatio;
          drawX = 0;
          drawY = (height - drawHeight) / 2;
        }
        break;

      case 'fill':
      default:
        drawWidth = width;
        drawHeight = height;
        drawX = 0;
        drawY = 0;
        break;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default canvasBackdrop;
