import assert from 'node:assert/strict';
import {
  getFirstRunnerObstacleHitOffset,
  getRaceFinishCrossingOffset,
  getRaceAnnouncementRevealOffsets,
  getRaceLaneProgressAtTime,
  getRaceRunnerScreenAnchors,
  getRaceStageObstacleMilestones,
  getRaceWorldScreenAnchor,
  getRaceWorldTravelPercentAtTime,
  RACE_FINALE_WORLD_END_PERCENT,
  RACE_MATCHUP_WORLD_END_PERCENT,
  RACE_RUNNER_MAX_SPREAD_PERCENT,
  RACE_RUNNER_SCREEN_MAX_PERCENT,
  RACE_RUNNER_SCREEN_MIN_PERCENT,
  RACE_RUNNER_VISUAL_START_PERCENT,
  RACE_RUNNER_VISUAL_MAX_DISTANCE,
  RACE_WORLD_TRACK_WIDTH_MULTIPLIER,
  RACE_STAGE_DURATIONS,
  RACE_WARMUP_WORLD_END_PERCENT,
  RACE_RUNNER_LANE_HEIGHT_PX,
  RACE_RUNNER_PRESENTATION_TOP_PX,
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
assert.deepEqual(
  getRaceAnnouncementRevealOffsets(640, [700, 820, 910], 80),
  [720, 1500, 2400],
  'each card reveal should begin at its name clip start, not after the clip ends',
);
assert.ok(RACE_RUNNER_PRESENTATION_TOP_PX >= 380 + 30, 'runner presentation should move down by about 30px');
assert.ok(
  RACE_RUNNER_PRESENTATION_TOP_PX + (4 - 1) * RACE_RUNNER_LANE_HEIGHT_PX - 64 + 216 <= 800,
  'the lowest supported lane should remain inside the fixed race canvas',
);

const checkpointLane: RaceTimelineLane = {
  positions: { intro: 10, warmup: 30, matchup: 52, finale: 90, winner: 94 },
  encounters: {
    'finish-hazard': { result: 'surge' },
    'last-hazard': { result: 'slow' },
  },
  checkpoints: [
    { obstacleId: 'finish-hazard', approachPosition: 52, crossingPosition: 62, exitPosition: 70 },
    { obstacleId: 'last-hazard', approachPosition: 70, crossingPosition: 83, exitPosition: 90 },
  ],
};
const checkpointMilestones = getRaceStageObstacleMilestones('finale', checkpointLane, obstacles);
const finishCheckpoint = checkpointMilestones.find((milestone) => milestone.obstacle.id === 'finish-hazard');
assert.ok(finishCheckpoint);
assert.equal(finishCheckpoint.position, 62, 'checkpoint crossing should stay on the authored obstacle position');
assert.equal(
  getRaceLaneProgressAtTime('finale', checkpointLane, obstacles, finishCheckpoint.exitOffset, false),
  70,
  'checkpoint exit should be visible after the encounter reaction',
);

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
assert.equal(
  getRaceWorldScreenAnchor(50, 40),
  `${(50 - 40) * RACE_WORLD_TRACK_WIDTH_MULTIPLIER}.000%`,
  'full-width race projection should use the six-panel world track',
);

const parseAnchors = (anchors: number[]) => anchors.map((anchor) => Number(anchor.toFixed(3)));
const sharedStart = [8, 10, 7, 12];
const boundedAnchors = parseAnchors(getRaceRunnerScreenAnchors([8, 60, 100, 95], sharedStart));
assert.ok(
  boundedAnchors.every((anchor) => anchor >= RACE_RUNNER_SCREEN_MIN_PERCENT && anchor <= RACE_RUNNER_SCREEN_MAX_PERCENT),
  'oversized runners should stay within the visible race viewport',
);
assert.ok(
  Math.max(...boundedAnchors) - Math.min(...boundedAnchors) <= RACE_RUNNER_MAX_SPREAD_PERCENT,
  'runner projection should cap the visible pack spread',
);
assert.deepEqual(
  parseAnchors(getRaceRunnerScreenAnchors(sharedStart, sharedStart)),
  [RACE_RUNNER_VISUAL_START_PERCENT, RACE_RUNNER_VISUAL_START_PERCENT, RACE_RUNNER_VISUAL_START_PERCENT, RACE_RUNNER_VISUAL_START_PERCENT],
  'all contestants should share one visual starting position',
);
assert.deepEqual(
  parseAnchors(getRaceRunnerScreenAnchors(
    sharedStart.map((position) => position + RACE_RUNNER_VISUAL_MAX_DISTANCE),
    sharedStart,
  )),
  [RACE_RUNNER_VISUAL_START_PERCENT + RACE_RUNNER_MAX_SPREAD_PERCENT,
    RACE_RUNNER_VISUAL_START_PERCENT + RACE_RUNNER_MAX_SPREAD_PERCENT,
    RACE_RUNNER_VISUAL_START_PERCENT + RACE_RUNNER_MAX_SPREAD_PERCENT,
    RACE_RUNNER_VISUAL_START_PERCENT + RACE_RUNNER_MAX_SPREAD_PERCENT],
  'visual travel should stop at a bounded forward finish position',
);
const beforeAdvance = getRaceRunnerScreenAnchors([24, 27, 22, 30], sharedStart);
const afterAdvance = getRaceRunnerScreenAnchors([31, 35, 29, 38], sharedStart);
assert.ok(
  afterAdvance.every((anchor, index) => anchor >= beforeAdvance[index]),
  'visual runner anchors should never reverse as race progress advances',
);

assert.equal(getFirstRunnerObstacleHitOffset('warmup', obstacles[0], lineups[0], obstacles, true), 0);
console.log(`Race timeline verification passed for ${lineups.length} deterministic lineups.`);