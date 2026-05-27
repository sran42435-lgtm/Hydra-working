// frontend/src/components/ui/FloatingGlassButton.tsx

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  DrawBackdropNode, 
  drawBackdrop,
  createCanvasDrawScope,
  emptyBackdrop,
  blur,
  vibrancy,
  lens,
  Highlight,
  Shadow,
  InnerShadow,
  ShapeProvider,
  createRoundedShapeProvider,
  BackdropEffectScopeImpl,
  DrawScope,
} from '../../liquid-glass';

// ============================================================================
// TYPES
// ============================================================================

interface FloatingGlassButtonProps {
  /** Button size in pixels (width & height) */
  size?: number;
  /** Press handler */
  onPress: () => void;
  /** Visual preset */
  preset?: 'crystal' | 'frosted' | 'premium' | 'minimal';
  /** Lens distortion intensity (0-1) */
  distortionIntensity?: number;
  /** Optional additional styles */
  style?: React.CSSProperties;
  /** Children (icon) */
  children: React.ReactNode;
  /** Optional className */
  className?: string;
}

// ============================================================================
// PRESETS
// ============================================================================

interface GlassPreset {
  blurRadius: number;
  opacity: number;
  highlight: Highlight;
  shadow: Shadow;
  innerShadow: InnerShadow | null;
  refractionHeight: number;
  refractionAmount: number;
  chromaticAberration: boolean;
  depthEffect: boolean;
  backgroundColor: string;
}

const PRESETS: Record<string, GlassPreset> = {
  crystal: {
    blurRadius: 28,
    opacity: 0.25,
    highlight: Highlight.iOS,
    shadow: Shadow.iOS,
    innerShadow: InnerShadow.iOS,
    refractionHeight: 24,
    refractionAmount: 10,
    chromaticAberration: true,
    depthEffect: true,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  frosted: {
    blurRadius: 22,
    opacity: 0.35,
    highlight: Highlight.Default,
    shadow: Shadow.Default,
    innerShadow: null,
    refractionHeight: 16,
    refractionAmount: 6,
    chromaticAberration: false,
    depthEffect: true,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  premium: {
    blurRadius: 32,
    opacity: 0.2,
    highlight: Highlight.Strong,
    shadow: Shadow.Elevated,
    innerShadow: InnerShadow.Deep,
    refractionHeight: 32,
    refractionAmount: 14,
    chromaticAberration: true,
    depthEffect: true,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  minimal: {
    blurRadius: 12,
    opacity: 0.4,
    highlight: Highlight.Subtle,
    shadow: Shadow.Close,
    innerShadow: null,
    refractionHeight: 8,
    refractionAmount: 3,
    chromaticAberration: false,
    depthEffect: false,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
};

// ============================================================================
// FLOATING GLASS BUTTON COMPONENT
// ============================================================================

export const FloatingGlassButton: React.FC<FloatingGlassButtonProps> = ({
  size = 48,
  onPress,
  preset = 'crystal',
  distortionIntensity = 0.7,
  style,
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassNodeRef = useRef<DrawBackdropNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const config = PRESETS[preset];
  const actualSize = size;
  const padding = Math.max(config.blurRadius, config.refractionHeight);
  const canvasSize = actualSize + padding * 2;

  // ==========================================================================
  // GLASS INITIALIZATION
  // ==========================================================================

  const initGlass = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get WebGL context for shader effects
    const gl = canvas.getContext('webgl2', { 
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    }) || canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });

    // Create shape provider with circular shape
    const cornerRadius = actualSize / 2; // Perfect circle
    const shapeProvider = new ShapeProvider(() => 
      createRoundedShapeProvider(cornerRadius).innerShape
    );

    // Create backdrop node
    const node = drawBackdrop({
      backdrop: emptyBackdrop(),
      shape: () => shapeProvider,
      effects: (scope: BackdropEffectScopeImpl) => {
        // Apply blur for frosted glass base
        blur(scope, config.blurRadius * distortionIntensity);
        
        // Apply vibrancy for iOS-style color boost
        if (preset !== 'minimal') {
          vibrancy(scope);
        }

        // Apply lens refraction with SDF shader
        if (config.refractionHeight > 0 && config.refractionAmount > 0 && gl) {
          lens(
            scope,
            config.refractionHeight * distortionIntensity,
            config.refractionAmount * distortionIntensity,
            {
              depthEffect: config.depthEffect,
              chromaticAberration: config.chromaticAberration,
            },
          );
        }
      },
      highlight: () => config.highlight,
      shadow: () => config.shadow,
      innerShadow: () => config.innerShadow,
      gl: gl || undefined,
    });

    node.attach();
    glassNodeRef.current = node;
  }, [actualSize, config, distortionIntensity, preset]);

  // ==========================================================================
  // RENDER LOOP
  // ==========================================================================

  const renderGlass = useCallback(() => {
    const canvas = canvasRef.current;
    const node = glassNodeRef.current;
    if (!canvas || !node) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Create draw scope
    const scope = createCanvasDrawScope(ctx, canvasSize, canvasSize);

    // Apply animation scale
    const scale = isPressed ? 0.92 : isHovered ? 1.05 : 1.0;
    
    ctx.save();
    ctx.translate(canvasSize / 2, canvasSize / 2);
    ctx.scale(scale, scale);
    ctx.translate(-canvasSize / 2, -canvasSize / 2);

    // Draw glass
    node.draw(scope, () => {
      // Draw the circular background
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, actualSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = config.backgroundColor;
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();

    // Continue render loop
    animationFrameRef.current = requestAnimationFrame(renderGlass);
  }, [canvasSize, actualSize, isPressed, isHovered, config.backgroundColor]);

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  useEffect(() => {
    initGlass();
    
    // Start render loop
    animationFrameRef.current = requestAnimationFrame(renderGlass);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      glassNodeRef.current?.detach();
      glassNodeRef.current = null;
    };
  }, [initGlass, renderGlass]);

  // Re-render on state changes
  useEffect(() => {
    if (glassNodeRef.current) {
      // Force re-render
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(renderGlass);
    }
  }, [isPressed, isHovered, renderGlass]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsPressed(true);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsPressed(false);
    onPress();
  }, [onPress]);

  const handlePointerLeave = useCallback(() => {
    setIsPressed(false);
    setIsHovered(false);
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div
      ref={containerRef}
      className={className}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      style={{
        position: 'relative',
        width: actualSize,
        height: actualSize,
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isPressed ? 'scale(0.92)' : isHovered ? 'scale(1.05)' : 'scale(1)',
        ...style,
      }}
    >
      {/* Glass Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          position: 'absolute',
          top: -padding,
          left: -padding,
          width: canvasSize,
          height: canvasSize,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content Layer (icon) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          color: '#1a1a1a',
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease',
          opacity: isPressed ? 0.7 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default FloatingGlassButton;
