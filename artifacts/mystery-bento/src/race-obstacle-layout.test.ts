import assert from 'node:assert/strict';
import {
  getRaceObstacleBottomPx,
  getRaceObstacleLeftCss,
  RACE_OBSTACLE_PLACEMENTS,
} from './race-obstacle-layout';

assert.deepEqual(
  RACE_OBSTACLE_PLACEMENTS.map(({ position }) => position),
  [18, 40, 62, 83],
  'live race checkpoints and Track inspector checkpoints should share the same course positions',
);

assert.deepEqual(
  RACE_OBSTACLE_PLACEMENTS.map((_, index) => getRaceObstacleLeftCss(index)),
  [
    'calc(18% + 200px)',
    '40%',
    '62%',
    'calc(83% + 200px)',
  ],
  'live race and Track inspector should share horizontal obstacle offsets',
);

assert.deepEqual(
  RACE_OBSTACLE_PLACEMENTS.map((_, index) => getRaceObstacleBottomPx(index)),
  [130, undefined, 260, undefined],
  'live race and Track inspector should share vertical obstacle offsets',
);

console.log('Race obstacle layout verification passed: live and Track placements stay in sync.');