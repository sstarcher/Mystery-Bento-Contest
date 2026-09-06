import { strict as assert } from 'node:assert';
import { getCurioDebugState, selectRestaurantShelfCollectibles } from './curio-debug';

assert.deepEqual(getCurioDebugState('?debug'), {
  isDebugMode: true,
  initialShowcaseEnabled: false,
});
assert.deepEqual(getCurioDebugState('?debug='), {
  isDebugMode: true,
  initialShowcaseEnabled: false,
});
assert.deepEqual(getCurioDebugState('?debug=curio-shelf'), {
  isDebugMode: true,
  initialShowcaseEnabled: true,
});
assert.deepEqual(getCurioDebugState('?debug=anything-else'), {
  isDebugMode: true,
  initialShowcaseEnabled: false,
});
assert.deepEqual(getCurioDebugState('?view=restaurant'), {
  isDebugMode: false,
  initialShowcaseEnabled: false,
});

const earned = ['earned-one', 'earned-two'];
const showcase = ['showcase-one', 'showcase-two', 'showcase-three'];
assert.deepEqual(
  selectRestaurantShelfCollectibles(earned, showcase, {
    isDebugMode: false,
    showcaseEnabled: true,
    maxItems: 2,
  }),
  earned,
  'showcase items stay hidden outside debug mode',
);
assert.deepEqual(
  selectRestaurantShelfCollectibles(earned, showcase, {
    isDebugMode: true,
    showcaseEnabled: false,
    maxItems: 2,
  }),
  earned,
  'the unchecked debug control restores earned curios',
);
assert.deepEqual(
  selectRestaurantShelfCollectibles(earned, showcase, {
    isDebugMode: true,
    showcaseEnabled: true,
    maxItems: 2,
  }),
  ['showcase-one', 'showcase-two'],
  'the showcase is bounded to the available shelf cells',
);

console.log('Curio debug tests passed for query-key gating, legacy initialization, and bounded showcase selection.');