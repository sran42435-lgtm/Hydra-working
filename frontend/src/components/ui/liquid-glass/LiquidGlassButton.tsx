// frontend/src/components/ui/liquid-glass/LiquidGlassButton.tsx

import React, { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { LiquidGlassButtonProps } from "./LiquidGlassButton.types";
import { OpticalGlassLayer } from "./OpticalGlassLayer";
import "./LiquidGlassButton.css";

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  size = 44,
  onPress,
  style,
  className = "",
  distortionIntensity = 0.3,
  active = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);
  const nextId = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rippleSize = Math.max(rect.width, rect.height) * 1.5;
      const id = nextId.current++;
      setRipples((prev) => [...prev, { id, x, y, size: rippleSize }]);
    },
    []
  );

  const handleAnimationEnd = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      className={`liquid-glass-button ${className} ${active ? "active" : ""}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onClick={onPress}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
        mass: 0.8,
      }}
    >
      {/* SVG Filter untuk distorsi */}
      <svg
        style={{ position: "absolute", width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <filter id="liquid-distortion">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={distortionIntensity * 10}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Layer distorsi */}
      <div className="distortion-layer" />

      {/* Glow reaktif */}
      <div className="reactive-glow" />

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="liquid-ripple"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
          onAnimationEnd={() => handleAnimationEnd(ripple.id)}
        />
      ))}

      {/* Konten */}
      <span style={{ position: "relative", zIndex: 2 }}>{children}</span>
    </motion.button>
  );
};
