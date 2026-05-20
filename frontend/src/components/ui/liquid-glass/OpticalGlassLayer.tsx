// frontend/src/components/ui/liquid-glass/OpticalGlassLayer.tsx

import React, { useRef, useEffect, useCallback } from "react";
import { useOpticalRefraction } from "../../../hooks/useOpticalRefraction";

interface OpticalGlassLayerProps {
  width: number;
  height: number;
  intensity?: number;
  style?: React.CSSProperties;
}

export const OpticalGlassLayer: React.FC<OpticalGlassLayerProps> = ({
  width,
  height,
  intensity = 0.3,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startRender, stopRender, setTouchPoint, setPressure } =
    useOpticalRefraction(canvasRef, { intensity });

  useEffect(() => {
    startRender();
    return () => stopRender();
  }, [startRender, stopRender]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height; // flip Y
      setTouchPoint(x, y);
    },
    [setTouchPoint]
  );

  const handlePointerDown = useCallback(() => {
    setPressure(1.0);
  }, [setPressure]);

  const handlePointerUp = useCallback(() => {
    setPressure(0.0);
  }, [setPressure]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        pointerEvents: "auto",
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};
