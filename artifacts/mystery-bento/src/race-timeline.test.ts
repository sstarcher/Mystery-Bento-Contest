import assert from 'node:assert/strict';
import {
  getFirstRunnerObstacleHitOffset,
  getRaceFinishCrossingOffset,
  getRaceRunnerFinishAction,
  getRaceAnnouncementRevealOffsets,
  getRaceAnnouncementCompletionDelay,
  getRaceLaneProgressAtTime,
  getRaceRunnerScreenAnchors,
  getRaceRunnerObstacleContactOffset,
  getRaceStartHandoffTiming,
  getRaceStageObstacleMilestones,
  getRaceWorldScreenAnchor,
  getRaceWorldTravelPercentAtTime,
  RACE_FINALE_WORLD_END_PERCENT,
  RACE_LAST_CONTESTANT_PAUSE_MS,
  RACE_MATCHUP_WORLD_END_PERCENT,
  RACE_OBSTACLE_CONTACT_WINDOW_PERCENT,
  RACE_RACE_DURATION_MS,
  RACE_RUNNER_MAX_SPREAD_PERCENT,
  RACE_RUNNER_SCREEN_MAX_PERCENT,
  RACE_RUNNER_SCREEN_MIN_PERCENT,
  RACE_RUNNER_VISUAL_START_PERCENT,
  RACE_RUNNER_VISUAL_MAX_DISTANCE,
  RACE_WORLD_TRACK_WIDTH_MULTIPLIER,
  RACE_STAGE_DURATIONS,
  RACE_WARMUP_WORLD_END_PERCENT,
  RACE_RUNNER_LANE_HEIGHT_PX,
  RACE_RUNNER_NORMALIZED_BASELINE_MAX_PX,
  RACE_RUNNER_PRESENTATION_TOP_PX,
  RACE_STAGE_OFFSETS,
  type RaceTimelineLane,
  type RaceTimelineObstacle,
  type RaceTimelineStage,
} from './race-timeline';
import { getMovementSpriteRenderStyle, movementSpriteNormalization } from './movement-sprite-normalization';
import { getContinuousRunnerPosition } from './race-speed-model';

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

assert.ok(Math.abs(getRaceWorldTravelPercentAtTime('warmup', RACE_STAGE_DURATIONS.warmup, false) - RACE_WARMUP_WORLD_END_PERCENT) < 1e-9);
assert.ok(Math.abs(getRaceWorldTravelPercentAtTime('matchup', RACE_STAGE_DURATIONS.matchup, false) - RACE_MATCHUP_WORLD_END_PERCENT) < 1e-9);
assert.ok(Math.abs(getRaceWorldTravelPercentAtTime('finale', RACE_STAGE_DURATIONS.finale, false) - RACE_FINALE_WORLD_END_PERCENT) < 1e-9);
assert.ok(Math.abs(getRaceWorldTravelPercentAtTime('matchup', 0, false) - RACE_WARMUP_WORLD_END_PERCENT) < 1e-9);
assert.ok(Math.abs(getRaceWorldTravelPercentAtTime('finale', 0, false) - RACE_MATCHUP_WORLD_END_PERCENT) < 1e-9);
assert.equal(getRaceFinishCrossingOffset(false), RACE_STAGE_DURATIONS.finale);
assert.equal(getRaceRunnerFinishAction(false, true), undefined);
assert.equal(getRaceRunnerFinishAction(true, true), 'victory');
assert.equal(getRaceRunnerFinishAction(true, false), 'fall');
assert.equal(getRaceFinishCrossingOffset(true), 0);
assert.deepEqual(
  getRaceAnnouncementRevealOffsets(640, [700, 820, 910], 80),
  [720, 1500, 2400],
  'each card reveal should begin at its name clip start, not after the clip ends',
);
const raceStartHandoff = getRaceStartHandoffTiming(
  1330,
  [850, 900, 800, 800],
  80,
  6350,
  520,
);
assert.deepEqual(
  raceStartHandoff.nameRevealOffsets,
  [1410, 2340, 3320, 4200],
  'roster cards should reveal from the start of each name clip',
);
assert.equal(
  raceStartHandoff.raceStartOffset - raceStartHandoff.finalNameEndOffset,
  RACE_LAST_CONTESTANT_PAUSE_MS,
  'the final name should hold for the one-second handoff pause',
);
assert.equal(
  raceStartHandoff.announcementEndOffset,
  raceStartHandoff.raceStartOffset + 6350,
  'the start announcement should have its own visible duration',
);
assert.equal(
  raceStartHandoff.movementStartOffset,
  raceStartHandoff.announcementEndOffset + 520,
  'the race clock should begin only after the start announcement and its audio gap',
);
assert.ok(
  raceStartHandoff.movementStartOffset < RACE_STAGE_DURATIONS.intro,
  'the complete roster-to-race handoff should fit inside the intro budget',
);
assert.deepEqual(
  RACE_STAGE_OFFSETS,
  {
    intro: 0,
    warmup: 0,
    matchup: RACE_STAGE_DURATIONS.warmup,
    finale: RACE_STAGE_DURATIONS.warmup + RACE_STAGE_DURATIONS.matchup,
    winner: RACE_STAGE_DURATIONS.warmup + RACE_STAGE_DURATIONS.matchup + RACE_STAGE_DURATIONS.finale,
  },
  'visual race stages should use an origin at the starting-lantern handoff',
);
const handoffLane = lineups[0][0];
assert.equal(
  getRaceWorldTravelPercentAtTime('intro', raceStartHandoff.raceStartOffset, false),
  0,
  'the race course should remain at its visible starting view during the announcement',
);
assert.equal(
  getRaceLaneProgressAtTime('intro', handoffLane, obstacles, raceStartHandoff.announcementEndOffset, false),
  handoffLane.positions.intro,
  'runners should remain at the starting line until the announcement completes',
);
assert.equal(
  getRaceLaneProgressAtTime('warmup', handoffLane, obstacles, 0, false),
  handoffLane.positions.intro,
  'movement should begin at the race clock zero boundary',
);
assert.ok(
  getRaceLaneProgressAtTime('warmup', handoffLane, obstacles, 1, false) > handoffLane.positions.intro,
  'movement should advance after the race clock starts',
);
assert.equal(
  getRaceWorldTravelPercentAtTime('warmup', 0, false),
  0,
  'the first post-handoff frame should still be at the starting view',
);
assert.equal(
  getRaceWorldTravelPercentAtTime('matchup', RACE_STAGE_DURATIONS.matchup, false),
  RACE_MATCHUP_WORLD_END_PERCENT,
  'the matchup world endpoint should use the race-relative stage duration',
);
const normalizedRunStyle = getMovementSpriteRenderStyle(movementSpriteNormalization.miso.run);
assert.deepEqual(
  normalizedRunStyle,
  {
    frameTransform: 'scale(2.022)',
    frameTransformOrigin: '50% 100%',
    spriteTransform: 'translateY(105.2px)',
  },
  'runtime movement rendering should apply both scale and baseline normalization metadata',
);
assert.notEqual(
  normalizedRunStyle.frameTransform,
  getMovementSpriteRenderStyle(movementSpriteNormalization.miso.idle).frameTransform,
  'action changes should preserve per-action normalization rather than reusing idle sizing',
);
const fallbackDelay = getRaceAnnouncementCompletionDelay(6350, 520);
const mutedFallbackCompletion = raceStartHandoff.raceStartOffset + fallbackDelay;
const unavailableFallbackCompletion = raceStartHandoff.raceStartOffset + fallbackDelay;
assert.equal(
  unavailableFallbackCompletion,
  mutedFallbackCompletion,
  'unavailable audio should use the same deterministic timing fallback as muted audio',
);
assert.ok(
  RACE_RUNNER_PRESENTATION_TOP_PX <= 470,
  'runner presentation should move up by another 20px from the lower-half layout',
);
assert.ok(
  RACE_RUNNER_PRESENTATION_TOP_PX
    + (3 - 1) * RACE_RUNNER_LANE_HEIGHT_PX
    - 64
    + RACE_RUNNER_NORMALIZED_BASELINE_MAX_PX <= 800,
  'the lowest three-runner normalized baseline should remain inside the fixed race canvas',
);
assert.ok(
  RACE_RUNNER_LANE_HEIGHT_PX >= 87,
  'runner lanes should keep another 10px of vertical separation',
);
assert.equal(
  RACE_STAGE_DURATIONS.winner,
  10_640,
  'winner reveal should return to the stall 30% sooner',
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
  `${((50 - 40) * RACE_WORLD_TRACK_WIDTH_MULTIPLIER).toFixed(3)}%`,
  'full-width race projection should use the proportional panorama track',
);

const contactLane = lineups[0][0];
const contactObstacle = obstacles[0];
const contactOffset = getRaceRunnerObstacleContactOffset(
  'warmup',
  contactObstacle,
  contactLane,
  obstacles,
  (elapsedMs) => contactLane.positions.intro
    + (contactLane.positions.warmup - contactLane.positions.intro)
      * Math.min(1, Math.max(0, elapsedMs / RACE_STAGE_DURATIONS.warmup)),
);
const contactRunnerAnchor = (elapsedMs: number) => getRaceRunnerScreenAnchors(
  [contactLane.positions.intro
    + (contactLane.positions.warmup - contactLane.positions.intro)
      * Math.min(1, Math.max(0, elapsedMs / RACE_STAGE_DURATIONS.warmup))],
  [contactLane.positions.intro],
)[0];
const contactObstacleAnchor = (elapsedMs: number) => Number.parseFloat(getRaceWorldScreenAnchor(
  contactObstacle.position,
  getRaceWorldTravelPercentAtTime('warmup', elapsedMs, false),
));
assert.ok(
  Math.abs((contactObstacleAnchor(contactOffset) ?? 0) - (contactRunnerAnchor(contactOffset) ?? 0)) <= RACE_OBSTACLE_CONTACT_WINDOW_PERCENT,
  'speed triggers should begin inside the same rendered contact window as live reactions',
);
assert.ok(
  contactOffset === 0
    || (contactObstacleAnchor(contactOffset - 1) ?? 0) - (contactRunnerAnchor(contactOffset - 1) ?? 0) > RACE_OBSTACLE_CONTACT_WINDOW_PERCENT,
  'contact solving should choose the first entry into the rendered contact window',
);
assert.equal(
  contactOffset,
  getRaceRunnerObstacleContactOffset(
    'warmup',
    contactObstacle,
    contactLane,
    obstacles,
    (elapsedMs) => contactLane.positions.intro
      + (contactLane.positions.warmup - contactLane.positions.intro)
        * Math.min(1, Math.max(0, elapsedMs / RACE_STAGE_DURATIONS.warmup)),
  ),
  'identical lane inputs should resolve contact timing deterministically',
);

const resolvedContest = {
  winnerId: 'runner-b',
  collectibleId: 'runner-b-curio',
};
const resolvedWinnerLane: RaceTimelineLane = {
  positions: { intro: 9, warmup: 31, matchup: 55, finale: 78, winner: 82 },
  encounters: {},
};
const stagedNonWinnerLane: RaceTimelineLane = {
  positions: { intro: 11, warmup: 34, matchup: 58, finale: 84, winner: 94 },
  encounters: {},
};
const resolvedWinnerProfile = {
  startPosition: resolvedWinnerLane.positions.intro,
  baseSpeedMultiplier: 1.02,
  events: [],
};
const normalResolvedWinnerPosition = getContinuousRunnerPosition(
  resolvedWinnerProfile,
  RACE_RACE_DURATION_MS,
  RACE_FINALE_WORLD_END_PERCENT,
  RACE_RACE_DURATION_MS,
);
const reducedResolvedWinnerPosition = getRaceLaneProgressAtTime(
  'winner',
  resolvedWinnerLane,
  obstacles,
  0,
  true,
);
const getFinishSnapshot = (prefersReducedMotion: boolean) => ({
  winnerId: resolvedContest.winnerId,
  collectibleId: resolvedContest.collectibleId,
  finishCrossed: getRaceFinishCrossingOffset(prefersReducedMotion) >= 0,
  winnerPosition: prefersReducedMotion
    ? reducedResolvedWinnerPosition
    : normalResolvedWinnerPosition,
  worldTravel: getRaceWorldTravelPercentAtTime('winner', 0, prefersReducedMotion),
});
const normalFinishSnapshot = getFinishSnapshot(false);
const reducedFinishSnapshot = getFinishSnapshot(true);
assert.deepEqual(
  {
    winnerId: reducedFinishSnapshot.winnerId,
    collectibleId: reducedFinishSnapshot.collectibleId,
    finishCrossed: reducedFinishSnapshot.finishCrossed,
  },
  {
    winnerId: normalFinishSnapshot.winnerId,
    collectibleId: normalFinishSnapshot.collectibleId,
    finishCrossed: normalFinishSnapshot.finishCrossed,
  },
  'reduced motion should preserve the resolved winner, finish state, and collectible result',
);
assert.equal(
  reducedFinishSnapshot.winnerPosition,
  resolvedWinnerLane.positions.winner,
  'reduced motion should reveal the resolved winner at its authored finish position',
);
assert.equal(
  getRaceLaneProgressAtTime('winner', stagedNonWinnerLane, obstacles, 0, true),
  stagedNonWinnerLane.positions.winner,
  'reduced motion should keep staged finish positions readable for every lane',
);
assert.equal(
  reducedFinishSnapshot.worldTravel,
  RACE_FINALE_WORLD_END_PERCENT,
  'reduced motion should still reveal the completed course state',
);
const reducedStageSnapshots = (['warmup', 'matchup', 'finale'] as const).map((stage) => (
  getRaceLaneProgressAtTime(stage, resolvedWinnerLane, obstacles, 0, true)
));
assert.deepEqual(
  reducedStageSnapshots,
  [
    resolvedWinnerLane.positions.warmup,
    resolvedWinnerLane.positions.matchup,
    resolvedWinnerLane.positions.finale,
  ],
  'reduced motion should expose readable authored snapshots for every race stage',
);
assert.ok(
  normalFinishSnapshot.winnerPosition >= 4 && normalFinishSnapshot.winnerPosition <= 96,
  'normal motion should preserve a bounded continuous finish position',
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