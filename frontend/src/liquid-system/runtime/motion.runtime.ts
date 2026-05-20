// Motion interpolation runtime (spring-based)

import { SpringConfig, glassSpring, isSpringRest } from '../physics/spring.config';

export interface MotionValue {
  current: number;
  target: number;
  velocity: number;
  config: SpringConfig;
  onUpdate?: (value: number) => void;
  onRest?: () => void;
}

const activeMotions = new Set<MotionValue>();
let rafId: number | null = null;

/**
 * Membuat nilai animasi spring.
 */
export function createMotionValue(
  initial: number,
  config: SpringConfig = glassSpring,
  onUpdate?: (value: number) => void,
  onRest?: () => void
): MotionValue {
  const mv: MotionValue = {
    current: initial,
    target: initial,
    velocity: 0,
    config,
    onUpdate,
    onRest,
  };
  return mv;
}

/**
 * Set target baru untuk motion value.
 */
export function setMotionTarget(mv: MotionValue, target: number) {
  mv.target = target;
  activeMotions.add(mv);
  startLoop();
}

function startLoop() {
  if (rafId !== null) return;
  const loop = () => {
    let allRest = true;
    activeMotions.forEach((mv) => {
      // Spring dynamics
      const force = (mv.target - mv.current) * mv.config.stiffness;
      const damping = mv.velocity * mv.config.damping;
      const acceleration = (force - damping) / mv.config.mass;

      mv.velocity += acceleration * 0.016; // asumsi 60fps
      mv.current += mv.velocity * 0.016;

      if (isSpringRest(mv.current, mv.target, mv.velocity)) {
        mv.current = mv.target;
        mv.velocity = 0;
        activeMotions.delete(mv);
        mv.onRest?.();
      } else {
        allRest = false;
      }
      mv.onUpdate?.(mv.current);
    });

    if (activeMotions.size > 0) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
    }
  };
  rafId = requestAnimationFrame(loop);
}

/**
 * Hentikan semua motion (untuk cleanup global).
 */
export function stopAllMotion() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  activeMotions.clear();
}
