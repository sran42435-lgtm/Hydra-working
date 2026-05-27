/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.Backdrop.kt
   Licensed under Apache License, Version 2.0
*/

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Equivalent to Android's Density interface
 */
export interface Density {
  density: number;
  fontScale: number;
}

/**
 * Equivalent to Android's LayoutCoordinates
 * Simplified for web - represents element position & size
 */
export interface LayoutCoordinates {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isAttached: boolean;
  
  /**
   * Get local position of another coordinate relative to this one
   */
  localPositionOf(other: LayoutCoordinates): { x: number; y: number };
  
  /**
   * Get position in window coordinates
   */
  positionInWindow(): { x: number; y: number };
}

/**
 * Equivalent to Android's DrawScope
 * Web canvas rendering context
 */
export interface DrawScope {
  readonly canvas: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext;
  readonly size: { width: number; height: number };
  readonly density: number;
  readonly fontScale: number;
  readonly layoutDirection: 'Ltr' | 'Rtl';
  
  // Transform methods
  translate(x: number, y: number): void;
  scale(sx: number, sy: number, pivot?: { x: number; y: number }): void;
  rotate(degrees: number, pivot?: { x: number; y: number }): void;
  
  // State management
  save(): void;
  restore(): void;
  
  // Clipping
  clipRect(x: number, y: number, width: number, height: number): void;
  clipPath(path: Path2D): void;
  clipOutline(outline: Outline): void;
}

/**
 * Equivalent to Android's GraphicsLayerScope
 * Configuration for graphics layer rendering
 */
export interface GraphicsLayerScope {
  alpha?: number;
  translationX?: number;
  translationY?: number;
  scaleX?: number;
  scaleY?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  clip?: boolean;
  shape?: Shape;
  blendMode?: BlendMode;
  renderEffect?: RenderEffect;
  compositingStrategy?: 'Auto' | 'Offscreen';
}

/**
 * Shape definition
 */
export interface Shape {
  createOutline(
    size: { width: number; height: number },
    layoutDirection: 'Ltr' | 'Rtl',
    density: Density
  ): Outline;
}

/**
 * Outline types
 */
export type Outline = 
  | { type: 'Rectangle'; x: number; y: number; width: number; height: number }
  | { type: 'Rounded'; x: number; y: number; width: number; height: number; radii: Float32Array }
  | { type: 'Generic'; path: Path2D };

/**
 * Blend modes (subset of CSS/Canvas blend modes)
 */
export enum BlendMode {
  SrcOver = 'source-over',
  SrcIn = 'source-in',
  SrcOut = 'source-out',
  SrcAtop = 'source-atop',
  DstOver = 'destination-over',
  DstIn = 'destination-in',
  DstOut = 'destination-out',
  DstAtop = 'destination-atop',
  Clear = 'clear',
  Plus = 'lighter',  // Additive blending
  Multiply = 'multiply',
  Screen = 'screen',
  Overlay = 'overlay',
  Darken = 'darken',
  Lighten = 'lighten',
  ColorDodge = 'color-dodge',
  ColorBurn = 'color-burn',
  HardLight = 'hard-light',
  SoftLight = 'soft-light',
  Difference = 'difference',
  Exclusion = 'exclusion',
}

/**
 * Render effect (simplified for web)
 */
export interface RenderEffect {
  readonly type: string;
}

// ============================================================================
// BACKDROP INTERFACE
// ============================================================================

/**
 * Core Backdrop interface - exact 1:1 port from Android
 * 
 * A Backdrop is a visual element that can be drawn behind content,
 * similar to a background but with advanced rendering capabilities
 * like shader effects, blur, and refraction.
 */
export interface Backdrop {
  /**
   * Whether this backdrop depends on layout coordinates.
   * If true, the backdrop will be re-rendered when position/size changes.
   */
  readonly isCoordinatesDependent: boolean;

  /**
   * Draw the backdrop into the given DrawScope.
   * 
   * @param scope - The draw scope to render into
   * @param density - Current density/scaling factor
   * @param coordinates - Optional layout coordinates for position-dependent backdrops
   * @param layerBlock - Optional graphics layer configuration
   */
  drawBackdrop(
    scope: DrawScope,
    density: Density,
    coordinates: LayoutCoordinates | null,
    layerBlock?: (GraphicsLayerScope) => void
  ): void;
}

// ============================================================================
// BACKDROP DECORATOR (from backdrops/Backdrop.kt)
// ============================================================================

/**
 * Creates a Backdrop decorator that intercepts draw calls.
 * Port of rememberBackdrop() from backdrops/Backdrop.kt
 * 
 * This allows wrapping a backdrop with custom draw interceptor logic,
 * useful for applying transformations or additional effects.
 * 
 * @param backdrop - The original backdrop to decorate
 * @param onDraw - Interceptor callback that receives the draw scope and original draw function
 * @returns A new Backdrop with the interceptor applied
 */
export function createBackdropDecorator(
  backdrop: Backdrop,
  onDraw: (scope: DrawScope, drawBackdrop: () => void) => void
): Backdrop {
  return {
    get isCoordinatesDependent(): boolean {
      return backdrop.isCoordinatesDependent;
    },

    drawBackdrop(
      scope: DrawScope,
      density: Density,
      coordinates: LayoutCoordinates | null,
      layerBlock?: (GraphicsLayerScope) => void
    ): void {
      onDraw(scope, () => {
        backdrop.drawBackdrop(scope, density, coordinates, layerBlock);
      });
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create default density (1x scale)
 */
export function createDefaultDensity(): Density {
  return { density: 1, fontScale: 1 };
}

/**
 * Create a default draw scope for canvas 2D
 */
export function createCanvasDrawScope(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): DrawScope {
  return {
    canvas: ctx,
    size: { width, height },
    density: window.devicePixelRatio || 1,
    fontScale: 1,
    layoutDirection: document.dir === 'rtl' ? 'Rtl' : 'Ltr',

    translate(x: number, y: number): void {
      ctx.translate(x, y);
    },

    scale(sx: number, sy: number, pivot?: { x: number; y: number }): void {
      if (pivot) {
        ctx.translate(pivot.x, pivot.y);
        ctx.scale(sx, sy);
        ctx.translate(-pivot.x, -pivot.y);
      } else {
        ctx.scale(sx, sy);
      }
    },

    rotate(degrees: number, pivot?: { x: number; y: number }): void {
      const radians = (degrees * Math.PI) / 180;
      if (pivot) {
        ctx.translate(pivot.x, pivot.y);
        ctx.rotate(radians);
        ctx.translate(-pivot.x, -pivot.y);
      } else {
        ctx.rotate(radians);
      }
    },

    save(): void {
      ctx.save();
    },

    restore(): void {
      ctx.restore();
    },

    clipRect(x: number, y: number, width: number, height: number): void {
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
    },

    clipPath(path: Path2D): void {
      ctx.clip(path);
    },

    clipOutline(outline: Outline): void {
      switch (outline.type) {
        case 'Rectangle':
          ctx.beginPath();
          ctx.rect(outline.x, outline.y, outline.width, outline.height);
          ctx.clip();
          break;
        case 'Rounded':
          // Use roundRect if available (Chrome 99+), fallback to path
          if ('roundRect' in ctx) {
            ctx.beginPath();
            (ctx as any).roundRect(
              outline.x, outline.y,
              outline.width, outline.height,
              Array.from(outline.radii)
            );
            ctx.clip();
          }
          break;
        case 'Generic':
          ctx.clip(outline.path);
          break;
      }
    },
  };
}

/**
 * Create default graphics layer scope
 */
export function createDefaultGraphicsLayerScope(): GraphicsLayerScope {
  return {
    alpha: 1,
    translationX: 0,
    translationY: 0,
    scaleX: 1,
    scaleY: 1,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    clip: false,
    blendMode: BlendMode.SrcOver,
    compositingStrategy: 'Auto',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Backdrop;
