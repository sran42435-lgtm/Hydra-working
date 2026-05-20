// src/liquid-system/components/LiquidGlassButton/LiquidGlassButton.tsx

import React, { useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LiquidGlassButtonProps } from './LiquidGlassButton.types';
import { useRipple } from '../../hooks/useRipple';
import { useSurfacePhysics } from '../../hooks/useSurfacePhysics';
import { useGlassLighting } from '../../hooks/useGlassLighting';
import { glassPresets } from '../../materials/glass.presets';
import { glassSpring } from '../../physics/spring.config';
import { getRippleRadius } from '../../physics/ripple.physics';
import { OpticalGlassLayer } from '../OpticalGlassLayer';
import { RefractionPass } from '../../engine/renderer/RefractionPass';
import './LiquidGlassButton.css';

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  size = 44,
  onPress,
  style,
  className = '',
  preset = 'crystal',
  distortionIntensity = 0.7,
  active = false,
  springConfig = glassSpring,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { ripples, addRipple, removeRipple } = useRipple();
  const { onPointerDown, onPointerUp, getDeformation } = useSurfacePhysics();
  const lighting = useGlassLighting();
  const surfaceId = `glass-btn-${Math.random().toString(36).substr(2, 9)}`;

  const selectedPreset = glassPresets[preset];

  // PANGGIL CAPTURE BACKGROUND — ini kunci!
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    // Gunakan document.body atau parent container sebagai background
    const target = document.body; // atau el.closest('.chat-container')
    const refraction = new RefractionPass();
    refraction.captureBackground(surfaceId, target);
  }, [surfaceId]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      onPointerDown();
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addRipple(x, y);
    },
    [addRipple, onPointerDown]
  );

  const handlePointerUp = useCallback(() => {
    onPointerUp();
  }, [onPointerUp]);

  const deformation = getDeformation(0);
  const scale = 1 - deformation * 0.06;

  return (
    <motion.button
      ref={buttonRef}
      className={`liquid-glass-button ${className} ${active ? 'active' : ''}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={onPress}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      animate={{ scale }}
      transition={{
        type: 'spring',
        stiffness: springConfig.stiffness,
        damping: springConfig.damping,
        mass: springConfig.mass,
      }}
    >
      {/* Optical Glass Layer – REFRAKSI NYATA */}
      <OpticalGlassLayer
        surfaceId={surfaceId}
        width={size}
        height={size}
        intensity={distortionIntensity}
        style={{ borderRadius: '50%' }}
      />

      {/* SVG Filter distorsi sebagai fallback */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="liquid-distortion">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves={4}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={distortionIntensity * 15}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Layer distorsi SVG */}
      <div className="distortion-layer" />

      {/* Glow reaktif */}
      <div
        className="reactive-glow"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${lighting.tint}, transparent 70%)`,
          opacity: active ? 1 : 0,
        }}
      />

      {/* Ripple */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x - getRippleRadius(ripple) / 2,
            top: ripple.y - getRippleRadius(ripple) / 2,
            width: getRippleRadius(ripple) * 2,
            height: getRippleRadius(ripple) * 2,
          }}
          onAnimationEnd={() => removeRipple(ripple.id)}
        />
      ))}

      {/* Konten */}
      <span className="content">{children}</span>
    </motion.button>
  );
};
