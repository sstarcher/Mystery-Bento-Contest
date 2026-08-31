import assert from 'node:assert/strict';
import {
  getRaceMomentumAdjustment,
  resolveRaceEncounterResult,
  type RaceMomentumTraits,
} from './race-momentum';

type TestLane = { id: string; traits: RaceMomentumTraits; progress: number };

const contestants: Array<{ id: string; traits: RaceMomentumTraits }> = [
  { id: 'pip', traits: { speed: 90, balance: 50, focus: 50, luck: 60, chaos: 60 } },
  { id: 'sencha', traits: { speed: 50, balance: 80, focus: 100, luck: 30, chaos: 10 } },
  { id: 'nori', traits: { speed: 50, balance: 40, focus: 50, luck: 100, chaos: 70 } },
  { id: 'rollo', traits: { speed: 70, balance: 40, focus: 30, luck: 80, chaos: 100 } },
  { id: 'saffy', traits: { speed: 80, balance: 70, focus: 90, luck: 50, chaos: 40 } },
  { id: 'bibi', traits: { speed: 70, balance: 70, focus: 70, luck: 60, chaos: 50 } },
];

const obstacles = [
  { primaryTrait: 'speed' as const, secondaryTrait: 'focus' as const, kind: 'napkin-gust', position: 18 },
  { primaryTrait: 'focus' as const, secondaryTrait: 'balance' as const, kind: 'tea-puddle', position: 40 },
  { primaryTrait: 'luck' as const, secondaryTrait: 'focus' as const, kind: 'shortcut-reflection', position: 62 },
  { primaryTrait: 'balance' as const, secondaryTrait: 'speed' as const, kind: 'bento-stack', position: 83 },
];

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function runRace(seed: number, roster: typeof contestants, startingOffsets: number[] = []) {
  const rng = createRng(seed);
  const lanes: TestLane[] = roster.map((contestant, index) => ({
    ...contestant,
    progress: 6 + contestant.traits.speed * 0.06
      + (contestant.traits.speed - 50) * 0.11
      + (contestant.traits.chaos - 50) * 0.07
      + rng() * 8 - 4
      + (startingOffsets[index] ?? 0),
  }));
  const leaders: string[] = [];
  const results: string[][] = [];

  obstacles.forEach((obstacle, obstacleIndex) => {
    const ranking = [...lanes].sort((a, b) => b.progress - a.progress);
    const spread = ranking[0].progress - ranking[ranking.length - 1].progress;
    lanes.forEach((lane) => {
      const result = resolveRaceEncounterResult({
        traits: lane.traits,
        primaryTrait: obstacle.primaryTrait,
        secondaryTrait: obstacle.secondaryTrait,
        obstacleKind: obstacle.kind,
        rankIndex: ranking.indexOf(lane),
        laneCount: ranking.length,
        spread,
        rng,
      });
      const delta = result === 'surge' ? 16 : result === 'slow' ? -16 : result === 'reroute' ? -7 : 3;
      const pace = 18 + (lane.traits.speed - 50) * 0.05 + (lane.traits.focus - 50) * 0.015;
      const nextPosition = obstacles[obstacleIndex + 1]?.position ?? 96;
      lane.progress = Math.max(obstacle.position + 1, Math.min(nextPosition - 2, lane.progress + pace + delta));
      if (!results[obstacleIndex]) results[obstacleIndex] = [];
      results[obstacleIndex].push(result);
    });
    leaders.push([...lanes].sort((a, b) => b.progress - a.progress)[0].id);
  });
  return { leaders, results };
}

assert.ok(getRaceMomentumAdjustment(3, 4, 4) > 0, 'a trailing lane should get a beneficial adjustment');
assert.ok(getRaceMomentumAdjustment(0, 4, 4) < 0, 'the leader should get a disruption adjustment');
assert.ok(Math.abs(getRaceMomentumAdjustment(0, 4, 8)) <= 3, 'a close pack should only get a mild adjustment');
assert.equal(getRaceMomentumAdjustment(1, 4, 20), 0, 'middle lanes should retain their authored odds');

const repeatA = runRace(73, contestants.slice(0, 4));
const repeatB = runRace(73, contestants.slice(0, 4));
assert.deepEqual(repeatA, repeatB, 'a seeded race should resolve identically when replayed');

let racesWithLeadChange = 0;
let racesWithMultipleLeadChanges = 0;
let finaleReversals = 0;
for (let seed = 1; seed <= 512; seed += 1) {
  const roster = seed % 4 === 0
    ? contestants.slice(0, 4)
    : contestants.slice((seed * 5) % 3, (seed * 5) % 3 + 3);
  const race = runRace(seed, roster);
  const changeCount = race.leaders.slice(1).filter((leader, index) => leader !== race.leaders[index]).length;
  if (changeCount > 0) racesWithLeadChange += 1;
  if (changeCount > 1) {
    racesWithMultipleLeadChanges += 1;
    if (race.leaders[2] !== race.leaders[1] && race.leaders[3] !== race.leaders[2]) finaleReversals += 1;
  }
}
assert.ok(racesWithLeadChange >= 180, `expected frequent lead changes, got ${racesWithLeadChange}/512`);
assert.ok(racesWithMultipleLeadChanges >= 35, `expected multi-checkpoint swings, got ${racesWithMultipleLeadChanges}/512`);
assert.ok(finaleReversals > 0, 'the final stage should include repeatable reversals');

const largeLead = runRace(19, contestants.slice(0, 3), [12, 0, 0]);
const closePack = runRace(19, contestants.slice(0, 3), [0, 0, 0]);
assert.notDeepEqual(largeLead, closePack, 'rank-aware odds should preserve the difference between close and spread starts');
console.log(`Race momentum verification passed: ${racesWithLeadChange}/512 races changed lead, ${finaleReversals} included finale reversals.`);