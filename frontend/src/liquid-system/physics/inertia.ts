// Inertia / momentum tracker untuk gesture

export interface InertiaState {
  velocity: number;
  lastValue: number;
  lastTime: number;
}

/**
 * Membuat tracker inertia baru.
 */
export function createInertia(): InertiaState {
  return {
    velocity: 0,
    lastValue: 0,
    lastTime: 0,
  };
}

/**
 * Update tracker dengan nilai baru, menghasilkan velocity.
 * @param state - state inertia
 * @param value - nilai saat ini (bisa posisi, skala, dll.)
 * @param now - timestamp saat ini (ms)
 * @returns velocity yang dihitung
 */
export function trackVelocity(
  state: InertiaState,
  value: number,
  now: number = Date.now()
): number {
  const dt = now - state.lastTime;
  if (dt > 0) {
    state.velocity = (value - state.lastValue) / dt;
  }
  state.lastValue = value;
  state.lastTime = now;
  return state.velocity;
}

/**
 * Hentikan inertia (reset velocity ke 0).
 */
export function resetInertia(state: InertiaState): void {
  state.velocity = 0;
  state.lastValue = 0;
  state.lastTime = 0;
}
