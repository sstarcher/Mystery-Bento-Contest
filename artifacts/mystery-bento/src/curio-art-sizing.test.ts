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
  'saffy-garnish-plate',
  'saffy-plating-tweezers',
  'saffy-presentation-fan',
];

assert.ok(CURIO_ART_FIT_SCALE > 0 && CURIO_ART_FIT_SCALE < 1, 'shared fit scale must reduce the art');
assert.equal(CURIO_ART_FIT_SCALE, 0.86 * 0.9, 'shared fit scale must reduce the previous curio size by exactly 10%');
assert.equal(getCurioArtProfile({}).scale, CURIO_ART_PROFILES['image-default'].scale);
assert.equal(Object.keys(CURIO_ART_PROFILES).some((key) => key.startsWith('glyph-')), false, 'legacy glyph profiles must be removed');

for (const artVariant of imageVariants) {
  assert.ok(getCurioArtProfile({ artVariant }).scale > 0, `missing image profile fallback: ${artVariant}`);
}

assert.equal(getCurioArtProfile({ artVariant: 'pip-pocket-watch' }).scale, getCurioArtProfile({ artVariant: 'pip-rice-bowl' }).scale);
assert.equal(getCurioArtProfile({ artVariant: 'pip-rice-bowl' }).scale, getCurioArtProfile({ artVariant: 'pip-satchel-tag' }).scale);
console.log(`Curio art sizing verification passed: ${imageVariants.length} image variants, no legacy glyph profiles, shared fit scale ${CURIO_ART_FIT_SCALE}.`);