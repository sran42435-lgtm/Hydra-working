/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.InverseLayerScope.kt
   Licensed under Apache License, Version 2.0
*/

import { GraphicsLayerScope, BlendMode } from './Backdrop';

// ============================================================================
// INVERSE LAYER SCOPE
// ============================================================================

/**
 * Default camera distance for 3D perspective transforms.
 * Port of Android's DefaultCameraDistance (8 * screen density).
 */
const DEFAULT_CAMERA_DISTANCE = 8.0;

/**
 * Default shadow color.
 * Port of Android's DefaultShadowColor.
 */
const DEFAULT_SHADOW_COLOR = { r: 0, g: 0, b: 0, a: 0.2 };

/**
 * Default transform origin (center of element).
 */
const DEFAULT_TRANSFORM_ORIGIN: TransformOrigin = { pivotX: 0.5, pivotY: 0.5 };

// ============================================================================
// TYPES
// ============================================================================

export interface TransformOrigin {
  pivotX: number; // 0-1 fraction
  pivotY: number; // 0-1 fraction
}

export interface Color {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

// ============================================================================
// INVERSE LAYER SCOPE IMPLEMENTATION
// ============================================================================

/**
 * Inverse Layer Scope - calculates inverse transforms for layer rendering.
 * 
 * When LayerBackdrop exports a rendered layer to another location,
 * any transformations applied to the source need to be inverted
 * at the destination to maintain correct positioning.
 * 
 * Port of InverseLayerScope class - exact 1:1 port.
 */
export class InverseLayerScope implements GraphicsLayerScope {
  // DrawTransform properties
  size: { width: number; height: number } = { width: 0, height: 0 };
  density: number = 1;
  fontScale: number = 1;

  // GraphicsLayerScope properties
  scaleX: number = 1;
  scaleY: number = 1;
  alpha: number = 1;
  translationX: number = 0;
  translationY: number = 0;
  shadowElevation: number = 0;
  ambientShadowColor: Color = { ...DEFAULT_SHADOW_COLOR };
  spotShadowColor: Color = { ...DEFAULT_SHADOW_COLOR };
  rotationX: number = 0;
  rotationY: number = 0;
  rotationZ: number = 0;
  cameraDistance: number = DEFAULT_CAMERA_DISTANCE;
  transformOrigin: TransformOrigin = { ...DEFAULT_TRANSFORM_ORIGIN };
  shape?: any = undefined;
  clip: boolean = false;
  renderEffect?: any = undefined;
  blendMode: BlendMode = BlendMode.SrcOver;
  colorFilter?: any = undefined;
  compositingStrategy: 'Auto' | 'Offscreen' = 'Auto';

  // Cached matrix for inverse calculation
  private matrix: DOMMatrix | null = null;

  /**
   * Apply inverse transform to a canvas context based on captured properties.
   * 
   * Port of InverseLayerScope.inverseTransform()
   * 
   * Usage:
   * ```
   * const scope = new InverseLayerScope();
   * scope.size = { width, height };
   * scope.density = density;
   * 
   * // Capture properties
   * scope.scaleX = 0.8;
   * scope.rotationZ = 45;
   * 
   * // Apply inverse to canvas
   * scope.applyInverseTransform(ctx);
   * ```
   * 
   * @param ctx - Canvas rendering context
   * @param density - Current density
   * @param layerBlock - Optional callback to capture properties first
   */
  applyInverseTransform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    density?: { density: number; fontScale: number },
    layerBlock?: (scope: GraphicsLayerScope) => void
  ): void {
    // Reset and capture if layerBlock provided
    if (layerBlock) {
      this.reset();
      if (density) {
        this.density = density.density;
        this.fontScale = density.fontScale;
      }
      layerBlock(this);
    }

    // Apply inverse transform at top-left origin
    this.inverseTransformAtTopLeft(ctx);
  }

  /**
   * Calculate and apply inverse transform to canvas context.
   * 
   * Port of InverseLayerScope.inverseTransformAtTopLeft()
   * 
   * Handles two cases:
   * 1. No rotation: Simple inverse scale
   * 2. With rotation: Matrix inverse calculation
   */
  private inverseTransformAtTopLeft(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  ): void {
    // Case 1: No rotation - simple inverse scale
    if (this.rotationZ === 0) {
      if (this.scaleX !== 0 && this.scaleY !== 0) {
        ctx.translate(0, 0); // Origin at top-left
        ctx.scale(1 / this.scaleX, 1 / this.scaleY);
      }
      return;
    }

    // Case 2: With rotation - calculate matrix inverse
    const matrix = this.matrix || new DOMMatrix();
    this.matrix = matrix;

    const rz = this.rotationZ * (Math.PI / 180);
    const rsz = Math.sin(rz);
    const rcz = Math.cos(rz);

    // Build the 2D transform matrix components
    // [a00 a01]
    // [a10 a11]
    const a00 = rcz * this.scaleX;
    const a01 = rsz * this.scaleY;
    const a10 = -rsz * this.scaleX;
    const a11 = rcz * this.scaleY;

    // Calculate determinant
    const det = a00 * a11 - a01 * a10;
    if (det === 0) return; // Singular matrix, cannot invert

    const invDet = 1 / det;

    // Set inverse matrix
    matrix.a = a11 * invDet;   // m00
    matrix.b = -a01 * invDet;  // m10 (note: DOMMatrix b is row1-col0)
    matrix.c = -a10 * invDet;  // m01 (note: DOMMatrix c is row0-col1)
    matrix.d = a00 * invDet;   // m11
    matrix.e = 0;              // m02 (translation x)
    matrix.f = 0;              // m12 (translation y)

    // Apply the inverse matrix
    // ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
    ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
  }

  /**
   * Reset all properties to default values.
   * Port of InverseLayerScope.reset()
   */
  reset(): void {
    this.size = { width: 0, height: 0 };
    this.density = 1;
    this.fontScale = 1;

    this.scaleX = 1;
    this.scaleY = 1;
    this.alpha = 1;
    this.translationX = 0;
    this.translationY = 0;
    this.shadowElevation = 0;
    this.ambientShadowColor = { ...DEFAULT_SHADOW_COLOR };
    this.spotShadowColor = { ...DEFAULT_SHADOW_COLOR };
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationZ = 0;
    this.cameraDistance = DEFAULT_CAMERA_DISTANCE;
    this.transformOrigin = { ...DEFAULT_TRANSFORM_ORIGIN };
    this.shape = undefined;
    this.clip = false;
    this.renderEffect = undefined;
    this.blendMode = BlendMode.SrcOver;
    this.colorFilter = undefined;
    this.compositingStrategy = 'Auto';

    this.matrix = null;
  }

  /**
   * Apply inverse as CSS transform string.
   * Useful for DOM-based inverse transforms.
   */
  toCSSInverseTransform(): string {
    if (this.rotationZ === 0) {
      if (this.scaleX !== 0 && this.scaleY !== 0) {
        return `scale(${1 / this.scaleX}, ${1 / this.scaleY})`;
      }
      return '';
    }

    const rz = this.rotationZ * (Math.PI / 180);
    const rsz = Math.sin(rz);
    const rcz = Math.cos(rz);

    const a00 = rcz * this.scaleX;
    const a01 = rsz * this.scaleY;
    const a10 = -rsz * this.scaleX;
    const a11 = rcz * this.scaleY;

    const det = a00 * a11 - a01 * a10;
    if (det === 0) return '';

    const invDet = 1 / det;
    const invA = a11 * invDet;
    const invB = -a01 * invDet;
    const invC = -a10 * invDet;
    const invD = a00 * invDet;

    return `matrix(${invA}, ${invB}, ${invC}, ${invD}, 0, 0)`;
  }

  /**
   * Capture current transform state from a canvas context.
   * Useful for snapshotting before applying inverse.
   */
  captureFromCanvas(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    elementWidth: number,
    elementHeight: number
  ): void {
    this.size = { width: elementWidth, height: elementHeight };

    // Note: Canvas doesn't expose current transform directly.
    // getTransform() is available in modern browsers.
    if ('getTransform' in ctx && typeof (ctx as any).getTransform === 'function') {
      const transform = (ctx as any).getTransform() as DOMMatrix;
      this.translationX = transform.e;
      this.translationY = transform.f;

      // Extract scale and rotation from matrix
      this.scaleX = Math.sqrt(transform.a * transform.a + transform.b * transform.b);
      this.scaleY = Math.sqrt(transform.c * transform.c + transform.d * transform.d);
      this.rotationZ = Math.atan2(transform.b, transform.a) * (180 / Math.PI);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the inverse of a 2D affine transform matrix.
 * 
 * Matrix format: [a, b, c, d, e, f]
 *   a = scaleX * cos(rotation)
 *   b = scaleX * sin(rotation)
 *   c = -scaleY * sin(rotation)
 *   d = scaleY * cos(rotation)
 *   e = translateX
 *   f = translateY
 */
export function invertMatrix2D(
  a: number, b: number, c: number, d: number, e: number, f: number
): { a: number; b: number; c: number; d: number; e: number; f: number } | null {
  const det = a * d - b * c;
  if (det === 0) return null;

  const invDet = 1 / det;
  return {
    a: d * invDet,
    b: -b * invDet,
    c: -c * invDet,
    d: a * invDet,
    e: (c * f - d * e) * invDet,
    f: (b * e - a * f) * invDet,
  };
}

/**
 * Decompose a 2D matrix into scale, rotation, and translation components.
 */
export function decomposeMatrix2D(
  a: number, b: number, c: number, d: number, e: number, f: number
): {
  scaleX: number;
  scaleY: number;
  rotation: number; // degrees
  translationX: number;
  translationY: number;
} {
  const scaleX = Math.sign(a) * Math.sqrt(a * a + b * b);
  const scaleY = Math.sign(d) * Math.sqrt(c * c + d * d);
  const rotation = Math.atan2(b, a) * (180 / Math.PI);

  return {
    scaleX,
    scaleY,
    rotation,
    translationX: e,
    translationY: f,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default InverseLayerScope;
