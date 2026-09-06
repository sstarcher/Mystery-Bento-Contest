export type MovementAction = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'victory';

export const movementActions: MovementAction[] = ['idle', 'walk', 'run', 'jump', 'fall', 'victory'];

/**
 * Victory sheets use transparent 12x12 browser derivatives. A few derivatives
 * retain a transparent final cell, so frameCount records occupied poses rather
 * than assuming every nominal grid cell is playable.
 * Keeping this metadata beside the playback rules gives audits a dependency-
 * free source of truth without importing PNGs into a Node test process.
 */
export const victorySpriteMetadata: Record<string, {
  file: string;
  columns: number;
  rows: number;
  frameCount: number;
}> = {
  bibi: { file: 'bibi-victory.png', columns: 12, rows: 12, frameCount: 143 },
  toro: { file: 'toro-victory.png', columns: 12, rows: 12, frameCount: 143 },
  kiku: { file: 'kiku-victory.png', columns: 12, rows: 12, frameCount: 143 },
  miso: { file: 'miso-victory.png', columns: 12, rows: 12, frameCount: 144 },
  nori: { file: 'nori-victory.png', columns: 12, rows: 12, frameCount: 144 },
  panko: { file: 'panko-victory.png', columns: 12, rows: 12, frameCount: 143 },
  pip: { file: 'pip-victory.png', columns: 12, rows: 12, frameCount: 143 },
  rollo: { file: 'rollo-victory.png', columns: 12, rows: 12, frameCount: 144 },
  saffy: { file: 'saffy-victory.png', columns: 12, rows: 12, frameCount: 143 },
  tilda: { file: 'tilda-victory.png', columns: 12, rows: 12, frameCount: 143 },
  uma: { file: 'uma-victory.png', columns: 12, rows: 12, frameCount: 143 },
  sencha: { file: 'sencha-victory.png', columns: 12, rows: 12, frameCount: 144 },
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