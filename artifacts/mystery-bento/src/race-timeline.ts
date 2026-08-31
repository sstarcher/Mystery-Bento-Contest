export type RaceTimelineStage = 'intro' | 'warmup' | 'matchup' | 'finale' | 'winner';
export type RaceTimelineEncounterResult = 'clear' | 'slow' | 'surge' | 'reroute';
export type RaceTimelineObstacle = { id: string; position: number };
export type RaceTimelineLane = {
  positions: Record<RaceTimelineStage, number>;
  encounters: Record<string, { result: RaceTimelineEncounterResult }>;
};

export const RACE_STAGE_DURATIONS: Record<RaceTimelineStage, number> = {
  intro: 13600,
  warmup: 7600,
  matchup: 9200,
  finale: 11000,
  winner: 16500,
};

export const RACE_WARMUP_WORLD_END_PERCENT = 13.67;
export const RACE_MATCHUP_WORLD_END_PERCENT = 30.22;
export const RACE_FINALE_WORLD_START_PERCENT = RACE_MATCHUP_WORLD_END_PERCENT;
export const RACE_FINALE_WORLD_END_PERCENT = 50;

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
  const progress = Math.max(0, Math.min(1, elapsedMs / RACE_STAGE_DURATIONS[stage]));
  return stageStartTravel + (stageEndTravel - stageStartTravel) * progress;
}

export function getRaceWorldScreenAnchor(position: number, worldTravelPercent: number) {
  return `${(position * 2 - worldTravelPercent * 2).toFixed(3)}%`;
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
      const position = Math.max(startPosition, Math.min(endPosition, obstacle.position));
      const offset = getRunnerObstacleHitOffset(stage, obstacle, lane);
      const milestone = {
        position,
        offset: Math.max(previousOffset, Math.min(RACE_STAGE_DURATIONS[stage], offset)),
        obstacle,
      };
      previousOffset = milestone.offset;
      return milestone;
    });
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
  const milestones: Array<{ position: number; offset: number; obstacle?: RaceTimelineObstacle }> = [
    ...getRaceStageObstacleMilestones(stage, lane, obstacles),
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