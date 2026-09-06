import {
  RACE_BACKGROUND_CANVAS_WIDTH_PX,
  RACE_BACKGROUND_FINISH_TRAVEL_PERCENT,
  RACE_BACKGROUND_FINISH_MARKER_X_PX,
  RACE_BACKGROUND_TRACK_WIDTH_PX,
  RACE_BACKGROUND_TRACK_WIDTH_MULTIPLIER,
} from './race-backgrounds';

export type RaceTimelineStage = 'intro' | 'warmup' | 'matchup' | 'finale' | 'winner';
export type RaceTimelineEncounterResult = 'clear' | 'slow' | 'surge' | 'reroute';
export type RaceRunnerFinishAction = 'victory' | 'idle';
export type RaceTimelineObstacle = { id: string; position: number };
export type RaceTimelineLane = {
  positions: Record<RaceTimelineStage, number>;
  encounters: Record<string, { result: RaceTimelineEncounterResult }>;
  checkpoints?: RaceTimelineCheckpoint[];
};
export type RaceTimelineCheckpoint = {
  obstacleId: string;
  approachPosition: number;
  crossingPosition: number;
  exitPosition: number;
};

export const RACE_STAGE_DURATIONS: Record<RaceTimelineStage, number> = {
  // Intro is the maximum pre-race announcement budget. The actual race clock
  // begins from the race-start handoff after the announcement finishes.
  intro: 15200,
  warmup: 7000,
  matchup: 8500,
  finale: 10100,
  winner: 10640, // 30% shorter than the previous 15.2s winner reveal hold
};
export const RACE_RACE_DURATION_MS = RACE_STAGE_DURATIONS.warmup
  + RACE_STAGE_DURATIONS.matchup
  + RACE_STAGE_DURATIONS.finale;

// The contest clock includes the announcement intro, but the race clock starts
// at the starting-lantern handoff. Keep this schedule explicit so visual
// motion, stage transitions, and finish milestones all share one origin.
export const RACE_STAGE_OFFSETS: Record<RaceTimelineStage, number> = {
  intro: 0,
  warmup: 0,
  matchup: RACE_STAGE_DURATIONS.warmup,
  finale: RACE_STAGE_DURATIONS.warmup + RACE_STAGE_DURATIONS.matchup,
  winner: RACE_STAGE_DURATIONS.warmup + RACE_STAGE_DURATIONS.matchup + RACE_STAGE_DURATIONS.finale,
};

export const RACE_LAST_CONTESTANT_PAUSE_MS = 1000;

export const RACE_WORLD_TRACK_WIDTH_MULTIPLIER = RACE_BACKGROUND_TRACK_WIDTH_MULTIPLIER;
export const RACE_FINALE_WORLD_END_PERCENT = RACE_BACKGROUND_FINISH_TRAVEL_PERCENT;
export const RACE_WARMUP_WORLD_END_PERCENT = RACE_FINALE_WORLD_END_PERCENT
  * RACE_STAGE_DURATIONS.warmup
  / RACE_RACE_DURATION_MS;
export const RACE_MATCHUP_WORLD_END_PERCENT = RACE_FINALE_WORLD_END_PERCENT
  * (RACE_STAGE_DURATIONS.warmup + RACE_STAGE_DURATIONS.matchup)
  / RACE_RACE_DURATION_MS;
export const RACE_FINALE_WORLD_START_PERCENT = RACE_MATCHUP_WORLD_END_PERCENT;
export const RACE_RUNNER_SCREEN_MIN_PERCENT = 12;
export const RACE_RUNNER_SCREEN_MAX_PERCENT = 88;
export const RACE_RUNNER_MAX_SPREAD_PERCENT = 56;
export const RACE_RUNNER_VISUAL_START_PERCENT = 14;
export const RACE_RUNNER_VISUAL_MAX_DISTANCE = 90;
export const RACE_OBSTACLE_CONTACT_WINDOW_PERCENT = 11;
export const RACE_RUNNER_PRESENTATION_TOP_PX = 470;
export const RACE_RUNNER_OVERLAY_TOP_PX = 460;
export const RACE_RUNNER_LANE_HEIGHT_PX = 87;
export const RACE_RUNNER_NORMALIZED_BASELINE_MAX_PX = 220;
export const RACE_FINISH_VISIBLE_FRACTION = 0.98;

export const RACE_STAGE_OBSTACLE_INDICES: Record<Exclude<RaceTimelineStage, 'intro' | 'winner'>, number[]> = {
  warmup: [0],
  matchup: [1],
  finale: [2, 3],
};

export function getRaceStageObstacleIndices(stage: RaceTimelineStage, obstacleCount: number) {
  if (!(stage in RACE_STAGE_OBSTACLE_INDICES)) return [];
  return RACE_STAGE_OBSTACLE_INDICES[stage as keyof typeof RACE_STAGE_OBSTACLE_INDICES]
    .filter((index) => index < obstacleCount);
}

export function getRaceFinishCrossingOffset(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? 0 : RACE_STAGE_DURATIONS.finale;
}

export function getRaceFinishVisibleOffset(prefersReducedMotion: boolean) {
  return prefersReducedMotion
    ? 0
    : Math.round(
      RACE_STAGE_DURATIONS.finale
      * (RACE_FINISH_VISIBLE_FRACTION
        * (RACE_FINALE_WORLD_END_PERCENT - RACE_FINALE_WORLD_START_PERCENT)
        / (RACE_FINALE_WORLD_END_PERCENT - RACE_FINALE_WORLD_START_PERCENT)),
    );
}

export function getRaceFinishHandoffProgress(
  stage: RaceTimelineStage,
  elapsedMs: number,
  prefersReducedMotion: boolean,
) {
  if (stage === 'winner' || prefersReducedMotion) return 1;
  if (stage !== 'finale') return 0;
  const finishVisibleOffset = getRaceFinishVisibleOffset(false);
  const crossingDuration = RACE_STAGE_DURATIONS.finale - finishVisibleOffset;
  if (crossingDuration <= 0) return 1;
  return Math.max(0, Math.min(1, (elapsedMs - finishVisibleOffset) / crossingDuration));
}

export function getRaceFinishMarkerScreenAnchor(worldTravelPercent: number) {
  const markerScreenX = RACE_BACKGROUND_FINISH_MARKER_X_PX
    - (worldTravelPercent / 100) * RACE_BACKGROUND_TRACK_WIDTH_PX;
  return (markerScreenX / RACE_BACKGROUND_CANVAS_WIDTH_PX) * 100;
}

export function getRaceFinishHandoffAnchor(
  startAnchor: number,
  resolvedAnchor: number,
  handoffProgress: number,
  finishMarkerAnchor?: number,
  isWinner = false,
) {
  const targetAnchor = isWinner && typeof finishMarkerAnchor === 'number'
    ? finishMarkerAnchor
    : resolvedAnchor;
  const progress = Math.max(0, Math.min(1, handoffProgress));
  return startAnchor + (targetAnchor - startAnchor) * progress;
}

export function getRaceRunnerFinishAction(
  finishCrossed: boolean,
  isWinner: boolean,
): RaceRunnerFinishAction | undefined {
  if (!finishCrossed) return undefined;
  return isWinner ? 'victory' : 'idle';
}

export function getRaceWorldTravelPercentAtTime(stage: RaceTimelineStage, elapsedMs: number, prefersReducedMotion: boolean) {
  if (stage === 'intro') return 0;
  if (stage === 'winner') return RACE_FINALE_WORLD_END_PERCENT;
  const stageStartTravel = stage === 'warmup'
    ? 0
    : stage === 'matchup'
      ? RACE_WARMUP_WORLD_END_PERCENT
      : RACE_FINALE_WORLD_START_PERCENT;
  const stageEndTravel = stage === 'warmup'
    ? RACE_WARMUP_WORLD_END_PERCENT
    : stage === 'matchup'
      ? RACE_FINALE_WORLD_START_PERCENT
      : RACE_FINALE_WORLD_END_PERCENT;
  if (prefersReducedMotion) return stageEndTravel;
  const raceElapsed = RACE_STAGE_OFFSETS[stage] + Math.max(0, elapsedMs);
  return RACE_FINALE_WORLD_END_PERCENT
    * Math.max(0, Math.min(1, raceElapsed / RACE_RACE_DURATION_MS));
}

export function getRaceWorldScreenAnchor(position: number, worldTravelPercent: number) {
  return `${(position * RACE_WORLD_TRACK_WIDTH_MULTIPLIER - worldTravelPercent * RACE_WORLD_TRACK_WIDTH_MULTIPLIER).toFixed(3)}%`;
}

export function getRaceRunnerScreenAnchors(positions: number[], startPositions: number[] = []) {
  if (!positions.length) return [];

  // The camera can move backward relative to a runner's world position. Do
  // not project that camera coordinate onto the racers: it makes the whole
  // pack re-center and can make individual runners visibly reverse direction.
  // Instead, map each runner's distance from their shared start onto one fixed
  // visual track. This keeps the presentation monotonic while the simulation
  // remains free to use its authored world positions.
  const visualTravel = RACE_RUNNER_MAX_SPREAD_PERCENT;
  return positions.map((position, index) => {
    const startPosition = startPositions[index] ?? 0;
    const distance = Math.max(0, Math.min(
      RACE_RUNNER_VISUAL_MAX_DISTANCE,
      position - startPosition,
    ));
    return RACE_RUNNER_VISUAL_START_PERCENT
      + (distance / RACE_RUNNER_VISUAL_MAX_DISTANCE) * visualTravel;
  });
}

export function getRaceAnnouncementRevealOffsets(
  openingDurationMs: number,
  nameDurationsMs: number[],
  gapAfterNameMs: number,
) {
  let offset = openingDurationMs + gapAfterNameMs;
  return nameDurationsMs.map((durationMs) => {
    const revealOffset = offset;
    offset += durationMs + gapAfterNameMs;
    return revealOffset;
  });
}

export type RaceStartHandoffTiming = {
  nameRevealOffsets: number[];
  finalNameEndOffset: number;
  raceStartOffset: number;
  announcementEndOffset: number;
  movementStartOffset: number;
};

export function getRaceStartHandoffTiming(
  openingDurationMs: number,
  nameDurationsMs: number[],
  nameGapMs: number,
  raceStartDurationMs: number,
  postAnnouncementGapMs: number,
  finalNamePauseMs = RACE_LAST_CONTESTANT_PAUSE_MS,
): RaceStartHandoffTiming {
  const nameRevealOffsets = getRaceAnnouncementRevealOffsets(
    openingDurationMs,
    nameDurationsMs,
    nameGapMs,
  );
  const lastNameIndex = nameDurationsMs.length - 1;
  const finalNameEndOffset = lastNameIndex >= 0
    ? nameRevealOffsets[lastNameIndex] + nameDurationsMs[lastNameIndex]
    : openingDurationMs;
  const raceStartOffset = finalNameEndOffset
    + (lastNameIndex >= 0 ? finalNamePauseMs : 0);
  const announcementEndOffset = raceStartOffset + raceStartDurationMs;

  return {
    nameRevealOffsets,
    finalNameEndOffset,
    raceStartOffset,
    announcementEndOffset,
    movementStartOffset: announcementEndOffset + postAnnouncementGapMs,
  };
}

export function getRaceAnnouncementCompletionDelay(
  announcementDurationMs: number,
  postAnnouncementGapMs: number,
) {
  return announcementDurationMs + postAnnouncementGapMs;
}

function getRaceStageStartPosition(stage: RaceTimelineStage, lane: RaceTimelineLane) {
  const previousStage: Partial<Record<RaceTimelineStage, RaceTimelineStage>> = {
    warmup: 'intro',
    matchup: 'warmup',
    finale: 'matchup',
  };
  const previous = previousStage[stage];
  return previous ? lane.positions[previous] : lane.positions.intro;
}

export function getRunnerObstacleHitOffset(stage: RaceTimelineStage, obstacle: RaceTimelineObstacle, lane: RaceTimelineLane) {
  const start = getRaceStageStartPosition(stage, lane);
  const end = lane.positions[stage];
  if (end <= start) return obstacle.position <= start ? 0 : RACE_STAGE_DURATIONS[stage];
  return Math.round(
    Math.max(0, Math.min(1, (obstacle.position - start) / (end - start)))
    * RACE_STAGE_DURATIONS[stage],
  );
}

export function getRaceStageObstacleMilestones(stage: RaceTimelineStage, lane: RaceTimelineLane, obstacles: RaceTimelineObstacle[]) {
  let previousOffset = 0;
  return getRaceStageObstacleIndices(stage, obstacles.length)
    .map((obstacleIndex) => {
      const obstacle = obstacles[obstacleIndex];
      const startPosition = getRaceStageStartPosition(stage, lane);
      const endPosition = lane.positions[stage];
      const checkpoint = lane.checkpoints?.find((candidate) => candidate.obstacleId === obstacle.id);
      const position = checkpoint?.crossingPosition
        ?? Math.max(startPosition, Math.min(endPosition, obstacle.position));
      const offset = checkpoint
        ? getRunnerObstacleHitOffset(stage, { ...obstacle, position }, lane)
        : getRunnerObstacleHitOffset(stage, obstacle, lane);
      const nextObstacle = getRaceStageObstacleIndices(stage, obstacles.length)
        .map((candidateIndex) => obstacles[candidateIndex])
        .find((candidate) => candidate && candidate.position > position);
      const nextOffset = nextObstacle
        ? getRunnerObstacleHitOffset(stage, nextObstacle, lane)
        : RACE_STAGE_DURATIONS[stage];
      const exitOffset = checkpoint
        ? Math.max(offset, Math.min(nextOffset, offset + Math.min(360, Math.max(120, (nextOffset - offset) * 0.18))))
        : offset;
      const milestone = {
        position,
        offset: Math.max(previousOffset, Math.min(RACE_STAGE_DURATIONS[stage], offset)),
        obstacle,
        exitPosition: checkpoint?.exitPosition,
        exitOffset,
      };
      previousOffset = milestone.offset;
      return milestone;
    });
}

export function getRaceRunnerObstacleContactOffset(
  stage: RaceTimelineStage,
  obstacle: RaceTimelineObstacle,
  lane: RaceTimelineLane,
  obstacles: RaceTimelineObstacle[],
  getRunnerPositionAtRaceTime: (elapsedMs: number) => number,
  prefersReducedMotion = false,
  contactWindowPercent = RACE_OBSTACLE_CONTACT_WINDOW_PERCENT,
) {
  const milestone = getRaceStageObstacleMilestones(stage, lane, obstacles)
    .find((candidate) => candidate.obstacle.id === obstacle.id);
  if (!milestone) return RACE_STAGE_DURATIONS[stage];
  if (prefersReducedMotion) return milestone.offset;

  const stageOffset = RACE_STAGE_OFFSETS[stage];
  const runnerStartPosition = lane.positions.intro;
  const getObstacleToRunnerDistance = (stageElapsedMs: number) => {
    const runnerPosition = getRunnerPositionAtRaceTime(stageOffset + stageElapsedMs);
    const runnerAnchor = getRaceRunnerScreenAnchors([runnerPosition], [runnerStartPosition])[0] ?? RACE_RUNNER_VISUAL_START_PERCENT;
    const worldTravelPercent = getRaceWorldTravelPercentAtTime(stage, stageElapsedMs, false);
    const obstacleAnchor = Number.parseFloat(getRaceWorldScreenAnchor(obstacle.position, worldTravelPercent));
    return obstacleAnchor - runnerAnchor;
  };

  // The obstacle travels left through the fixed runner overlay while the
  // runner's projected anchor moves right. Solve for the first frame where
  // the same contact window used by the live reaction is entered. The
  // monotonic search keeps the resolved trigger deterministic between frames.
  const stageDuration = RACE_STAGE_DURATIONS[stage];
  const contactStart = getObstacleToRunnerDistance(0);
  if (contactStart <= contactWindowPercent) return 0;
  const contactEnd = getObstacleToRunnerDistance(stageDuration);
  if (contactEnd > contactWindowPercent) return stageDuration;

  let low = 0;
  let high = stageDuration;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const middle = (low + high) / 2;
    if (getObstacleToRunnerDistance(middle) <= contactWindowPercent) high = middle;
    else low = middle;
  }
  let triggerMs = Math.round(high);
  while (triggerMs < stageDuration && getObstacleToRunnerDistance(triggerMs) > contactWindowPercent) {
    triggerMs += 1;
  }
  return triggerMs;
}

export function getFirstRunnerObstacleHitOffset(
  stage: RaceTimelineStage,
  obstacle: RaceTimelineObstacle,
  lanes: RaceTimelineLane[],
  obstacles: RaceTimelineObstacle[],
  prefersReducedMotion = false,
) {
  if (prefersReducedMotion) return 0;
  const offsets = lanes.map((lane) => getRaceStageObstacleMilestones(stage, lane, obstacles)
    .find((milestone) => milestone.obstacle.id === obstacle.id)?.offset ?? RACE_STAGE_DURATIONS[stage]);
  return Math.min(...offsets, RACE_STAGE_DURATIONS[stage]);
}

function getRacePaceEasing(result: RaceTimelineEncounterResult | undefined, progress: number) {
  if (result === 'slow') return Math.pow(progress, 1.65);
  if (result === 'surge') return 1 - Math.pow(1 - progress, 0.62);
  if (result === 'reroute') {
    return progress < 0.22 ? progress * 0.45 : 0.099 + ((progress - 0.22) / 0.78) * 0.901;
  }
  return progress;
}

export function getRaceLaneProgressAtTime(
  stage: RaceTimelineStage,
  lane: RaceTimelineLane,
  obstacles: RaceTimelineObstacle[],
  elapsedMs: number,
  prefersReducedMotion: boolean,
) {
  if (stage === 'intro') return lane.positions.intro;
  if (stage === 'winner') return lane.positions.winner;
  if (prefersReducedMotion) return lane.positions[stage];

  const startPosition = getRaceStageStartPosition(stage, lane);
  const endPosition = lane.positions[stage];
  const stageDuration = RACE_STAGE_DURATIONS[stage];
  const elapsed = Math.max(0, Math.min(stageDuration, elapsedMs));
  const obstacleMilestones = getRaceStageObstacleMilestones(stage, lane, obstacles);
  const milestones: Array<{ position: number; offset: number; obstacle?: RaceTimelineObstacle }> = [
    ...obstacleMilestones.flatMap((milestone) => [
      {
        position: milestone.position,
        offset: milestone.offset,
        obstacle: milestone.obstacle,
      },
      ...(typeof milestone.exitPosition === 'number' && milestone.exitOffset > milestone.offset
        ? [{
          position: milestone.exitPosition,
          offset: milestone.exitOffset,
          obstacle: milestone.obstacle,
        }]
        : []),
    ]),
    { position: endPosition, offset: stageDuration, obstacle: undefined },
  ].sort((a, b) => a.offset - b.offset);

  const firstMilestone = milestones[0];
  if (!firstMilestone || elapsed <= firstMilestone.offset) {
    const progress = firstMilestone?.offset ? elapsed / firstMilestone.offset : 1;
    return startPosition + ((firstMilestone?.position ?? endPosition) - startPosition) * progress;
  }
  for (let index = 1; index < milestones.length; index += 1) {
    const previous = milestones[index - 1];
    const current = milestones[index];
    if (elapsed <= current.offset) {
      const segmentDuration = Math.max(1, current.offset - previous.offset);
      const segmentProgress = Math.max(0, Math.min(1, (elapsed - previous.offset) / segmentDuration));
      const result = previous.obstacle ? lane.encounters[previous.obstacle.id]?.result : undefined;
      return previous.position + (current.position - previous.position) * getRacePaceEasing(result, segmentProgress);
    }
  }
  return endPosition;
}