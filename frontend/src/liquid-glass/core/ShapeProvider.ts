/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Original Android source: com.kyant.backdrop.ShapeProvider.kt
   Licensed under Apache License, Version 2.0
*/

import { Density } from './Backdrop';
import { Outline, createRoundedRectPath } from './Outline';

// ============================================================================
// SHAPE INTERFACE
// ============================================================================

/**
 * Shape interface - represents a geometric shape that can produce outlines.
 * Port of Android's Shape abstract class.
 */
export interface Shape {
  /**
   * Create an outline for this shape at the given size.
   * 
   * @param size - The size to fit the shape into
   * @param layoutDirection - Layout direction (LTR/RTL)
   * @param density - Current density for pixel calculations
   * @returns Outline that can be used for clipping or drawing
   */
  createOutline(
    size: { width: number; height: number },
    layoutDirection: 'Ltr' | 'Rtl',
    density: Density
  ): Outline;
}

// ============================================================================
// SHAPE IMPLEMENTATIONS
// ============================================================================

/**
 * Rectangle shape.
 */
export class RectangleShape implements Shape {
  createOutline(
    size: { width: number; height: number },
    _layoutDirection: 'Ltr' | 'Rtl',
    _density: Density
  ): Outline {
    return {
      type: 'Rectangle',
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
    };
  }
}

/**
 * Rounded rectangle shape with per-corner radii.
 * 
 * Radii order: [topLeft, topRight, bottomRight, bottomLeft]
 */
export class RoundedRectShape implements Shape {
  constructor(
    private topLeft: number = 0,
    private topRight: number = 0,
    private bottomRight: number = 0,
    private bottomLeft: number = 0
  ) {}

  /**
   * Create a rounded rect shape with uniform radius.
   */
  static uniform(radius: number): RoundedRectShape {
    return new RoundedRectShape(radius, radius, radius, radius);
  }

  createOutline(
    size: { width: number; height: number },
    layoutDirection: 'Ltr' | 'Rtl',
    _density: Density
  ): Outline {
    const maxRadius = Math.min(size.width, size.height) / 2;
    
    // Swap radii for RTL layout
    let tl = this.topLeft;
    let tr = this.topRight;
    let br = this.bottomRight;
    let bl = this.bottomLeft;

    if (layoutDirection === 'Rtl') {
      [tl, tr] = [tr, tl];
      [bl, br] = [br, bl];
    }

    return {
      type: 'Rounded',
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      radii: new Float32Array([
        Math.min(tl, maxRadius),
        Math.min(tr, maxRadius),
        Math.min(br, maxRadius),
        Math.min(bl, maxRadius),
      ]),
    };
  }
}

/**
 * Generic path-based shape.
 */
export class PathShape implements Shape {
  constructor(private pathFactory: (size: { width: number; height: number }) => Path2D) {}

  createOutline(
    size: { width: number; height: number },
    _layoutDirection: 'Ltr' | 'Rtl',
    _density: Density
  ): Outline {
    return {
      type: 'Generic',
      path: this.pathFactory(size),
    };
  }
}

// ============================================================================
// SHAPE PROVIDER
// ============================================================================

/**
 * Smart shape caching provider.
 * Port of ShapeProvider class.
 * 
 * Caches the computed outline and only recalculates when:
 * - Shape factory produces a different shape
 * - Size changes
 * - Layout direction changes
 * - Density changes
 */
export class ShapeProvider {
  private shapeFactory: () => Shape;

  // Cache state
  private cachedShape: Shape | null = null;
  private cachedOutline: Outline | null = null;
  private cachedSize: { width: number; height: number } = { width: 0, height: 0 };
  private cachedLayoutDirection: 'Ltr' | 'Rtl' | null = null;
  private cachedDensity: number | null = null;

  /**
   * @param shapeFactory - Function that returns the current Shape.
   *                       Called each time to allow dynamic shape changes.
   */
  constructor(shapeFactory: () => Shape) {
    this.shapeFactory = shapeFactory;
  }

  /**
   * Get the inner shape directly (without caching).
   * Port of ShapeProvider.innerShape
   */
  get innerShape(): Shape {
    return this.shapeFactory();
  }

  /**
   * Get a Shape object with cached outline creation.
   * Port of ShapeProvider.shape (anonymous Shape object)
   * 
   * Returns a Shape whose createOutline() method caches results
   * and only recalculates when necessary.
   */
  get shape(): Shape {
    // Capture 'this' for the closure
    const provider = this;

    return {
      createOutline(
        size: { width: number; height: number },
        layoutDirection: 'Ltr' | 'Rtl',
        density: Density
      ): Outline {
        const currentShape = provider.shapeFactory();

        // Check if shape instance changed
        if (provider.cachedShape !== currentShape) {
          provider.cachedShape = currentShape;
          provider.cachedOutline = null;
        }

        // Check if parameters changed
        if (
          provider.cachedOutline === null ||
          provider.cachedSize.width !== size.width ||
          provider.cachedSize.height !== size.height ||
          provider.cachedLayoutDirection !== layoutDirection ||
          provider.cachedDensity !== density.density
        ) {
          provider.cachedSize = { ...size };
          provider.cachedLayoutDirection = layoutDirection;
          provider.cachedDensity = density.density;
          provider.cachedOutline = currentShape.createOutline(size, layoutDirection, density);
        }

        return provider.cachedOutline!;
      },
    };
  }

  /**
   * Invalidate the cached outline.
   * Call when the shape needs to be recalculated.
   */
  invalidate(): void {
    this.cachedShape = null;
    this.cachedOutline = null;
  }

  /**
   * Update the shape factory function.
   */
  setShapeFactory(factory: () => Shape): void {
    if (this.shapeFactory !== factory) {
      this.shapeFactory = factory;
      this.invalidate();
    }
  }

  /**
   * Check if the shape is currently a rounded rectangle.
   * Useful for determining if SDF-based effects (lens) can be used.
   */
  isRoundedRect(): boolean {
    const shape = this.innerShape;
    return shape instanceof RoundedRectShape;
  }

  /**
   * Get corner radii if the shape is a rounded rectangle.
   * Returns null for non-rounded shapes.
   * 
   * Port of BackdropEffectScope.cornerRadii in Lens.kt
   */
  getCornerRadii(
    size: { width: number; height: number },
    layoutDirection: 'Ltr' | 'Rtl',
    density: Density
  ): Float32Array | null {
    const shape = this.innerShape;

    if (shape instanceof RoundedRectShape) {
      const outline = shape.createOutline(size, layoutDirection, density);
      if (outline.type === 'Rounded') {
        return outline.radii;
      }
    }

    // For generic path shapes, return null (unsupported)
    return null;
  }
}

// ============================================================================
// SHAPE FACTORY HELPERS
// ============================================================================

/**
 * Create a ShapeProvider from a CSS border-radius value.
 * 
 * @param radius - CSS border-radius in pixels
 */
export function createRoundedShapeProvider(radius: number): ShapeProvider {
  return new ShapeProvider(() => RoundedRectShape.uniform(radius));
}

/**
 * Create a ShapeProvider from individual corner radii.
 * [topLeft, topRight, bottomRight, bottomLeft]
 */
export function createCornerShapeProvider(
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number
): ShapeProvider {
  return new ShapeProvider(
    () => new RoundedRectShape(topLeft, topRight, bottomRight, bottomLeft)
  );
}

/**
 * Create a ShapeProvider from a CSS clip-path or border-radius string.
 * Parses common CSS formats.
 */
export function createCSSShapeProvider(cssBorderRadius: string): ShapeProvider {
  return new ShapeProvider(() => {
    const values = cssBorderRadius.split(/\s+/).map(parseFloat);
    
    if (values.length === 1) {
      return RoundedRectShape.uniform(values[0]);
    }
    if (values.length === 4) {
      return new RoundedRectShape(values[0], values[1], values[2], values[3]);
    }
    
    // Fallback: no rounding
    return new RectangleShape();
  });
}

/**
 * Create a rectangle ShapeProvider (no rounded corners).
 */
export function createRectangleShapeProvider(): ShapeProvider {
  return new ShapeProvider(() => new RectangleShape());
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ShapeProvider;
