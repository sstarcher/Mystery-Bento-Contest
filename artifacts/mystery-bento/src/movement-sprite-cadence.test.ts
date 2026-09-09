import assert from 'node:assert/strict';
import {
  getMovementFrameDurationMs,
  shouldUseImperativeIntroCadence,
} from './movement-sprite-cadence';

assert.equal(shouldUseImperativeIntroCadence('idle', true, false, 12), true);
assert.equal(shouldUseImperativeIntroCadence('run', true, false, 12), false);
assert.equal(shouldUseImperativeIntroCadence('idle', false, false, 12), false);
assert.equal(shouldUseImperativeIntroCadence('idle', true, true, 12), false);
assert.equal(shouldUseImperativeIntroCadence('idle', true, false, 1), false);

const authoredDuration = getMovementFrameDurationMs(1000 / 12, 1, false);
assert.equal(authoredDuration, Math.round((1000 / 12 / 1.08)));
assert.equal(getMovementFrameDurationMs(1000 / 12, 1, true), Math.round((1000 / 12) / 1.08) / 2);
console.log('Movement sprite cadence verification passed.');