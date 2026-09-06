export type MovementAction = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'victory';

export const movementActions: MovementAction[] = ['idle', 'walk', 'run', 'jump', 'fall', 'victory'];

/**
 * Victory sheets are deliberately uniform: every persona gets the same
 * transparent 8x8 browser derivative and all cells are authored poses.
 * Keeping this metadata beside the playback rules gives audits a dependency-
 * free source of truth without importing PNGs into a Node test process.
 */
export const victorySpriteMetadata: Record<string, {
  file: string;
  columns: number;
  rows: number;
  frameCount: number;
}> = {
  bibi: { file: 'bibi-victory.png', columns: 8, rows: 8, frameCount: 64 },
  toro: { file: 'toro-victory.png', columns: 8, rows: 8, frameCount: 64 },
  kiku: { file: 'kiku-victory.png', columns: 8, rows: 8, frameCount: 64 },
  miso: { file: 'miso-victory.png', columns: 8, rows: 8, frameCount: 64 },
  nori: { file: 'nori-victory.png', columns: 8, rows: 8, frameCount: 64 },
  panko: { file: 'panko-victory.png', columns: 8, rows: 8, frameCount: 64 },
  pip: { file: 'pip-victory.png', columns: 8, rows: 8, frameCount: 64 },
  rollo: { file: 'rollo-victory.png', columns: 8, rows: 8, frameCount: 64 },
  saffy: { file: 'saffy-victory.png', columns: 8, rows: 8, frameCount: 64 },
  tilda: { file: 'tilda-victory.png', columns: 8, rows: 8, frameCount: 64 },
  uma: { file: 'uma-victory.png', columns: 8, rows: 8, frameCount: 64 },
  sencha: { file: 'sencha-victory.png', columns: 8, rows: 8, frameCount: 64 },
};

export function getMovementFrameIndex(
  frameIndex: number,
  frameCount: number,
  loops: boolean,
) {
  if (frameCount <= 0) return 0;
  if (!loops) return Math.max(0, Math.min(frameCount - 1, frameIndex));
  return ((frameIndex % frameCount) + frameCount) % frameCount;
}

export function getVictoryFrameIndex(
  frameIndex: number,
  frameCount: number,
  prefersReducedMotion: boolean,
) {
  return prefersReducedMotion
    ? 0
    : getMovementFrameIndex(frameIndex, frameCount, true);
}