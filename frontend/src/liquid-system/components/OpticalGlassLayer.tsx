// src/liquid-system/components/OpticalGlassLayer.tsx

import React from 'react';
import { useOpticalRefraction } from '../hooks/useOpticalRefraction';
import { useSurfacePhysics } from '../hooks/useSurfacePhysics';

interface OpticalGlassLayerProps {
  surfaceId: string;
  width: number;
  height: number;
  intensity?: number;
  style?: React.CSSProperties;
}

export const OpticalGlassLayer: React.FC<OpticalGlassLayerProps> = ({
  surfaceId,
  width,
  height,
  intensity = 0.5,
  style,
}) => {
  const { canvasRef } = useOpticalRefraction(surfaceId, intensity);
  const { onPointerDown, onPointerUp } = useSurfacePhysics();

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="optical-canvas"   // ← kelas CSS baru
      style={{
        ...style,
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    />
  );
};
