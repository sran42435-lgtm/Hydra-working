// Render throttle untuk mengurangi beban GPU saat idle

export interface ThrottleConfig {
  idleTimeout: number;      // ms sebelum memasuki mode idle
  idleFrameSkip: number;    // frame skip saat idle (misal 3 = render setiap 3 frame)
  activeFrameSkip: number;  // frame skip saat aktif (biasanya 1)
}

const defaultConfig: ThrottleConfig = {
  idleTimeout: 3000,
  idleFrameSkip: 4,
  activeFrameSkip: 1,
};

let lastActivity = performance.now();
let currentFrameSkip = defaultConfig.activeFrameSkip;
let frameCounter = 0;
let throttleConfig = { ...defaultConfig };

type ActivityListener = (isIdle: boolean) => void;
const activityListeners = new Set<ActivityListener>();

export function isIdle(): boolean {
  return performance.now() - lastActivity > throttleConfig.idleTimeout;
}

export function getFrameSkip(): number {
  return isIdle() ? throttleConfig.idleFrameSkip : throttleConfig.activeFrameSkip;
}

/**
 * Harus dipanggil setiap kali ada interaksi pengguna.
 */
export function reportActivity() {
  lastActivity = performance.now();
}

export function subscribeActivity(fn: ActivityListener): () => void {
  activityListeners.add(fn);
  return () => activityListeners.delete(fn);
}

/**
 * Mengecek apakah frame ini harus di‑render berdasarkan frame skip.
 * @returns true jika frame ini harus di‑render
 */
export function shouldRenderFrame(): boolean {
  frameCounter++;
  if (frameCounter >= currentFrameSkip) {
    frameCounter = 0;
    return true;
  }
  return false;
}

// Monitor idle/active
if (typeof window !== 'undefined') {
  setInterval(() => {
    const idle = isIdle();
    const newSkip = idle ? throttleConfig.idleFrameSkip : throttleConfig.activeFrameSkip;
    if (newSkip !== currentFrameSkip) {
      currentFrameSkip = newSkip;
      activityListeners.forEach((fn) => fn(idle));
    }
  }, 1000);

  // Laporkan aktivitas dari sentuhan/gerakan
  window.addEventListener('pointermove', reportActivity);
  window.addEventListener('pointerdown', reportActivity);
  window.addEventListener('scroll', reportActivity);
}
