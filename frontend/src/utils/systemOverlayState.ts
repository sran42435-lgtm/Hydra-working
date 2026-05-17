// utils/systemOverlayState.ts
type Listener = () => void;

let isOpen = false;
const listeners = new Set<Listener>();

export function setSystemOverlayOpen(value: boolean) {
  isOpen = value;
  listeners.forEach((fn) => fn());
}

export function getSystemOverlayOpen() {
  return isOpen;
}

export function onSystemOverlayChange(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
