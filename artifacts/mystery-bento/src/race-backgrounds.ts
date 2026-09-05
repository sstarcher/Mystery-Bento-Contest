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
    id: 'village-market',
    file: 'race-background-01-village-market.webp',
    sourceAsset: 'scene1_1788633612334.webp',
    label: 'village market street',
  },
  {
    id: 'tea-stall-crossing',
    file: 'race-background-02-tea-stall-crossing.webp',
    sourceAsset: 'scene2_1788633561855.webp',
    label: 'tea stall crossing',
  },
  {
    id: 'evening-market',
    file: 'race-background-03-evening-market.webp',
    sourceAsset: 'scene3_1788634669324.webp',
    label: 'evening market',
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