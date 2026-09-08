import {
  RACE_BACKGROUND_CANVAS_WIDTH_PX,
  RACE_BACKGROUND_FINISH_WORLD_POSITION,
  RACE_BACKGROUND_FINISH_SCREEN_ANCHOR_PERCENT,
  RACE_BACKGROUND_FINISH_TRAVEL_PERCENT,
  RACE_BACKGROUND_FINISH_MARKER_X_PX,
  RACE_BACKGROUND_TRACK_WIDTH_PX,
  RACE_BACKGROUND_TRACK_WIDTH_MULTIPLIER,
} from './race-backgrounds';

export type RaceTimelineStage = 'intro' | 'warmup' | 'matchup' | 'finale' | 'winner';
export type RaceTimelineEncounterResult = 'clear' | 'slow' | 'surge' | 'reroute';
export type RaceRunnerFinishAction = 'victory' | 'idle';
export type RaceStageAnnouncerCue = {
  id: 'finish-in-sight';
  label: 'Finish in sight';
};
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
// The starting-lantern card clears just before the call ends, while the race
// itself starts on the call's completion boundary. Keep this separate from
// the normal announcer gap used between unrelated clips.
export const RACE_START_POPUP_LEAD_OUT_MS = 360;
export const RACE_START_POST_ANNOUNCEMENT_GAP_MS = 0;

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
export const RACE_RUNNER_VISUAL_START_PERCENT = 14;
export const RACE_RUNNER_FIRST_CAP_PROGRESS = 0.5;
export const RACE_RUNNER_FIRST_SCREEN_CAP_PERCENT = 40;
export const RACE_RUNNER_SECOND_SCREEN_CAP_PERCENT = 55;
export const RACE_RUNNER_RENDER_WIDTH_PX = 216;
export const RACE_RUNNER_LEADING_EDGE_OFFSET_PERCENT =
  (RACE_RUNNER_RENDER_WIDTH_PX / RACE_BACKGROUND_CANVAS_WIDTH_PX) * 50;
// The runner transform is centered on the sprite. Keep the sprite's leading
// edge aligned with the marker's final viewport pixel position instead of
// placing its center on the authored screen percentage.
export const RACE_RUNNER_SCREEN_MAX_PERCENT =
  (
    RACE_BACKGROUND_FINISH_MARKER_X_PX
    - (RACE_BACKGROUND_TRACK_WIDTH_PX - RACE_BACKGROUND_CANVAS_WIDTH_PX)
  ) / RACE_BACKGROUND_CANVAS_WIDTH_PX * 100
  - RACE_RUNNER_LEADING_EDGE_OFFSET_PERCENT;
export const RACE_RUNNER_MAX_SPREAD_PERCENT =
  RACE_RUNNER_SCREEN_MAX_PERCENT - RACE_RUNNER_VISUAL_START_PERCENT;
export const RACE_RUNNER_VISUAL_MAX_DISTANCE = 90;
export const RACE_OBSTACLE_CONTACT_WINDOW_PERCENT = 11;
export const RACE_RUNNER_PRESENTATION_TOP_PX = 470;
export const RACE_RUNNER_OVERLAY_TOP_PX = 460;
export const RACE_RUNNER_LANE_HEIGHT_PX = 87;
export const RACE_RUNNER_NORMALIZED_BASELINE_MAX_PX = 220;
export const RACE_FINISH_VISIBLE_FRACTION = 0.98;
export const RACE_FINISH_THRESHOLD_POSITION = RACE_BACKGROUND_FINISH_WORLD_POSITION;
export const RACE_OBSTACLE_ENTRY_SCREEN_ANCHOR_PERCENT = 100;

export function getRaceRunnerScreenCap(
  raceProgress: number,
  finalObstacleResolved: boolean,
) {
  if (finalObstacleResolved) return null;
  return raceProgress < RACE_RUNNER_FIRST_CAP_PROGRESS
    ? RACE_RUNNER_FIRST_SCREEN_CAP_PERCENT
    : RACE_RUNNER_SECOND_SCREEN_CAP_PERCENT;
}

export function getRaceRunnerCameraOverflow(
  leaderScreenAnchor: number,
  screenCap: number | null,
) {
  return screenCap === null
    ? 0
    : Math.max(0, leaderScreenAnchor - screenCap);
}

export function getRaceRunnerCameraCorrection(
  requestedCorrectionPercent: number,
  worldTravelPercent: number,
  finalWorldTravelPercent = RACE_FINALE_WORLD_END_PERCENT,
) {
  const remainingWorldTravelPercent = Math.max(
    0,
    finalWorldTravelPercent - Math.max(0, worldTravelPercent),
  );
  return Math.min(
    Math.max(0, requestedCorrectionPercent),
    remainingWorldTravelPercent * RACE_WORLD_TRACK_WIDTH_MULTIPLIER,
  );
}

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

export function getRaceStageAnnouncerCue(stage: RaceTimelineStage): RaceStageAnnouncerCue | undefined {
  return stage === 'finale'
    ? { id: 'finish-in-sight', label: 'Finish in sight' }
    : undefined;
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

export function getRaceFinishMarkerScreenAnchor(worldTravelPercent: number) {
  const markerScreenX = RACE_BACKGROUND_FINISH_MARKER_X_PX
    - (worldTravelPercent / 100) * RACE_BACKGROUND_TRACK_WIDTH_PX;
  return (markerScreenX / RACE_BACKGROUND_CANVAS_WIDTH_PX) * 100;
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

export function getRaceWorldTravelPercentAtRaceTime(elapsedMs: number, prefersReducedMotion: boolean) {
  if (prefersReducedMotion) return RACE_FINALE_WORLD_END_PERCENT;
  return RACE_FINALE_WORLD_END_PERCENT
    * Math.max(0, Math.min(1, elapsedMs / RACE_RACE_DURATION_MS));
}

export function getRaceWorldScreenAnchor(position: number, worldTravelPercent: number) {
  return `${(position * RACE_WORLD_TRACK_WIDTH_MULTIPLIER - worldTravelPercent * RACE_WORLD_TRACK_WIDTH_MULTIPLIER).toFixed(3)}%`;
}

export function getRaceObstacleEntryOffset(
  stage: RaceTimelineStage,
  obstacle: RaceTimelineObstacle,
  prefersReducedMotion = false,
  horizontalOffsetPx = 0,
) {
  if (stage === 'intro' || stage === 'winner' || prefersReducedMotion) return 0;

  const stageDuration = RACE_STAGE_DURATIONS[stage];
  const obstacleWorldPosition = obstacle.position
    + (horizontalOffsetPx / RACE_BACKGROUND_TRACK_WIDTH_PX) * 100;
  const getScreenAnchor = (stageElapsedMs: number) => Number.parseFloat(getRaceWorldScreenAnchor(
    obstacleWorldPosition,
    getRaceWorldTravelPercentAtTime(stage, stageElapsedMs, false),
  ));
  const startAnchor = getScreenAnchor(0);
  if (startAnchor <= RACE_OBSTACLE_ENTRY_SCREEN_ANCHOR_PERCENT) return 0;
  if (getScreenAnchor(stageDuration) > RACE_OBSTACLE_ENTRY_SCREEN_ANCHOR_PERCENT) {
    return stageDuration;
  }

  // The obstacle is part of the scrolling world track. Solve for the first
  // frame where its rendered anchor reaches the viewport's right edge instead
  // of tying the callout to any runner's position or encounter result.
  let low = 0;
  let high = stageDuration;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const middle = (low + high) / 2;
    if (getScreenAnchor(middle) <= RACE_OBSTACLE_ENTRY_SCREEN_ANCHOR_PERCENT) high = middle;
    else low = middle;
  }
  let entryMs = Math.round(high);
  while (
    entryMs < stageDuration
    && getScreenAnchor(entryMs) > RACE_OBSTACLE_ENTRY_SCREEN_ANCHOR_PERCENT
  ) {
    entryMs += 1;
  }
  return entryMs;
}

export function getRaceRunnerScreenAnchors(
  positions: number[],
  startPositions: number[] = [],
  finishPosition?: number,
  finishScreenAnchor = RACE_RUNNER_SCREEN_MAX_PERCENT,
) {
  if (!positions.length) return [];

  // The camera can move backward relative to a runner's world position. Do
  // not project that camera coordinate onto the racers: it makes the whole
  // pack re-center and can make individual runners visibly reverse direction.
  // Instead, map each runner's distance from their shared start onto one fixed
  // visual track. This keeps the presentation monotonic while the simulation
  // remains free to use its authored world positions.
  const visualTravel = Math.max(0, finishScreenAnchor - RACE_RUNNER_VISUAL_START_PERCENT);
  return positions.map((position, index) => {
    const startPosition = startPositions[index] ?? 0;
    const maxDistance = typeof finishPosition === 'number'
      ? Math.max(1, finishPosition - startPosition)
      : RACE_RUNNER_VISUAL_MAX_DISTANCE;
    const distance = Math.max(0, Math.min(
      maxDistance,
      position - startPosition,
    ));
    return RACE_RUNNER_VISUAL_START_PERCENT
      + (distance / maxDistance) * visualTravel;
  });
}

export function getRaceRunnerFinishScreenAnchorAtRaceTime(
  elapsedMs: number,
  prefersReducedMotion: boolean,
) {
  if (prefersReducedMotion) return RACE_RUNNER_SCREEN_MAX_PERCENT;
  return RACE_RUNNER_VISUAL_START_PERCENT
    + RACE_RUNNER_MAX_SPREAD_PERCENT
      * Math.max(0, Math.min(1, elapsedMs / RACE_RACE_DURATION_MS));
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
  raceStartPopupHideOffset: number;
  announcementEndOffset: number;
  movementStartOffset: number;
};

export function getRaceStartHandoffTiming(
  openingDurationMs: number,
  nameDurationsMs: number[],
  nameGapMs: number,
  raceStartDurationMs: number,
  postAnnouncementGapMs = RACE_START_POST_ANNOUNCEMENT_GAP_MS,
  finalNamePauseMs = RACE_LAST_CONTESTANT_PAUSE_MS,
  popupLeadOutMs = RACE_START_POPUP_LEAD_OUT_MS,
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
  const raceStartPopupHideOffset = raceStartOffset
    + Math.max(0, raceStartDurationMs - popupLeadOutMs);

  return {
    nameRevealOffsets,
    finalNameEndOffset,
    raceStartOffset,
    raceStartPopupHideOffset,
    announcementEndOffset,
    movementStartOffset: announcementEndOffset + postAnnouncementGapMs,
  };
}

export function getRaceStartAnnouncementCompletionDelay(
  announcementDurationMs: number,
) {
  return announcementDurationMs + RACE_START_POST_ANNOUNCEMENT_GAP_MS;
}

export function getRaceAnnouncementCompletionDelay(
  announcementDurationMs: number,
  postAnnouncementGapMs: number,
) {
  return announcementDurationMs + postAnnouncementGapMs;
}

export function getRaceAnnouncerBeatStartOffset(
  stage: RaceTimelineStage,
  localOffsetMs: number,
  finishCrossingMs = 0,
  finishSettleMs = 0,
) {
  if (stage === 'intro') return localOffsetMs;
  if (stage === 'winner') return finishCrossingMs + finishSettleMs + localOffsetMs;
  return RACE_STAGE_OFFSETS[stage] + localOffsetMs;
}

export function getRaceObstacleAnnouncerTiming(
  entryOffsetMs: number,
  contactOffsetMs: number,
  stageDurationMs: number,
  prefersReducedMotion: boolean,
) {
  const entryOffset = Math.max(0, Math.min(stageDurationMs, entryOffsetMs));
  const reactionOffset = prefersReducedMotion
    ? Math.min(stageDurationMs, entryOffset + 2_400)
    : Math.max(0, Math.min(stageDurationMs, contactOffsetMs));
  return {
    calloutOffset: entryOffset,
    reactionOffset,
    canCallout: reactionOffset - entryOffset >= 1_000,
  };
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
  horizontalOffsetPx = 0,
) {
  const milestone = getRaceStageObstacleMilestones(stage, lane, obstacles)
    .find((candidate) => candidate.obstacle.id === obstacle.id);
  if (!milestone) return RACE_STAGE_DURATIONS[stage];
  if (prefersReducedMotion) return milestone.offset;

  const stageOffset = RACE_STAGE_OFFSETS[stage];
  const runnerStartPosition = lane.positions.intro;
  const obstacleWorldPosition = obstacle.position
    + (horizontalOffsetPx / RACE_BACKGROUND_TRACK_WIDTH_PX) * 100;
  const getObstacleToRunnerDistance = (stageElapsedMs: number) => {
    const runnerPosition = getRunnerPositionAtRaceTime(stageOffset + stageElapsedMs);
    const runnerAnchor = getRaceRunnerScreenAnchors(
      [runnerPosition],
      [runnerStartPosition],
      RACE_FINISH_THRESHOLD_POSITION,
    )[0] ?? RACE_RUNNER_VISUAL_START_PERCENT;
    const worldTravelPercent = getRaceWorldTravelPercentAtTime(stage, stageElapsedMs, false);
    const obstacleAnchor = Number.parseFloat(getRaceWorldScreenAnchor(obstacleWorldPosition, worldTravelPercent));
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
  horizontalOffsetPx = 0,
) {
  if (prefersReducedMotion) return 0;
  const adjustedPosition = obstacle.position
    + (horizontalOffsetPx / RACE_BACKGROUND_TRACK_WIDTH_PX) * 100;
  const offsets = lanes.map((lane) => {
    if (horizontalOffsetPx === 0) {
      return getRaceStageObstacleMilestones(stage, lane, obstacles)
        .find((milestone) => milestone.obstacle.id === obstacle.id)?.offset
        ?? RACE_STAGE_DURATIONS[stage];
    }
    const checkpoint = lane.checkpoints?.find((candidate) => candidate.obstacleId === obstacle.id);
    return getRunnerObstacleHitOffset(
      stage,
      {
        ...obstacle,
        position: adjustedPosition,
      },
      lane,
    );
  });
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