import type { MovementAction } from './movement-sprite-actions';

export type MovementSpriteNormalization = {
  /**
   * Scale applied to the complete source cell. This intentionally uses a
   * transform instead of resizing the artwork so the reduced PNGs stay
   * pixel-crisp and the source sheets remain untouched.
   */
  scale: number;
  /**
   * Post-scale vertical correction in rendered pixels. The values align the
   * measured median alpha baseline of each action to its character's common
   * ground anchor while preserving per-frame jump motion.
   */
  baselineOffset: number;
};

export type MovementSpriteRenderStyle = {
  frameTransform: string;
  frameTransformOrigin: string;
  spriteTransform: string;
};

export function getMovementSpriteRenderStyle(
  normalization: MovementSpriteNormalization,
): MovementSpriteRenderStyle {
  return {
    frameTransform: `scale(${normalization.scale})`,
    frameTransformOrigin: '50% 100%',
    spriteTransform: `translateY(${normalization.baselineOffset}px)`,
  };
}

type NormalizationSet = Record<MovementAction, MovementSpriteNormalization>;

const normalized = (
  scale: number,
  baselineOffset: number,
): MovementSpriteNormalization => ({ scale, baselineOffset });

/**
 * Runtime movement sheets are reduced transparent derivatives of the
 * preserved artwork. Their cells have the same nominal size, but the
 * occupied silhouettes do not. These values were measured from representative
 * first, middle, and last frames of every action and normalize each persona
 * against its largest regular movement pose.
 */
export const movementSpriteNormalization: Record<string, NormalizationSet> = {
  bibi: {
    idle: normalized(1, 1.7),
    walk: normalized(1, 0),
    run: normalized(1.226, 22.1),
    jump: normalized(1.27, 15.5),
    fall: normalized(1.178, 14.9),
    victory: normalized(1.122, 19.7),
  },
  toro: {
    idle: normalized(1.039, 13.1),
    walk: normalized(1.076, 18.9),
    run: normalized(1, 0),
    jump: normalized(1.082, 15.4),
    fall: normalized(1.294, 30.2),
    victory: normalized(1.052, 11.7),
  },
  kiku: {
    idle: normalized(1.104, 10.4),
    walk: normalized(1.053, 2),
    run: normalized(1, 6.8),
    jump: normalized(1.385, 41.2),
    fall: normalized(1.118, 13.9),
    victory: normalized(1.008, -4.4),
  },
  miso: {
    idle: normalized(1, 0),
    walk: normalized(1.232, 23.5),
    run: normalized(2.022, 105.2),
    jump: normalized(1.465, 43.4),
    fall: normalized(1.292, 30.4),
    victory: normalized(1.118, 5.4),
  },
  nori: {
    idle: normalized(1.051, 3.3),
    walk: normalized(1, 0),
    run: normalized(1.187, 10.7),
    jump: normalized(1.353, 22.1),
    fall: normalized(1.095, 9.4),
    victory: normalized(1.163, 20.7),
  },
  panko: {
    idle: normalized(1, 0),
    walk: normalized(1.199, 20.9),
    run: normalized(1.056, 1.6),
    jump: normalized(1.496, 26.9),
    fall: normalized(1.222, 21.8),
    victory: normalized(0.973, 4.2),
  },
  pip: {
    idle: normalized(1.304, 16.9),
    walk: normalized(1.052, 8.9),
    run: normalized(1, 0),
    jump: normalized(1.132, 36),
    fall: normalized(1.032, 8.9),
    victory: normalized(1.013, -2.1),
  },
  rollo: {
    idle: normalized(1, 0),
    walk: normalized(1.18, 17.1),
    run: normalized(1.116, 12.1),
    jump: normalized(1.312, 12.4),
    fall: normalized(0.954, -2.3),
    victory: normalized(0.781, -38),
  },
  saffy: {
    idle: normalized(1, 0),
    walk: normalized(1.195, 15.7),
    run: normalized(1.352, 31.1),
    jump: normalized(1.441, 57.8),
    fall: normalized(1.371, 34.2),
    victory: normalized(1.132, 10.3),
  },
  tilda: {
    idle: normalized(1, 0),
    walk: normalized(1.069, 13.8),
    run: normalized(1.14, 15.7),
    jump: normalized(1.171, 11),
    fall: normalized(1.171, 22.9),
    victory: normalized(1.045, 5.8),
  },
  uma: {
    idle: normalized(1, 0),
    walk: normalized(1.054, 8.5),
    run: normalized(1.228, 25.7),
    jump: normalized(1.347, 51.1),
    fall: normalized(1.252, 26.7),
    victory: normalized(1.07, -2.2),
  },
  sencha: {
    idle: normalized(1, 0),
    walk: normalized(1.06, 4.7),
    run: normalized(1.035, 3.8),
    jump: normalized(1.239, 22.7),
    fall: normalized(1.054, 5.4),
    victory: normalized(1.032, -4.1),
  },
};
