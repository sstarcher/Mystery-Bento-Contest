export type RaceBackgroundScene = {
  id: string;
  file: string;
  sourceAsset: string;
  label: string;
  isDestination?: boolean;
};

/**
 * The race panorama is intentionally ordered rather than randomized. The
 * final scene is the moonlit pavilion that gives the finish crossing a clear
 * destination.
 */
export const RACE_BACKGROUND_SEQUENCE: RaceBackgroundScene[] = [
  {
    id: 'lantern-gate-market',
    file: 'race-background-01-lantern-gate-market.webp',
    sourceAsset: 'asset_Jg8Ss2V9g33aeiJ15DZcdqrS_Use_the_attached_image_only_as__1788143277473.png',
    label: 'lantern gate market',
  },
  {
    id: 'garden-market',
    file: 'race-background-02-garden-market.webp',
    sourceAsset: 'asset_HZMGGFNr63MnSKVN7o6SG4Si_Use_the_attached_image_only_as__1788143277473.png',
    label: 'garden market',
  },
  {
    id: 'night-alley',
    file: 'race-background-03-night-alley.webp',
    sourceAsset: 'asset_5ja66x7rCi6QGmXdcfFp9PkV_Use_the_attached_image_only_as__1788143277473.png',
    label: 'night alley',
  },
  {
    id: 'lantern-crossing',
    file: 'race-background-04-lantern-crossing.webp',
    sourceAsset: 'asset_DLD3nhkVhXHv2FawintnVK94_Use_the_attached_image_only_as__1788143277474.png',
    label: 'lantern crossing',
  },
  {
    id: 'central-stall',
    file: 'race-background-05-central-stall.webp',
    sourceAsset: 'asset_JLExZCGvnw6NywtZamvCsBXu_Use_the_attached_image_only_as__1788143277474.png',
    label: 'central stall',
  },
  {
    id: 'moonlit-pavilion',
    file: 'race-background-06-pavilion-destination.webp',
    sourceAsset: 'asset_mqEPbJkj88U6xZzrAaQh62rA_Use_the_attached_image_only_as__1788143277474.png',
    label: 'moonlit pavilion destination',
    isDestination: true,
  },
];