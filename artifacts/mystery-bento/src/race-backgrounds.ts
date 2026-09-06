export type RaceBackgroundScene = {
  id: string;
  file: string;
  sourceAsset: string;
  label: string;
  aspectRatio: number;
  isDestination?: boolean;
};

export const RACE_BACKGROUND_CANVAS_WIDTH_PX = 1280;
export const RACE_BACKGROUND_CANVAS_HEIGHT_PX = 800;

/**
 * The race panorama is intentionally ordered rather than randomized. The
 * final scene is the moonlit pavilion that gives the finish crossing a clear
 * destination.
 */
export const RACE_BACKGROUND_SEQUENCE: RaceBackgroundScene[] = [
  {
    id: 'village-market',
    file: 'race-background-01-village-market.webp',
    sourceAsset: 'scene1-small_1788635911600.webp',
    label: 'village market street',
    aspectRatio: 12516 / 2592,
  },
  {
    id: 'tea-stall-crossing',
    file: 'race-background-02-tea-stall-crossing.webp',
    sourceAsset: 'scene2-cropped_1788635658507.webp',
    label: 'tea stall crossing',
    aspectRatio: 6132 / 2592,
  },
  {
    id: 'evening-market',
    file: 'race-background-03-evening-market.webp',
    sourceAsset: 'scene3-updated_1788637581138.webp',
    label: 'village road market',
    aspectRatio: 6260 / 2592,
  },
  {
    id: 'lantern-crossing',
    file: 'race-background-04-lantern-crossing.webp',
    sourceAsset: 'scene4-updated_1788656562583.webp',
    label: 'bamboo lantern crossing',
    aspectRatio: 6450 / 2593,
  },
  {
    id: 'moonlit-pavilion',
    file: 'race-background-06-pavilion-destination.webp',
    sourceAsset: 'scene5_1788656051116.webp',
    label: 'hilltop pavilion finish',
    aspectRatio: 7172 / 2592,
    isDestination: true,
  },
];

export const RACE_BACKGROUND_TRACK_WIDTH_PX = Math.round(
  RACE_BACKGROUND_SEQUENCE.reduce(
    (total, scene) => total + scene.aspectRatio * RACE_BACKGROUND_CANVAS_HEIGHT_PX,
    0,
  ),
);

export const RACE_BACKGROUND_TRACK_WIDTH_MULTIPLIER =
  RACE_BACKGROUND_TRACK_WIDTH_PX / RACE_BACKGROUND_CANVAS_WIDTH_PX;

export const RACE_BACKGROUND_FINISH_SCREEN_ANCHOR_PERCENT = 88;
export const RACE_BACKGROUND_FINISH_MARKER_OFFSET_PX = -200;
export const RACE_BACKGROUND_FINISH_MARKER_ANGLE_DEG = 45;
export const RACE_BACKGROUND_FINISH_MARKER_X_PX = Math.round(
  RACE_BACKGROUND_TRACK_WIDTH_PX
  - RACE_BACKGROUND_CANVAS_WIDTH_PX
  + (RACE_BACKGROUND_CANVAS_WIDTH_PX * RACE_BACKGROUND_FINISH_SCREEN_ANCHOR_PERCENT) / 100
  + RACE_BACKGROUND_FINISH_MARKER_OFFSET_PX,
);

export const RACE_BACKGROUND_FINISH_TRAVEL_PERCENT =
  (1 - RACE_BACKGROUND_CANVAS_WIDTH_PX / RACE_BACKGROUND_TRACK_WIDTH_PX) * 100;