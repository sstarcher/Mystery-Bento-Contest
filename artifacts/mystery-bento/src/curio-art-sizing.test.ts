import assert from 'node:assert/strict';
import { CURIO_ART_FIT_SCALE, CURIO_ART_PROFILES, getCurioArtProfile } from './curio-art-sizing';

const imageVariants = [
  'pip-pocket-watch',
  'pip-rice-bowl',
  'pip-satchel-tag',
  'tilda-toolbox',
  'tilda-wrench-set',
  'tilda-safety-module',
  'sencha-leaf-bookmark',
  'sencha-night-teapot',
  'sencha-tea-ledger',
  'toro-captains-cap',
  'toro-pocket-compass',
  'toro-grill-spatula',
  'nori-plum-notebook',
  'nori-brush-pen',
  'nori-scarf-pin',
  'miso-soup-bowl',
  'miso-walnut-ladle',
  'miso-broth-jar',
  'uma-noodle-ribbon',
  'uma-flour-sack',
  'uma-rolling-pin',
  'panko-magnifying-glass',
  'panko-detective-beret',
  'panko-clue-notebook',
  'kiku-aged-copper-kettle',
  'kiku-jade-brass-gear',
  'kiku-sage-blueprint',
  'bibi-stacked-bento',
  'bibi-food-tweezers',
  'bibi-cloth-wrap',
];

const legacyGlyphs = [
  'recipe',
  'note',
  'cup',
  'lantern',
  'ticket',
  'ladle',
  'patch',
  'wrench',
  'checker',
  'tile',
  'snapshot',
  'tray',
  'pin',
  'medal',
  'kettle',
  'radish',
];

assert.ok(CURIO_ART_FIT_SCALE > 0 && CURIO_ART_FIT_SCALE < 1, 'shared fit scale must reduce the art');
assert.equal(getCurioArtProfile({}).scale, CURIO_ART_PROFILES['image-default'].scale);

for (const artVariant of imageVariants) {
  assert.ok(getCurioArtProfile({ artVariant }).scale > 0, `missing image profile fallback: ${artVariant}`);
}

for (const glyphClass of legacyGlyphs) {
  assert.ok(getCurioArtProfile({ glyphClass }).scale > 0, `missing legacy glyph profile: ${glyphClass}`);
}

assert.equal(getCurioArtProfile({ artVariant: 'pip-pocket-watch' }).scale, getCurioArtProfile({ artVariant: 'pip-rice-bowl' }).scale);
assert.equal(getCurioArtProfile({ artVariant: 'pip-rice-bowl' }).scale, getCurioArtProfile({ artVariant: 'pip-satchel-tag' }).scale);
console.log(`Curio art sizing verification passed: ${imageVariants.length} image variants, ${legacyGlyphs.length} legacy glyphs, shared fit scale ${CURIO_ART_FIT_SCALE}.`);