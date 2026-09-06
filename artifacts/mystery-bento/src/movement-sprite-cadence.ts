import { getRunnerSpriteCadenceMultiplier } from './race-speed-model';

const MOTION_SPEEDUP = 1.08;
const speedUpDurationMs = (durationMs: number) => Math.max(1, Math.round(durationMs / MOTION_SPEEDUP));

export function getMovementFrameDurationMs(
  frameDurationMs: number,
  speedMultiplier: number,
  isOneShot: boolean,
) {
  if (isOneShot) return speedUpDurationMs(frameDurationMs) / 2;
  return speedUpDurationMs(frameDurationMs / getRunnerSpriteCadenceMultiplier(speedMultiplier));
}