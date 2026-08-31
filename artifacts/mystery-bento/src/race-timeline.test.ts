import assert from 'node:assert/strict';
import {
  getFirstRunnerObstacleHitOffset,
  getRaceFinishCrossingOffset,
  getRaceLaneProgressAtTime,
  getRaceStageObstacleMilestones,
  getRaceWorldScreenAnchor,
  getRaceWorldTravelPercentAtTime,
  RACE_FINALE_WORLD_END_PERCENT,
  RACE_MATCHUP_WORLD_END_PERCENT,
  RACE_STAGE_DURATIONS,
  RACE_WARMUP_WORLD_END_PERCENT,
  type RaceTimelineLane,
  type RaceTimelineObstacle,
  type RaceTimelineStage,
} from './race-timeline';

const obstacles: RaceTimelineObstacle[] = [
  { id: 'napkin', position: 18 },
  { id: 'moon-reflection', position: 40 },
  { id: 'finish-hazard', position: 62 },
  { id: 'last-hazard', position: 83 },
];

const lineups: RaceTimelineLane[][] = [
  [
    { positions: { intro: 8, warmup: 29, matchup: 47, finale: 85, winner: 92 }, encounters: {} },
    { positions: { intro: 10, warmup: 31, matchup: 51, finale: 88, winner: 94 }, encounters: {} },
    { positions: { intro: 7, warmup: 27, matchup: 49, finale: 82, winner: 90 }, encounters: {} },
  ],
  [
    { positions: { intro: 12, warmup: 26, matchup: 44, finale: 86, winner: 91 }, encounters: {} },
    { positions: { intro: 6, warmup: 33, matchup: 54, finale: 84, winner: 95 }, encounters: {} },
  ],
];

const stageObstacle: Record<Exclude<RaceTimelineStage, 'intro' | 'winner'>, number> = {
  warmup: 0,
  matchup: 1,
  finale: 2,
};

for (const lanes of lineups) {
  for (const [stage, obstacleIndex] of Object.entries(stageObstacle) as [Exclude<RaceTimelineStage, 'intro' | 'winner'>, number][]) {
    const obstacle = obstacles[obstacleIndex];
    const firstOffset = getFirstRunnerObstacleHitOffset(stage, obstacle, lanes, obstacles);
    assert.equal(firstOffset, Math.min(...lanes.map((lane) => getRaceStageObstacleMilestones(stage, lane, obstacles)
      .find((milestone) => milestone.obstacle.id === obstacle.id)?.offset ?? RACE_STAGE_DURATIONS[stage])));

    for (const lane of lanes) {
      const milestone = getRaceStageObstacleMilestones(stage, lane, obstacles)
        .find((candidate) => candidate.obstacle.id === obstacle.id);
      assert.ok(milestone, `${stage} should expose its obstacle milestone`);
      assert.equal(
        getRaceLaneProgressAtTime(stage, lane, obstacles, milestone.offset, false),
        obstacle.position,
        `${stage} runner should cross its obstacle at the resolved milestone`,
      );
    }
  }
}

assert.equal(getRaceWorldTravelPercentAtTime('warmup', RACE_STAGE_DURATIONS.warmup, false), RACE_WARMUP_WORLD_END_PERCENT);
assert.equal(getRaceWorldTravelPercentAtTime('matchup', RACE_STAGE_DURATIONS.matchup, false), RACE_MATCHUP_WORLD_END_PERCENT);
assert.equal(getRaceWorldTravelPercentAtTime('finale', RACE_STAGE_DURATIONS.finale, false), RACE_FINALE_WORLD_END_PERCENT);
assert.equal(getRaceWorldTravelPercentAtTime('matchup', 0, false), RACE_WARMUP_WORLD_END_PERCENT);
assert.equal(getRaceWorldTravelPercentAtTime('finale', 0, false), RACE_MATCHUP_WORLD_END_PERCENT);
assert.equal(getRaceFinishCrossingOffset(false), RACE_STAGE_DURATIONS.finale);
assert.equal(getRaceFinishCrossingOffset(true), 0);

const moonLane = lineups[0][1];
const moonMilestone = getRaceStageObstacleMilestones('matchup', moonLane, obstacles)
  .find((milestone) => milestone.obstacle.id === 'moon-reflection');
assert.ok(moonMilestone);
const moonWorldTravel = getRaceWorldTravelPercentAtTime(
  'matchup',
  moonMilestone.offset,
  false,
);
assert.equal(
  getRaceWorldScreenAnchor(moonMilestone.position, moonWorldTravel),
  getRaceWorldScreenAnchor(obstacles[1].position, moonWorldTravel),
  'moon reflection cue and runner should share the same projected crossing anchor',
);

assert.equal(getFirstRunnerObstacleHitOffset('warmup', obstacles[0], lineups[0], obstacles, true), 0);
console.log(`Race timeline verification passed for ${lineups.length} deterministic lineups.`);