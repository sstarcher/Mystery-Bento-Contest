import { strict as assert } from 'node:assert';
import {
  CURIO_SHELF_GRID,
  curioPlacementsEqual,
  normalizeCurioPlacements,
  reconcileCurioPlacements,
  type CurioShelfPlacement,
} from './curio-shelf-placements';

function assertInGrid(placement: CurioShelfPlacement) {
  assert.ok(Number.isInteger(placement.cell));
  assert.ok(placement.cell >= 0 && placement.cell < CURIO_SHELF_GRID.cellCount);
}

function assertUniqueCells(placements: CurioShelfPlacement[]) {
  assert.equal(new Set(placements.map((placement) => placement.cell)).size, placements.length);
}

const initial = reconcileCurioPlacements(['watch', 'bowl', 'tag'], {}, () => 0);
assert.equal(Object.keys(initial).length, 3);
Object.values(initial).forEach(assertInGrid);
assertUniqueCells(Object.values(initial));

const fullShelf = reconcileCurioPlacements(
  ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'],
  {},
  () => 0.37,
);
assert.equal(Object.keys(fullShelf).length, 16, 'the full displayed shelf receives one placement per curio');
Object.values(fullShelf).forEach(assertInGrid);
assertUniqueCells(Object.values(fullShelf));

const afterNewCurio = reconcileCurioPlacements(['watch', 'bowl', 'tag', 'bell'], initial, () => 0.99);
assert.deepEqual(afterNewCurio.watch, initial.watch, 'existing curios keep their placements');
assert.deepEqual(afterNewCurio.bowl, initial.bowl, 'existing curios keep their placements');
assert.deepEqual(afterNewCurio.tag, initial.tag, 'existing curios keep their placements');
assert.ok(afterNewCurio.bell, 'new curios receive a placement');
assertUniqueCells(Object.values(afterNewCurio));

const pruned = reconcileCurioPlacements(['watch'], { ...afterNewCurio, obsolete: { x: 50, y: 50 } }, () => 0);
assert.deepEqual(Object.keys(pruned), ['watch'], 'placements for hidden curios are pruned');
assert.deepEqual(pruned.watch, initial.watch);
assert.ok(curioPlacementsEqual(pruned, { watch: initial.watch }));
assert.deepEqual(
  reconcileCurioPlacements(['watch', 'bowl'], afterNewCurio, () => 0.5),
  { watch: afterNewCurio.watch, bowl: afterNewCurio.bowl },
  'reconciling without changes is stable',
);

const resetFirst = reconcileCurioPlacements(['watch'], {}, () => 0);
const resetSecond = reconcileCurioPlacements(['watch'], {}, () => 0.99);
assert.notDeepEqual(resetFirst.watch, resetSecond.watch, 'a cleared placement map allocates a fresh shelf position');

assert.deepEqual(
  normalizeCurioPlacements({
    good: { cell: 3 },
    outside: { cell: 21 },
    malformed: { cell: 3.5 } as CurioShelfPlacement,
  }),
  { good: { cell: 3 } },
);

console.log('Curio shelf placement tests passed for stable reuse, random grid-cell allocation, reset, and pruning.');