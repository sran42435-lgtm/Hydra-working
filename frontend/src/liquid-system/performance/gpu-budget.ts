// GPU performance budget tracker

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface GPUBudget {
  tier: QualityTier;
  fps: number;
  frameTime: number;      // ms
  droppedFrames: number;
  canUseShaders: boolean;
  canUseBlur: boolean;
  canUseRipple: boolean;
  maxBlurRadius: number;
  maxRippleCount: number;
  shaderComplexity: number; // 0..1
}

const FRAME_SAMPLE_SIZE = 60;
const frameTimes: number[] = [];
let lastFrameTime = performance.now();
let frameCount = 0;
let droppedFrames = 0;
let monitoringInterval: number | null = null;

let currentBudget: GPUBudget = {
  tier: 'high',
  fps: 60,
  frameTime: 16.6,
  droppedFrames: 0,
  canUseShaders: true,
  canUseBlur: true,
  canUseRipple: true,
  maxBlurRadius: 24,
  maxRippleCount: 3,
  shaderComplexity: 1.0,
};

type BudgetListener = (budget: GPUBudget) => void;
const budgetListeners = new Set<BudgetListener>();

export function getGPUBudget(): GPUBudget {
  return currentBudget;
}

export function subscribeGPUBudget(fn: BudgetListener): () => void {
  budgetListeners.add(fn);
  return () => budgetListeners.delete(fn);
}

function notifyBudget() {
  budgetListeners.forEach((fn) => fn(currentBudget));
}

/**
 * Catat frame time dan update budget secara periodik.
 */
export function recordFrame() {
  const now = performance.now();
  const dt = now - lastFrameTime;
  lastFrameTime = now;

  frameTimes.push(dt);
  if (frameTimes.length > FRAME_SAMPLE_SIZE) frameTimes.shift();
  frameCount++;

  // Deteksi dropped frame (> 32ms ≈ <30fps)
  if (dt > 32) droppedFrames++;
}

function evaluateBudget() {
  if (frameTimes.length === 0) return;

  const avgFrameTime =
    frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const fps = 1000 / avgFrameTime;

  let tier: QualityTier;
  if (fps >= 55) tier = 'ultra';
  else if (fps >= 45) tier = 'high';
  else if (fps >= 30) tier = 'medium';
  else tier = 'low';

  const budget: GPUBudget = {
    tier,
    fps: Math.round(fps),
    frameTime: Math.round(avgFrameTime * 10) / 10,
    droppedFrames,
    canUseShaders: tier !== 'low',
    canUseBlur: tier !== 'low',
    canUseRipple: tier !== 'low',
    maxBlurRadius: tier === 'ultra' ? 24 : tier === 'high' ? 16 : tier === 'medium' ? 8 : 0,
    maxRippleCount: tier === 'ultra' ? 4 : tier === 'high' ? 3 : tier === 'medium' ? 2 : 0,
    shaderComplexity: tier === 'ultra' ? 1.0 : tier === 'high' ? 0.7 : tier === 'medium' ? 0.4 : 0.0,
  };

  if (
    budget.tier !== currentBudget.tier ||
    budget.fps !== currentBudget.fps ||
    budget.droppedFrames !== currentBudget.droppedFrames
  ) {
    currentBudget = budget;
    notifyBudget();
  }
}

// Monitor setiap 2 detik
if (typeof window !== 'undefined') {
  monitoringInterval = window.setInterval(evaluateBudget, 2000);
}

// Inject frame recording ke rAF global
const originalRAF = window.requestAnimationFrame;
window.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return originalRAF.call(window, (time: DOMHighResTimeStamp) => {
    recordFrame();
    callback(time);
  });
};
