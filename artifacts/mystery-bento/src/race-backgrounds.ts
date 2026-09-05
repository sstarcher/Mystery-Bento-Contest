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
    sourceAsset: 'scene1_1788633612334.webp',
    label: 'village market street',
    aspectRatio: 13000 / 2592,
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
    sourceAsset: 'scene3_1788634669324.webp',
    label: 'evening market',
    aspectRatio: 8000 / 2592,
  },
  {
    id: 'lantern-crossing',
    file: 'race-background-04-lantern-crossing.webp',
    sourceAsset: 'asset_DLD3nhkVhXHv2FawintnVK94_Use_the_attached_image_only_as__1788143277474.png',
    label: 'lantern crossing',
    aspectRatio: 6048 / 2592,
  },
  {
    id: 'central-stall',
    file: 'race-background-05-central-stall.webp',
    sourceAsset: 'asset_JLExZCGvnw6NywtZamvCsBXu_Use_the_attached_image_only_as__1788143277474.png',
    label: 'central stall',
    aspectRatio: 6048 / 2592,
  },
  {
    id: 'moonlit-pavilion',
    file: 'race-background-06-pavilion-destination.webp',
    sourceAsset: 'asset_mqEPbJkj88U6xZzrAaQh62rA_Use_the_attached_image_only_as__1788143277474.png',
    label: 'moonlit pavilion destination',
    aspectRatio: 6048 / 2592,
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

export const RACE_BACKGROUND_FINISH_TRAVEL_PERCENT =
  (1 - RACE_BACKGROUND_CANVAS_WIDTH_PX / RACE_BACKGROUND_TRACK_WIDTH_PX) * 100;