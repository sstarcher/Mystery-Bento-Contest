export type CurioArtProfile = { scale: number };

// Curio art is authored on different transparent canvases and the legacy
// glyphs have different silhouettes. Normalize the visible maximum dimension
// here, while keeping each artwork's aspect ratio intact. The extra fit budget
// keeps that normalized art comfortably inside each square presentation box.
export const CURIO_ART_FIT_SCALE = 0.86;

export const CURIO_ART_PROFILES: Record<string, CurioArtProfile> = {
  'image-default': { scale: 0.84 },
  'pip-pocket-watch': { scale: 1 },
  'pip-rice-bowl': { scale: 1 },
  'pip-satchel-tag': { scale: 1 },
  'glyph-default': { scale: 1 },
  'glyph-recipe': { scale: 1.14 },
  'glyph-note': { scale: 1.08 },
  'glyph-cup': { scale: 1.2 },
  'glyph-lantern': { scale: 1.45 },
  'glyph-ticket': { scale: 1.15 },
  'glyph-ladle': { scale: 1.1 },
  'glyph-patch': { scale: 1.08 },
  'glyph-wrench': { scale: 1.25 },
  'glyph-checker': { scale: 1.05 },
  'glyph-tile': { scale: 1.15 },
  'glyph-snapshot': { scale: 1.08 },
  'glyph-tray': { scale: 1.02 },
  'glyph-pin': { scale: 1.15 },
  'glyph-medal': { scale: 1.18 },
  'glyph-kettle': { scale: 1.15 },
  'glyph-radish': { scale: 1.25 },
};

export function getCurioArtProfile({ artVariant, glyphClass }: { artVariant?: string; glyphClass?: string }): CurioArtProfile {
  const key = artVariant ?? (glyphClass ? `glyph-${glyphClass}` : 'image-default');
  return CURIO_ART_PROFILES[key] ?? CURIO_ART_PROFILES['image-default'];
}