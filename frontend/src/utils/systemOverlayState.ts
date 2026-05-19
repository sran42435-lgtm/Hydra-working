// frontend/src/utils/systemOverlayState.ts
type Listener = (isOpen: boolean) => void;

let isOpen = false;
const listeners = new Set<Listener>();

export function setSystemOverlayOpen(value: boolean) {
  isOpen = value;
  listeners.forEach((fn) => fn(isOpen));
}

export function getSystemOverlayOpen() {
  return isOpen;
}

export function onSystemOverlayChange(fn: Listener): () => void {
  listeners.add(fn);
  // Kembalikan fungsi pembersih yang tidak mengembalikan boolean
  return () => {
    listeners.delete(fn);
  };
}
