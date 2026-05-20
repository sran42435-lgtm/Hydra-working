// frontend/src/hooks/useRipple.ts

import { useRef, useCallback, useState } from "react";

export interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
  key: string;
}

export function useRipple() {
  const nextId = useRef(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback(
    (containerWidth: number, containerHeight: number, clientX: number, clientY: number) => {
      const size = Math.max(containerWidth, containerHeight) * 1.8;
      const id = nextId.current++;
      setRipples((prev) => [
        ...prev,
        { id, x: clientX, y: clientY, size, key: `ripple-${id}` },
      ]);
    },
    []
  );

  const removeRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { ripples, createRipple, removeRipple };
}
