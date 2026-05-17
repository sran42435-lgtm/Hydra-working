// hooks/useIsSystemOverlayOpen.ts
import { useState, useEffect } from 'react';
import { getSystemOverlayOpen, onSystemOverlayChange } from '../utils/systemOverlayState';

export function useIsSystemOverlayOpen() {
  const [open, setOpen] = useState(getSystemOverlayOpen());

  useEffect(() => {
    return onSystemOverlayChange(setOpen);
  }, []);

  return open;
}
