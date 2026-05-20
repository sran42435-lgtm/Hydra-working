// Ripple physics model untuk liquid glass

export interface RippleConfig {
  maxRadius: number;        // radius maksimum ripple (px)
  duration: number;         // durasi animasi (ms)
  amplitude: number;        // amplitudo visual (0–1)
  frequency: number;        // frekuensi gelombang
  decay: number;            // peluruhan (0–1, makin kecil makin cepat hilang)
}

export const defaultRippleConfig: RippleConfig = {
  maxRadius: 120,
  duration: 600,
  amplitude: 0.5,
  frequency: 3,
  decay: 0.97,
};

export interface RippleState {
  id: number;
  x: number;
  y: number;
  startTime: number;
  config: RippleConfig;
}

let nextRippleId = 0;

/**
 * Buat ripple baru pada posisi sentuh.
 */
export function createRipple(
  x: number,
  y: number,
  config: RippleConfig = defaultRippleConfig
): RippleState {
  return {
    id: nextRippleId++,
    x,
    y,
    startTime: performance.now(),
    config,
  };
}

/**
 * Hitung nilai amplitudo ripple pada waktu tertentu.
 * @returns amplitudo (0–1)
 */
export function getRippleAmplitude(
  ripple: RippleState,
  now: number = performance.now()
): number {
  const elapsed = now - ripple.startTime;
  const progress = Math.min(elapsed / ripple.config.duration, 1);
  const decayed = Math.pow(ripple.config.decay, elapsed / 16);
  const sine = Math.sin(progress * Math.PI * ripple.config.frequency);
  return ripple.config.amplitude * sine * decayed;
}

/**
 * Hitung radius ripple saat ini.
 */
export function getRippleRadius(
  ripple: RippleState,
  now: number = performance.now()
): number {
  const elapsed = now - ripple.startTime;
  const progress = Math.min(elapsed / ripple.config.duration, 1);
  return ripple.config.maxRadius * progress;
}

/**
 * Cek apakah ripple sudah mati (durasi habis).
 */
export function isRippleDead(
  ripple: RippleState,
  now: number = performance.now()
): boolean {
  const elapsed = now - ripple.startTime;
  return elapsed >= ripple.config.duration;
}
