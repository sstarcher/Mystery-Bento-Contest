import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const sizingSource = readFileSync(fileURLToPath(new URL('./curio-art-sizing.ts', import.meta.url)), 'utf8');
const curioCss = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');

const profileBlock = sizingSource.match(/export const CURIO_ART_PROFILES: Record<string, CurioArtProfile> = \{([\s\S]*?)\n\};/);
assert.ok(profileBlock, 'Curio art profile map is missing');

const profiles = new Map(
  [...profileBlock![1].matchAll(/^\s*'([^']+)': \{ scale: ([\d.]+) \},?$/gm)]
    .map(([, name, scale]) => [name, Number(scale)] as const),
);
assert.ok(profiles.size > 0, 'Curio art profile map is empty');
assert.ok(profiles.has('image-default'), 'Image curios must have a shared default profile');
assert.equal([...profiles.keys()].some((name) => name.startsWith('glyph-')), false, 'Legacy glyph profiles must be removed');
for (const [name, scale] of profiles) {
  assert.ok(Number.isFinite(scale) && scale > 0, `${name}: normalization scale must be positive`);
}

const collectibleBlock = appSource.match(/const collectiblePool = \[([\s\S]*?)\n\];/);
assert.ok(collectibleBlock, 'Collectible pool is missing');
const imageVariants = [...collectibleBlock![1].matchAll(/imageSrc:\s*[^,]+,\s*artVariant:\s*'([^']+)'/g)].map(([, variant]) => variant);
assert.ok(imageVariants.length > 0, 'No image-backed collectible variants found');
for (const variant of imageVariants) {
  assert.ok(
    profiles.has(variant) || profiles.has('image-default'),
    `${variant}: image art must resolve to an explicit profile or image-default`,
  );
}

const legacyGlyphs = new Set([...curioCss.matchAll(/\.curio-glyph-([a-z-]+)::before/g)].map(([, glyph]) => glyph));
assert.equal(legacyGlyphs.size, 0, 'Legacy CSS glyphs must be removed');

const pipProfiles = ['pip-pocket-watch', 'pip-rice-bowl', 'pip-satchel-tag'];
const pipScales = pipProfiles.map((variant) => {
  assert.ok(profiles.has(variant), `${variant}: missing explicit Pip normalization profile`);
  return profiles.get(variant);
});
assert.ok(pipScales.every((scale) => scale === pipScales[0]), 'Pip watch, bowl, and satchel must share one normalized scale');

assert.match(appSource, /getCurioArtProfile\(\{ artVariant \}\)/, 'Image curios must use the shared profile resolver');
assert.doesNotMatch(appSource, /glyphClass/, 'Legacy glyph renderer must be removed');
assert.match(curioCss, /\.curio-art-box \{[^}]*width: 96px; height: 96px;/);
assert.match(curioCss, /\.curio-art-normalized \{[^}]*transform: scale\(var\(--curio-art-scale, 1\)\)/);
assert.match(curioCss, /\.displayed-curio \.curio-art-box/);
assert.match(curioCss, /\.curio-display-art \.curio-art-box/);

const restaurantShelfContext = appSource.slice(
  appSource.indexOf('function RestaurantCurioDisplays'),
  appSource.indexOf('function PersonaPortrait'),
);
assert.match(restaurantShelfContext, /<CurioHotspot\b/, 'Restaurant shelf must render curios through the shared hotspot path');

const curioOverlayContext = appSource.slice(
  appSource.indexOf('function CurioOverlay'),
  appSource.indexOf('function App'),
);
assert.match(curioOverlayContext, /<CurioGlyph item=\{item\}/, 'Kitchen Curio Shelf must render curios through CurioGlyph');

console.log(`Curio footprint audit passed for ${imageVariants.length} image variants and no legacy glyphs.`);