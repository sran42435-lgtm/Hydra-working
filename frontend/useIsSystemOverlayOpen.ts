// frontend/src/hooks/useIsSystemOverlayOpen.ts
import { useState, useEffect } from 'react';
import { getSystemOverlayOpen, onSystemOverlayChange } from '../utils/systemOverlayState';

export function useIsSystemOverlayOpen() {
  const [open, setOpen] = useState(getSystemOverlayOpen());

  useEffect(() => {
    const unsubscribe = onSystemOverlayChange(function (value) {
      setOpen(value);
    });
    return function () {
      unsubscribe();
    };
  }, []);

  return open;
}
