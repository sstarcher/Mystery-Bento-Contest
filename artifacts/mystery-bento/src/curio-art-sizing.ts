export type CurioArtProfile = { scale: number };

// Curio art is authored on different transparent canvases. Normalize the
// visible maximum dimension here, while keeping each artwork's aspect ratio
// intact. The extra fit budget keeps art comfortably inside each square box.
// Keep a 10% reduction from the previous shared fit scale so every image-backed
// curio gets the same smaller footprint without per-item overrides.
export const CURIO_ART_FIT_SCALE = 0.774;

export const CURIO_ART_PROFILES: Record<string, CurioArtProfile> = {
  'image-default': { scale: 0.84 },
  'pip-pocket-watch': { scale: 1 },
  'pip-rice-bowl': { scale: 1 },
  'pip-satchel-tag': { scale: 1 },
};

export function getCurioArtProfile({ artVariant }: { artVariant?: string }): CurioArtProfile {
  const key = artVariant ?? 'image-default';
  return CURIO_ART_PROFILES[key] ?? CURIO_ART_PROFILES['image-default'];
}