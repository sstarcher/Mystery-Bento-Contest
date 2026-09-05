import assert from 'node:assert/strict';
import { selectContestants } from './contest-roster';

const contestants = [{ id: 'pip' }, { id: 'kiku' }, { id: 'miso' }, { id: 'nori' }];
const selected = selectContestants(contestants, 'kiku', () => 0.25);

assert.equal(selected.length, 3, 'each contest should select exactly three contestants');
assert.ok(!selected.some((contestant) => contestant.id === 'kiku'), 'the previous winner cannot re-enter the next contest');
assert.equal(new Set(selected.map((contestant) => contestant.id)).size, 3, 'a roster cannot contain duplicate contestants');

const withoutExclusion = selectContestants(contestants, null, () => 0.75);
assert.equal(withoutExclusion.length, 3, 'a first contest should still select exactly three contestants');

console.log('Contest roster verification passed: three unique contestants with previous-winner exclusion.');