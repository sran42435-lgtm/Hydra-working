// Touch pressure illusion model

export interface PressureConfig {
  buildupSpeed: number;    // kecepatan naik tekanan (0–1 per ms)
  releaseSpeed: number;    // kecepatan turun tekanan
  maxPressure: number;     // tekanan maksimum (0–1)
}

export const defaultPressureConfig: PressureConfig = {
  buildupSpeed: 0.003,
  releaseSpeed: 0.008,
  maxPressure: 1.0,
};

export interface PressureState {
  current: number;
  target: number;
  lastUpdate: number;
}

/**
 * Buat state tekanan baru.
 */
export function createPressureState(): PressureState {
  return {
    current: 0,
    target: 0,
    lastUpdate: performance.now(),
  };
}

/**
 * Set target tekanan (1 = ditekan, 0 = dilepas).
 */
export function setPressure(
  state: PressureState,
  target: number,
  config: PressureConfig = defaultPressureConfig
): void {
  state.target = Math.min(target, config.maxPressure);
  state.lastUpdate = performance.now();
}

/**
 * Update tekanan menuju target dengan lerp halus.
 */
export function updatePressure(
  state: PressureState,
  config: PressureConfig = defaultPressureConfig,
  now: number = performance.now()
): number {
  const dt = now - state.lastUpdate;
  state.lastUpdate = now;

  if (state.current < state.target) {
    state.current = Math.min(
      state.target,
      state.current + config.buildupSpeed * dt
    );
  } else {
    state.current = Math.max(
      state.target,
      state.current - config.releaseSpeed * dt
    );
  }

  return state.current;
}
