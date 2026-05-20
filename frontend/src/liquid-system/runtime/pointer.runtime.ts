// Global pointer state & velocity tracker

export interface PointerState {
  x: number;            // posisi X relatif terhadap viewport (0..1)
  y: number;            // posisi Y relatif (0..1)
  isDown: boolean;      // apakah pointer sedang ditekan
  velocity: number;     // kecepatan gerakan (px/ms)
  pressure: number;     // tekanan (0..1)
  timestamp: number;    // waktu terakhir
}

type PointerListener = (state: PointerState) => void;

const listeners = new Set<PointerListener>();

let pointerState: PointerState = {
  x: 0.5,
  y: 0.5,
  isDown: false,
  velocity: 0,
  pressure: 0,
  timestamp: 0,
};

let lastX = 0.5;
let lastY = 0.5;
let lastTime = 0;

function notify() {
  listeners.forEach((fn) => fn(pointerState));
}

export function getPointerState(): PointerState {
  return pointerState;
}

export function subscribePointer(fn: PointerListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function updatePointer(clientX: number, clientY: number, isDown: boolean) {
  const now = performance.now();
  const x = clientX / window.innerWidth;
  const y = clientY / window.innerHeight;

  const dt = now - lastTime;
  const dist = Math.hypot(x - lastX, y - lastY);
  const velocity = dt > 0 ? dist / dt : 0;

  pointerState = {
    x,
    y,
    isDown,
    velocity,
    pressure: isDown ? Math.min(velocity * 0.5 + 0.3, 1.0) : 0,
    timestamp: now,
  };

  lastX = x;
  lastY = y;
  lastTime = now;
  notify();
}

// Inisialisasi listener global
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    updatePointer(e.clientX, e.clientY, pointerState.isDown);
  });
  window.addEventListener('pointerdown', (e) => {
    updatePointer(e.clientX, e.clientY, true);
  });
  window.addEventListener('pointerup', () => {
    updatePointer(lastX * window.innerWidth, lastY * window.innerHeight, false);
  });
  window.addEventListener('pointerleave', () => {
    updatePointer(lastX * window.innerWidth, lastY * window.innerHeight, false);
  });
}
