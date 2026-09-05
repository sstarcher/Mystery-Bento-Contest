import assert from 'node:assert/strict';
import {
  getContinuousRunnerPosition,
  getRunnerBaseSpeedMultiplier,
  getRunnerEffectiveSpeed,
  getRunnerMovementState,
  type ContinuousRunnerProfile,
} from './race-speed-model';

const raceDurationMs = 25_600;
const courseTravelEnd = 83.333;

const baseProfile: ContinuousRunnerProfile = {
  startPosition: 8,
  baseSpeedMultiplier: getRunnerBaseSpeedMultiplier(50),
  events: [],
};

const fastProfile: ContinuousRunnerProfile = {
  ...baseProfile,
  baseSpeedMultiplier: getRunnerBaseSpeedMultiplier(100),
};

assert.ok(
  fastProfile.baseSpeedMultiplier > baseProfile.baseSpeedMultiplier,
  'speed traits should create a bounded base-speed difference',
);
assert.ok(
  fastProfile.baseSpeedMultiplier - baseProfile.baseSpeedMultiplier <= 0.04,
  'speed traits should only create a small base-speed difference',
);

const slowProfile: ContinuousRunnerProfile = {
  ...baseProfile,
  events: [{ obstacleId: 'slow', result: 'slow', triggerMs: 4_000 }],
};
const surgeProfile: ContinuousRunnerProfile = {
  ...baseProfile,
  events: [{ obstacleId: 'surge', result: 'surge', triggerMs: 4_000 }],
};

assert.equal(getRunnerMovementState(baseProfile, 2_000), 'run');
assert.equal(getRunnerMovementState(slowProfile, 4_500), 'walk');
assert.equal(getRunnerMovementState(slowProfile, 6_000), 'run');
assert.equal(getRunnerMovementState(surgeProfile, 4_500), 'run');
assert.ok(
  getRunnerEffectiveSpeed(surgeProfile, 4_500) > getRunnerEffectiveSpeed(baseProfile, 4_500),
  'surge should temporarily increase effective speed',
);
assert.ok(
  getRunnerEffectiveSpeed(slowProfile, 4_500) < getRunnerEffectiveSpeed(baseProfile, 4_500),
  'slow should temporarily decrease effective speed',
);

const normalAtEnd = getContinuousRunnerPosition(baseProfile, raceDurationMs, courseTravelEnd, raceDurationMs);
const slowAtEnd = getContinuousRunnerPosition(slowProfile, raceDurationMs, courseTravelEnd, raceDurationMs);
const surgeAtEnd = getContinuousRunnerPosition(surgeProfile, raceDurationMs, courseTravelEnd, raceDurationMs);
assert.ok(slowAtEnd < normalAtEnd, 'slow should leave the runner behind the reference pace');
assert.ok(surgeAtEnd > normalAtEnd, 'surge should leave the runner ahead of the reference pace');
assert.ok(
  getContinuousRunnerPosition(baseProfile, 0, courseTravelEnd, raceDurationMs) === baseProfile.startPosition,
  'continuous movement should start at the authored starting position',
);

console.log('Race speed model verification passed: stat pace, slow recovery, and surge distance are deterministic.');