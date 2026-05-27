/*
   Copyright 2025 - Pixel-Perfect Native Shader Porting
   Cross-Platform Rendering Recreation
   AGSL → GLSL/WebGL Shader Translation Pipeline
   
   Liquid Glass Web - Main Entry Point
   Licensed under Apache License, Version 2.0
*/

// ============================================================================
// CORE
// ============================================================================

export {
  // Interfaces
  type Backdrop,
  type DrawScope,
  type Density,
  type LayoutCoordinates,
  type GraphicsLayerScope,
  type Shape,
  type Outline,
  type RenderEffect,
  // Enums
  BlendMode,
  // Functions
  createBackdropDecorator,
  createDefaultDensity,
  createCanvasDrawScope,
  createDefaultGraphicsLayerScope,
} from './core/Backdrop';

export {
  type RuntimeShaderCache,
  RuntimeShaderCacheImpl,
  RuntimeShaderCacheWebGL2,
  createRuntimeShaderCache,
} from './core/RuntimeShaderCache';

export {
  type RectangleOutline,
  type RoundedOutline,
  type GenericOutline,
  createRectangleOutline,
  createRoundedOutline,
  createGenericOutline,
  clipOutline,
  drawOutline,
  createRoundedRectPath,
  isRoundRectSupported,
  cssRadiiToArray,
  clipOutlineWebGL,
} from './core/Outline';

export {
  type Shape as ShapeInterface,
  RectangleShape,
  RoundedRectShape,
  PathShape,
  ShapeProvider,
  createRoundedShapeProvider,
  createCornerShapeProvider,
  createCSSShapeProvider,
  createRectangleShapeProvider,
} from './core/ShapeProvider';

export {
  InverseLayerScope,
  invertMatrix2D,
  decomposeMatrix2D,
} from './core/InverseLayerScope';

export {
  type GraphicsLayer,
  CanvasGraphicsLayer,
  WebGLGraphicsLayer,
  recordLayer,
  createGraphicsLayer,
  createCanvasGraphicsLayer,
  createWebGLGraphicsLayer,
} from './core/LayerRecorder';

export {
  type BackdropEffectScope,
  BackdropEffectScopeImpl,
  BlurRenderEffect,
  ColorFilterRenderEffect,
  RuntimeShaderRenderEffect,
  ChainRenderEffect,
} from './core/BackdropEffectScope';

export {
  Shaders,
  ShaderCompiler,
  DefaultVertexShader,
  type RefractionUniforms,
  type DispersionUniforms,
  type HighlightUniforms,
  type AmbientHighlightUniforms,
  type GammaUniforms,
} from './core/Shaders';

export {
  DrawBackdropNode,
  drawBackdrop,
  drawPlainBackdrop,
  type DrawBackdropOptions,
} from './core/DrawBackdropModifier';

// ============================================================================
// BACKDROPS
// ============================================================================

export {
  emptyBackdrop,
} from './backdrops/EmptyBackdrop';

export {
  canvasBackdrop,
  solidColorBackdrop,
  gradientBackdrop,
  imageBackdrop,
} from './backdrops/CanvasBackdrop';

export {
  combinedBackdrop,
  combinedBackdrop3,
  combinedBackdrops,
  combineBackdrops,
  BackdropBuilder,
} from './backdrops/CombinedBackdrop';

export {
  LayerBackdrop,
  layerBackdrop,
  webglLayerBackdrop,
} from './backdrops/LayerBackdrop';

export {
  layerBackdropModifier,
  LayerBackdropElement,
  useLayerBackdrop,
  type LayerBackdropConfig,
} from './backdrops/LayerBackdropModifier';

// ============================================================================
// EFFECTS
// ============================================================================

export {
  BlurEffect,
  ColorFilterEffect,
  RuntimeShaderEffect,
  ChainEffect,
  OffsetEffect,
  addEffect,
  createEffect,
  chainEffects,
  applyEffect,
} from './effects/RenderEffect';

export {
  blur,
  blurAsymmetric,
  blurProgressive,
  backdropBlurCSS,
  removeBackdropBlur,
  elementBlurCSS,
  blurIOS,
  blurLight,
  blurMedium,
  blurHeavy,
  blurNone,
  isBackdropFilterSupported,
  isCanvasFilterSupported,
  type TileMode,
} from './effects/Blur';

export {
  colorFilter,
  opacity,
  colorControls,
  colorControlsMatrix,
  vibrancy,
  exposureAdjustment,
  gammaAdjustment,
  grayscale,
  sepia,
  hueRotate,
  invert,
  colorFilterIOS,
  darkTint,
  lightTint,
  monochromeGlass,
} from './effects/ColorFilter';

export {
  lens,
  lensSubtle,
  lensStandard,
  lensPremium,
  lensExtreme,
  lensCSS,
  LensBuilder,
} from './effects/Lens';

// ============================================================================
// HIGHLIGHT & SHADOW
// ============================================================================

export {
  Highlight,
  HighlightBuilder,
  createHighlight,
  isHighlightVisible,
  lerpHighlight,
} from './highlight/Highlight';

export {
  type HighlightStyle,
  HighlightStylePlain,
  HighlightStyleDefault,
  HighlightStyleAmbient,
  HighlightStyleCustom,
  HighlightStyles,
} from './highlight/HighlightStyle';

export {
  HighlightRenderer,
  createHighlightRenderer,
  highlightCSS,
} from './highlight/HighlightModifier';

export {
  Shadow,
  ShadowBuilder,
  createShadow,
  isShadowVisible,
  getShadowPadding,
  lerpShadow,
} from './shadow/Shadow';

export {
  ShadowRenderer,
  createShadowRenderer,
  shadowCSS,
  shadowCSSDropShadow,
} from './shadow/ShadowModifier';

export {
  InnerShadow,
  InnerShadowBuilder,
  createInnerShadow,
  isInnerShadowVisible,
  getInnerShadowPadding,
  lerpInnerShadow,
} from './shadow/InnerShadow';

export {
  InnerShadowRenderer,
  createInnerShadowRenderer,
  innerShadowCSS,
  innerShadowGradient,
} from './shadow/InnerShadowModifier';

// ============================================================================
// LIQUID GLASS COMPONENT
// ============================================================================

/**
 * Complete Liquid Glass configuration for a UI element.
 * Combines all aspects of the glass effect into one interface.
 */
export interface LiquidGlassConfig {
  /** Backdrop content (what appears behind the glass) */
  backdrop: Backdrop;
  
  /** Shape/corner radius configuration */
  shape: () => ShapeProvider;
  
  /** Effects pipeline */
  effects?: (scope: BackdropEffectScopeImpl) => void;
  
  /** Highlight configuration */
  highlight?: Highlight | null;
  
  /** Drop shadow configuration */
  shadow?: Shadow | null;
  
  /** Inner shadow configuration */
  innerShadow?: InnerShadow | null;
  
  /** Layer block for advanced compositing */
  layerBlock?: GraphicsLayerScope;
  
  /** Draw behind callback */
  onDrawBehind?: (scope: DrawScope) => void;
  
  /** Draw surface callback */
  onDrawSurface?: (scope: DrawScope) => void;
  
  /** Draw front callback */
  onDrawFront?: (scope: DrawScope) => void;
  
  /** WebGL context for shader effects */
  gl?: WebGLRenderingContext | WebGL2RenderingContext;
}

/**
 * Create a fully configured DrawBackdropNode from LiquidGlassConfig.
 * This is the simplest way to integrate liquid glass into any element.
 * 
 * @example
 * ```typescript
 * const glass = createLiquidGlass({
 *   backdrop: solidColorBackdrop('rgba(255,255,255,0.1)'),
 *   shape: () => createRoundedShapeProvider(16),
 *   effects: (scope) => {
 *     blur(scope, 20);
 *     vibrancy(scope);
 *     lens(scope, 20, 8, { depthEffect: true }, shaderCache);
 *   },
 *   highlight: Highlight.iOS,
 *   shadow: Shadow.iOS,
 * });
 * 
 * // Attach to element
 * glass.attach();
 * 
 * // In render loop:
 * glass.draw(scope, () => drawYourContent());
 * ```
 */
export function createLiquidGlass(config: LiquidGlassConfig): DrawBackdropNode {
  return drawBackdrop({
    backdrop: config.backdrop,
    shape: config.shape,
    effects: config.effects || (() => {}),
    highlight: config.highlight !== undefined ? () => config.highlight! : undefined,
    shadow: config.shadow !== undefined ? () => config.shadow! : undefined,
    innerShadow: config.innerShadow !== undefined ? () => config.innerShadow! : undefined,
    layerBlock: config.layerBlock,
    onDrawBehind: config.onDrawBehind,
    onDrawSurface: config.onDrawSurface,
    onDrawFront: config.onDrawFront,
    gl: config.gl,
  });
}

// ============================================================================
// PRESETS
// ============================================================================

/**
 * Pre-built liquid glass configurations for common use cases.
 */
export const LiquidGlassPresets = {
  /**
   * iOS 26.5 style frosted glass.
   * Blur + vibrancy + subtle highlight + elevated shadow.
   */
  iOS: (cornerRadius: number = 20, gl?: WebGLRenderingContext | WebGL2RenderingContext): LiquidGlassConfig => ({
    backdrop: emptyBackdrop(),
    shape: () => createRoundedShapeProvider(cornerRadius),
    effects: (scope) => {
      blur(scope, 20);
      vibrancy(scope);
    },
    highlight: Highlight.iOS,
    shadow: Shadow.iOS,
    gl,
  }),

  /**
   * Premium glass with chromatic aberration lens effect.
   * Maximum visual quality, requires WebGL.
   */
  Premium: (cornerRadius: number = 20, gl?: WebGLRenderingContext | WebGL2RenderingContext): LiquidGlassConfig => ({
    backdrop: emptyBackdrop(),
    shape: () => createRoundedShapeProvider(cornerRadius),
    effects: (scope) => {
      blur(scope, 25);
      vibrancy(scope);
      lens(scope, 30, 12, { depthEffect: true, chromaticAberration: true });
    },
    highlight: Highlight.Strong,
    shadow: Shadow.Elevated,
    innerShadow: InnerShadow.iOS,
    gl,
  }),

  /**
   * Subtle glass - minimal effect, maximum performance.
   */
  Subtle: (cornerRadius: number = 12): LiquidGlassConfig => ({
    backdrop: emptyBackdrop(),
    shape: () => createRoundedShapeProvider(cornerRadius),
    effects: (scope) => {
      blur(scope, 8);
    },
    highlight: Highlight.Subtle,
    shadow: Shadow.Close,
  }),

  /**
   * Dark glass - for dark mode interfaces.
   */
  Dark: (cornerRadius: number = 20, gl?: WebGLRenderingContext | WebGL2RenderingContext): LiquidGlassConfig => ({
    backdrop: solidColorBackdrop('rgba(0, 0, 0, 0.3)'),
    shape: () => createRoundedShapeProvider(cornerRadius),
    effects: (scope) => {
      blur(scope, 20);
      darkTint(scope);
    },
    highlight: new Highlight(1.0, 0.5, 0.3),
    shadow: Shadow.Dark,
    gl,
  }),

  /**
   * Clear glass - transparent with just edges.
   */
  Clear: (cornerRadius: number = 16): LiquidGlassConfig => ({
    backdrop: emptyBackdrop(),
    shape: () => createRoundedShapeProvider(cornerRadius),
    effects: () => {},
    highlight: Highlight.Plain,
    shadow: Shadow.Light,
  }),
};

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '1.0.0';
export const NAME = '@kyant/liquid-glass';
export const DESCRIPTION = 'Pixel-Perfect Native Shader Porting - Liquid Glass for Web';

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export: createLiquidGlass function.
 * This is the primary API for most users.
 */
export default createLiquidGlass;
