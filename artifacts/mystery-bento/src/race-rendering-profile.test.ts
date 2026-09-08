import assert from 'node:assert/strict';
import {
  getRaceRenderingProfile,
  isRaceDebugEnabled,
} from './race-rendering-profile';

const desktop = getRaceRenderingProfile({ deviceMemory: 8, hardwareConcurrency: 8 });
assert.equal(desktop.constrained, false);
assert.equal(desktop.transformSampleIntervalMs, 16);
assert.equal(desktop.useBackdropEffects, true);

const tablet = getRaceRenderingProfile({ deviceMemory: 2, hardwareConcurrency: 4, maxTouchPoints: 5 });
assert.equal(tablet.constrained, true);
assert.equal(tablet.transformSampleIntervalMs, 32);
assert.equal(tablet.useBackdropEffects, false);

const dataSaver = getRaceRenderingProfile({ deviceMemory: 8, hardwareConcurrency: 8, saveData: true });
assert.equal(dataSaver.constrained, true);

const touchTablet = getRaceRenderingProfile({ deviceMemory: 4, hardwareConcurrency: 8, maxTouchPoints: 5 });
assert.equal(touchTablet.constrained, true);

assert.equal(isRaceDebugEnabled('?raceDebug=1'), true);
assert.equal(isRaceDebugEnabled('?raceCheck=109'), true);
assert.equal(isRaceDebugEnabled('?raceCheck=other'), false);
assert.equal(isRaceDebugEnabled(''), false);

console.log('Race rendering profile verification passed.');