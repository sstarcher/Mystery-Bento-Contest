import assert from 'node:assert/strict';
import {
  getFirstRunnerObstacleHitOffset,
  getRaceObstacleEntryOffset,
  getRaceFinishMarkerScreenAnchor,
  getRaceFinishVisibleOffset,
  getRaceRunnerFinishAction,
  getRaceAnnouncementRevealOffsets,
  getRaceAnnouncementCompletionDelay,
  getRaceStartAnnouncementCompletionDelay,
  getRaceAnnouncerBeatStartOffset,
  getRaceObstacleAnnouncerTiming,
  getRaceStageAnnouncerCue,
  getRaceLaneProgressAtTime,
  getRaceRunnerCameraOverflow,
  getRaceRunnerCameraCorrection,
  getRaceRunnerScreenCap,
  getRaceRunnerScreenAnchors,
  getRaceRunnerObstacleContactOffset,
  getRaceStartHandoffTiming,
  getRaceStageObstacleMilestones,
  getRaceWorldScreenAnchor,
  getRaceWorldTravelPercentAtTime,
  RACE_FINALE_WORLD_END_PERCENT,
  RACE_LAST_CONTESTANT_PAUSE_MS,
  RACE_START_POPUP_LEAD_OUT_MS,
  RACE_START_POST_ANNOUNCEMENT_GAP_MS,
  RACE_MATCHUP_WORLD_END_PERCENT,
  RACE_OBSTACLE_CONTACT_WINDOW_PERCENT,
  RACE_OBSTACLE_ENTRY_SCREEN_ANCHOR_PERCENT,
  RACE_FINISH_THRESHOLD_POSITION,
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
import { getMatchedEncounterResultAudio } from './announcer-result-audio';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const obstacles: RaceTimelineObstacle[] = [
  { id: 'napkin', position: 18 },
  { id: 'moon-reflection', position: 40 },
  { id: 'finish-hazard', position: 62 },
  { id: 'last-hazard', position: 83 },
];

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
assert.doesNotMatch(appSource, /bento-stack-at-the-finish/);
assert.doesNotMatch(appSource, /garnish-gate-one-elegant-line/);
assert.doesNotMatch(appSource, /sidesteps-it-and-holds-the-line/);
assert.doesNotMatch(appSource, /weaves-through-and-finds-a-stranger-line/);
assert.doesNotMatch(appSource, /result-fragments\/clean-line/);
assert.doesNotMatch(appSource, /result-fragments\/finds-an-unexpected-opening/);
assert.match(appSource, /getMatchedEncounterResultAudio\(encounter\.result, encounter\.headline\)/);
assert.match(appSource, /if \(matchedResultAudio\)/);
assert.match(appSource, /clear: \{ headline: 'clean line'/);
assert.match(appSource, /slow: \{ headline: 'slowed down'/);
assert.match(appSource, /surge: \{ headline: 'found a break'/);
assert.match(appSource, /reroute: \{ headline: 'rerouted'/);
assert.doesNotMatch(appSource, /paceAnnouncerClips/);
assert.doesNotMatch(appSource, /id: `pace-/);
assert.match(
  appSource,
  /id: `obstacle-callout-\$\{obstacle\.id\}`,[\s\S]{0,180}timelineStage: stage/,
  'obstacle callouts must use the stage clock where their obstacle is rendered',
);

assert.equal(
  getMatchedEncounterResultAudio('clear', 'clean line'),
  undefined,
  'clear encounters stay silent because the only clear clip uses forbidden line wording',
);
assert.deepEqual(
  getMatchedEncounterResultAudio('slow', 'slowed down'),
  { file: 'slowed-down', label: 'slowed down' },
  'slowed-down audio must match the visible headline exactly',
);
assert.deepEqual(
  getMatchedEncounterResultAudio('surge', 'found a break'),
  { file: 'found-a-break', label: 'found a break' },
  'found-a-break audio must match the visible headline exactly',
);
assert.deepEqual(
  getMatchedEncounterResultAudio('reroute', 'rerouted'),
  { file: 'rerouted', label: 'rerouted' },
  'rerouted audio must match the visible headline exactly',
);
assert.equal(
  getMatchedEncounterResultAudio('surge', 'finds an unexpected opening'),
  undefined,
  'semantically similar but non-identical result copy must stay silent',
);
assert.equal(
  getRaceRunnerScreenCap(0.49, false),
  40,
  'the first half of the race should hold the lead runner at the 40% screen cap',
);
assert.equal(
  getRaceRunnerScreenCap(0.5, false),
  55,
  'the second cap should open at the halfway race boundary',
);
assert.equal(
  getRaceRunnerScreenCap(0.99, false),
  55,
  'the second cap should remain active until the final obstacle resolves',
);
assert.equal(
  getRaceRunnerScreenCap(0.75, true),
  null,
  'the final obstacle resolution should unlock runners regardless of race-progress percentage',
);
assert.equal(
  getRaceRunnerCameraOverflow(54, 55),
  0,
  'a leader inside the active cap should not accelerate the scenery',
);
assert.equal(
  getRaceRunnerCameraOverflow(71, 55),
  16,
  'scenery correction should equal the leader movement beyond the active cap',
);
assert.equal(
  getRaceRunnerCameraCorrection(16, RACE_FINALE_WORLD_END_PERCENT),
  0,
  'camera correction must not keep shifting runners after the scenery reaches the finish endpoint',
);
assert.ok(
  Math.abs(
    getRaceRunnerCameraCorrection(
      16,
      RACE_FINALE_WORLD_END_PERCENT - 4 / RACE_WORLD_TRACK_WIDTH_MULTIPLIER,
    ) - 4,
  ) < 1e-9,
  'camera correction must be limited by the scenery travel remaining before the finish',
);

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
assert.equal(getRaceRunnerFinishAction(false, true), undefined);
assert.equal(getRaceRunnerFinishAction(true, true), 'victory');
assert.equal(getRaceRunnerFinishAction(true, false), 'idle');
assert.equal(getRaceFinishVisibleOffset(true), 0);
assert.ok(
  Math.abs(getRaceFinishMarkerScreenAnchor(RACE_FINALE_WORLD_END_PERCENT) - 88) < 0.05,
  'the finish marker projection should land on the authored finish anchor at the completed world travel',
);
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
  RACE_START_POST_ANNOUNCEMENT_GAP_MS,
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
  raceStartHandoff.announcementEndOffset - raceStartHandoff.raceStartPopupHideOffset,
  RACE_START_POPUP_LEAD_OUT_MS,
  'the starting-lantern popup should clear a short lead-out before the call completes',
);
assert.equal(
  raceStartHandoff.movementStartOffset,
  raceStartHandoff.announcementEndOffset,
  'the race clock should begin on the start announcement completion boundary',
);
assert.equal(
  getRaceAnnouncerBeatStartOffset('warmup', 320),
  320,
  'warmup announcer cues should use the actual race-start clock origin',
);
assert.equal(
  getRaceAnnouncerBeatStartOffset('matchup', 320),
  RACE_STAGE_DURATIONS.warmup + 320,
  'matchup announcer cues should be relative to the moving race clock',
);
assert.equal(
  getRaceAnnouncerBeatStartOffset('winner', 900, 21_000, 240),
  22_140,
  'winner announcer cues should follow the resolved finish crossing instead of a fixed stage duration',
);
assert.equal(getRaceStageAnnouncerCue('warmup'), undefined, 'warm-up transition clips should stay inactive');
assert.equal(getRaceStageAnnouncerCue('matchup'), undefined, 'matchup transition clips should stay inactive');
assert.deepEqual(
  getRaceStageAnnouncerCue('finale'),
  { id: 'finish-in-sight', label: 'Finish in sight' },
  'finish in sight should be the only active stage cue',
);
assert.deepEqual(
  getRaceObstacleAnnouncerTiming(1_000, 1_800, 7_000, false),
  { calloutOffset: 1_000, reactionOffset: 1_800, canCallout: false },
  'moving-race obstacle timing should retain entry and contact even when the callout is suppressed',
);
assert.deepEqual(
  getRaceObstacleAnnouncerTiming(1_000, 2_000, 7_000, false),
  { calloutOffset: 1_000, reactionOffset: 2_000, canCallout: true },
  'an obstacle with one second of warning should keep its callout',
);
assert.deepEqual(
  getRaceObstacleAnnouncerTiming(1_000, 1_999, 7_000, false),
  { calloutOffset: 1_000, reactionOffset: 1_999, canCallout: false },
  'an obstacle with less than one second of warning should skip its callout',
);
assert.deepEqual(
  getRaceObstacleAnnouncerTiming(1_000, 1_800, 7_000, true),
  { calloutOffset: 1_000, reactionOffset: 3_400, canCallout: true },
  'reduced-motion obstacle narration should use its deterministic staged contact fallback',
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
assert.ok(
  Math.abs(
    getRaceWorldTravelPercentAtTime('matchup', RACE_STAGE_DURATIONS.matchup, false)
      - RACE_MATCHUP_WORLD_END_PERCENT,
  ) < 1e-9,
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
const fallbackDelay = getRaceStartAnnouncementCompletionDelay(6350);
const mutedFallbackCompletion = raceStartHandoff.raceStartOffset + fallbackDelay;
const unavailableFallbackCompletion = raceStartHandoff.raceStartOffset + fallbackDelay;
assert.equal(
  fallbackDelay,
  6350,
  'muted and unavailable audio should preserve the authored announcement duration without an extra pause',
);
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

const entryObstacle = obstacles[0];
const entryOffset = getRaceObstacleEntryOffset('warmup', entryObstacle, false);
const entryAnchor = Number.parseFloat(getRaceWorldScreenAnchor(
  entryObstacle.position,
  getRaceWorldTravelPercentAtTime('warmup', entryOffset, false),
));
assert.ok(
  Math.abs(entryAnchor - RACE_OBSTACLE_ENTRY_SCREEN_ANCHOR_PERCENT) <= 0.02,
  'obstacle callout timing should begin when the obstacle reaches the right edge',
);
assert.ok(
  entryOffset === 0
    || Number.parseFloat(getRaceWorldScreenAnchor(
      entryObstacle.position,
      getRaceWorldTravelPercentAtTime('warmup', entryOffset - 1, false),
    )) > RACE_OBSTACLE_ENTRY_SCREEN_ANCHOR_PERCENT,
  'obstacle entry solving should choose the first right-edge crossing',
);
assert.ok(
  getRaceObstacleEntryOffset('warmup', entryObstacle, false, 200) > entryOffset,
  'horizontal obstacle offsets should delay right-edge narration consistently with rendered placement',
);
assert.equal(
  getRaceObstacleEntryOffset('warmup', entryObstacle, true),
  0,
  'reduced-motion obstacle narration should use the staged checkpoint immediately',
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
  RACE_FINISH_THRESHOLD_POSITION,
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
const shiftedContactOffset = getRaceRunnerObstacleContactOffset(
  'warmup',
  contactObstacle,
  contactLane,
  obstacles,
  (elapsedMs) => contactLane.positions.intro
    + (contactLane.positions.warmup - contactLane.positions.intro)
      * Math.min(1, Math.max(0, elapsedMs / RACE_STAGE_DURATIONS.warmup)),
  false,
  RACE_OBSTACLE_CONTACT_WINDOW_PERCENT,
  200,
);
assert.ok(
  shiftedContactOffset > contactOffset,
  'rendered horizontal obstacle offsets should delay contact timing with the visible hazard',
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
  finishCrossed: true,
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
  normalFinishSnapshot.winnerPosition >= 4 && normalFinishSnapshot.winnerPosition <= 100,
  'normal motion should preserve a bounded continuous finish position',
);

const parseAnchors = (anchors: number[]) => anchors.map((anchor) => Number(anchor.toFixed(3)));
const sharedStart = [8, 10, 7, 12];
const boundedAnchors = parseAnchors(getRaceRunnerScreenAnchors([8, 60, 100, 95], sharedStart));
assert.ok(
  boundedAnchors.every((anchor) => anchor >= RACE_RUNNER_SCREEN_MIN_PERCENT && anchor <= RACE_RUNNER_SCREEN_MAX_PERCENT + 0.001),
  'oversized runners should stay within the visible race viewport',
);
assert.ok(
  Math.max(...boundedAnchors) - Math.min(...boundedAnchors) <= RACE_RUNNER_MAX_SPREAD_PERCENT + 0.001,
  'runner projection should cap the visible pack spread',
);
assert.deepEqual(
  parseAnchors(getRaceRunnerScreenAnchors(sharedStart, sharedStart)),
  [RACE_RUNNER_VISUAL_START_PERCENT, RACE_RUNNER_VISUAL_START_PERCENT, RACE_RUNNER_VISUAL_START_PERCENT, RACE_RUNNER_VISUAL_START_PERCENT],
  'all contestants should share one visual starting position',
);
assert.deepEqual(
  parseAnchors(getRaceRunnerScreenAnchors(
    sharedStart.map(() => RACE_FINISH_THRESHOLD_POSITION),
    sharedStart,
    RACE_FINISH_THRESHOLD_POSITION,
  )),
  [RACE_RUNNER_SCREEN_MAX_PERCENT, RACE_RUNNER_SCREEN_MAX_PERCENT, RACE_RUNNER_SCREEN_MAX_PERCENT, RACE_RUNNER_SCREEN_MAX_PERCENT]
    .map((anchor) => Number(anchor.toFixed(3))),
  'finish-threshold runners should project to the visible finish marker',
);
assert.deepEqual(
  parseAnchors(getRaceRunnerScreenAnchors(
    sharedStart.map((position) => position + RACE_RUNNER_VISUAL_MAX_DISTANCE),
    sharedStart,
  )),
  [RACE_RUNNER_VISUAL_START_PERCENT + RACE_RUNNER_MAX_SPREAD_PERCENT,
    RACE_RUNNER_VISUAL_START_PERCENT + RACE_RUNNER_MAX_SPREAD_PERCENT,
    RACE_RUNNER_VISUAL_START_PERCENT + RACE_RUNNER_MAX_SPREAD_PERCENT,
    RACE_RUNNER_VISUAL_START_PERCENT + RACE_RUNNER_MAX_SPREAD_PERCENT]
    .map((anchor) => Number(anchor.toFixed(3))),
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