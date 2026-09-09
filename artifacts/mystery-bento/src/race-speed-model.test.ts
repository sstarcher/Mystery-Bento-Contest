import assert from 'node:assert/strict';
import {
  getContinuousRunnerPosition,
  getRunnerBaseSpeedMultiplier,
  getRunnerEffectiveSpeed,
  getRunnerFinishCrossingTime,
  getRunnerMovementState,
  getRunnerSpriteCadenceMultiplier,
  buildRunnerTrajectory,
  getRunnerTrajectoryPositionAtTime,
  resolveRunnerFinishOrder,
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
const rerouteProfile: ContinuousRunnerProfile = {
  ...baseProfile,
  events: [{ obstacleId: 'reroute', result: 'reroute', triggerMs: 4_000 }],
};
const finishBoostProfile: ContinuousRunnerProfile = {
  ...baseProfile,
  events: [{
    obstacleId: 'finish',
    result: 'clear',
    triggerMs: 16_000,
    speedMultiplier: 1.08,
    durationMs: 8_000,
  }],
};

assert.equal(getRunnerMovementState(baseProfile, 2_000), 'run');
assert.equal(getRunnerMovementState(slowProfile, 4_500), 'run');
assert.equal(getRunnerMovementState(slowProfile, 7_599), 'run');
assert.equal(getRunnerMovementState(slowProfile, 7_600), 'run');
assert.equal(getRunnerMovementState(surgeProfile, 4_500), 'run');
assert.equal(
  getRunnerSpriteCadenceMultiplier(getRunnerEffectiveSpeed(slowProfile, 4_500)),
  0.58,
  'slowdowns should use the run sheet at a visibly slower frame cadence',
);
assert.equal(
  getRunnerSpriteCadenceMultiplier(getRunnerEffectiveSpeed(baseProfile, 2_000)),
  getRunnerEffectiveSpeed(baseProfile, 2_000),
  'normal run cadence should track the effective speed',
);
assert.ok(
  getRunnerEffectiveSpeed(surgeProfile, 4_500) > getRunnerEffectiveSpeed(baseProfile, 4_500),
  'surge should temporarily increase effective speed',
);
assert.ok(
  getRunnerEffectiveSpeed(slowProfile, 4_500) < getRunnerEffectiveSpeed(baseProfile, 4_500),
  'slow should temporarily decrease effective speed',
);
assert.ok(
  getRunnerEffectiveSpeed(rerouteProfile, 6_999) < getRunnerEffectiveSpeed(baseProfile, 6_999),
  'reroute should remain an active slowdown during its longer recovery window',
);
assert.equal(
  getRunnerEffectiveSpeed(rerouteProfile, 7_000),
  getRunnerEffectiveSpeed(baseProfile, 7_000),
  'reroute should recover only after its full authored window',
);
assert.ok(
  getRunnerEffectiveSpeed(finishBoostProfile, 16_500)
    > getRunnerEffectiveSpeed(baseProfile, 16_500),
  'custom finish boosts should increase effective speed during their authored window',
);
assert.equal(
  getRunnerEffectiveSpeed(finishBoostProfile, 24_000),
  getRunnerEffectiveSpeed(baseProfile, 24_000),
  'custom finish boosts should end at their explicit duration',
);

const normalAtEnd = getContinuousRunnerPosition(baseProfile, raceDurationMs, courseTravelEnd, raceDurationMs);
const slowAtEnd = getContinuousRunnerPosition(slowProfile, raceDurationMs, courseTravelEnd, raceDurationMs);
const surgeAtEnd = getContinuousRunnerPosition(surgeProfile, raceDurationMs, courseTravelEnd, raceDurationMs);
const finishBoostAtEnd = getContinuousRunnerPosition(
  finishBoostProfile,
  raceDurationMs,
  courseTravelEnd + 24,
  raceDurationMs,
);
const normalDuringImpact = getContinuousRunnerPosition(baseProfile, 7_000, courseTravelEnd, raceDurationMs);
const surgeDuringImpact = getContinuousRunnerPosition(surgeProfile, 7_000, courseTravelEnd, raceDurationMs);
assert.ok(slowAtEnd < normalAtEnd, 'slow should leave the runner behind the reference pace');
assert.ok(surgeAtEnd > normalAtEnd, 'surge should leave the runner ahead of the reference pace');
assert.ok(
  normalAtEnd - slowAtEnd >= 10,
  'slow obstacles should leave a clearly visible gap by the finish',
);
assert.ok(
  surgeDuringImpact - normalDuringImpact >= 8,
  'surge obstacles should create a clearly visible lead during the active impact window',
);
assert.ok(
  surgeAtEnd - normalAtEnd >= 4,
  'surge obstacles should preserve a visible lead by the finish',
);
assert.ok(
  finishBoostAtEnd > normalAtEnd,
  'custom finish boosts should preserve an authored lead at the shared finish timestamp',
);
assert.ok(
  getContinuousRunnerPosition(baseProfile, 0, courseTravelEnd, raceDurationMs) === baseProfile.startPosition,
  'continuous movement should start at the authored starting position',
);
const finishThreshold = 88;
const baseFinishCrossingTime = getRunnerFinishCrossingTime(
  baseProfile,
  finishThreshold,
  courseTravelEnd,
  raceDurationMs,
);
assert.notEqual(baseFinishCrossingTime, null, 'the baseline runner should cross the finish threshold');
assert.ok(
  getContinuousRunnerPosition(baseProfile, baseFinishCrossingTime ?? 0, courseTravelEnd, raceDurationMs) >= finishThreshold,
  'the crossing snapshot should reach the finish threshold',
);
assert.ok(
  getContinuousRunnerPosition(baseProfile, (baseFinishCrossingTime ?? 1) - 1, courseTravelEnd, raceDurationMs) < finishThreshold,
  'the first crossing should not be resolved before the threshold is reached',
);
const baseFinishTrajectory = buildRunnerTrajectory(
  baseProfile,
  courseTravelEnd,
  raceDurationMs,
  1_000,
  baseFinishCrossingTime,
);
assert.equal(
  getRunnerTrajectoryPositionAtTime(baseFinishTrajectory, 0),
  baseProfile.startPosition,
  'resolved trajectory should begin at the authored starting position',
);
assert.equal(
  getRunnerTrajectoryPositionAtTime(baseFinishTrajectory, baseFinishCrossingTime ?? 0),
  getContinuousRunnerPosition(baseProfile, baseFinishCrossingTime ?? 0, courseTravelEnd, raceDurationMs),
  'resolved trajectory should include the exact finish crossing point',
);
assert.ok(
  getRunnerTrajectoryPositionAtTime(baseFinishTrajectory, raceDurationMs)
    > getRunnerTrajectoryPositionAtTime(baseFinishTrajectory, baseFinishCrossingTime ?? 0),
  'the terminal trajectory should continue beyond the first finish crossing',
);
assert.equal(
  getRunnerTrajectoryPositionAtTime(baseFinishTrajectory, raceDurationMs),
  getContinuousRunnerPosition(baseProfile, raceDurationMs, courseTravelEnd, raceDurationMs),
  'the terminal finish frame should use the completed continuous trajectory',
);
assert.deepEqual(
  resolveRunnerFinishOrder([
    { personaId: 'first', finishCrossingMs: 10_000 },
    { personaId: 'roster-tie-break', finishCrossingMs: 10_025 },
    { personaId: 'late', finishCrossingMs: 10_400 },
  ]),
  ['first', 'roster-tie-break', 'late'],
  'near-simultaneous crossings should use deterministic roster order',
);

console.log('Race speed model verification passed: stat pace, slow recovery, and surge distance are deterministic.');