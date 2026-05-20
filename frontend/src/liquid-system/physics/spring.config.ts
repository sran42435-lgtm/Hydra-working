// Konfigurasi spring physics untuk animasi glass

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  velocity?: number;
}

export const glassSpring: SpringConfig = {
  stiffness: 400,
  damping: 17,
  mass: 0.8,
};

export const softSpring: SpringConfig = {
  stiffness: 200,
  damping: 15,
  mass: 1.0,
};

export const bouncySpring: SpringConfig = {
  stiffness: 300,
  damping: 10,
  mass: 0.6,
};

export const rigidSpring: SpringConfig = {
  stiffness: 600,
  damping: 22,
  mass: 0.5,
};

/**
 * Menghitung apakah spring sudah "berhenti" (rest).
 * Digunakan untuk menghentikan animasi saat sudah tidak bergerak.
 */
export function isSpringRest(
  current: number,
  target: number,
  velocity: number,
  threshold = 0.001
): boolean {
  return (
    Math.abs(current - target) < threshold && Math.abs(velocity) < threshold
  );
}
