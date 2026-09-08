export type RunnerSpeedEventResult = 'clear' | 'slow' | 'surge' | 'reroute';
export type RunnerMovementState = 'walk' | 'run';

export type RunnerSpeedEvent = {
  obstacleId: string;
  result: RunnerSpeedEventResult;
  triggerMs: number;
  speedMultiplier?: number;
  durationMs?: number;
};

export type RunnerTrajectoryPoint = {
  elapsedMs: number;
  position: number;
};

export type RunnerFinishRecord = {
  personaId: string;
  finishCrossingMs: number | null;
};

export const RUNNER_FINISH_TIE_WINDOW_MS = 50;

export function resolveRunnerFinishOrder(
  lanes: ReadonlyArray<RunnerFinishRecord>,
  tieWindowMs = RUNNER_FINISH_TIE_WINDOW_MS,
) {
  return lanes
    .map((lane, index) => ({ lane, index }))
    .sort((a, b) => {
      const aCrossing = a.lane.finishCrossingMs ?? Number.POSITIVE_INFINITY;
      const bCrossing = b.lane.finishCrossingMs ?? Number.POSITIVE_INFINITY;
      const crossingDelta = aCrossing - bCrossing;
      return Math.abs(crossingDelta) <= tieWindowMs
        ? a.index - b.index
        : crossingDelta;
    })
    .map(({ lane }) => lane.personaId);
}

export type ContinuousRunnerProfile = {
  startPosition: number;
  baseSpeedMultiplier: number;
  events: RunnerSpeedEvent[];
};

export const RUNNER_SLOW_SPEED_MULTIPLIER = 0.54;
export const RUNNER_REROUTE_SPEED_MULTIPLIER = 0.68;
export const RUNNER_SURGE_SPEED_MULTIPLIER = 1.4;
export const RUNNER_SLOW_DURATION_MS = 3600;
export const RUNNER_REROUTE_DURATION_MS = 3000;
export const RUNNER_SURGE_DURATION_MS = 3200;
export const RUNNER_SPRITE_SLOW_SPEED_THRESHOLD = 1;
export const RUNNER_SLOW_FRAME_CADENCE_FLOOR = 0.58;
export const RUNNER_EVENT_DISTANCE_GAIN = 2.8;
export const RUNNER_MAX_POSITION = 100;

function getDefaultEventDuration(result: RunnerSpeedEventResult) {
  if (result === 'slow') return RUNNER_SLOW_DURATION_MS;
  if (result === 'reroute') return RUNNER_REROUTE_DURATION_MS;
  if (result === 'surge') return RUNNER_SURGE_DURATION_MS;
  return 0;
}

export function getRunnerSpeedEventDuration(result: RunnerSpeedEventResult) {
  return getDefaultEventDuration(result);
}

function getDefaultEventMultiplier(result: RunnerSpeedEventResult) {
  if (result === 'slow') return RUNNER_SLOW_SPEED_MULTIPLIER;
  if (result === 'reroute') return RUNNER_REROUTE_SPEED_MULTIPLIER;
  if (result === 'surge') return RUNNER_SURGE_SPEED_MULTIPLIER;
  return 1;
}

function getEventDuration(event: RunnerSpeedEvent) {
  return event.durationMs ?? getDefaultEventDuration(event.result);
}

function getEventMultiplier(event: RunnerSpeedEvent) {
  return event.speedMultiplier ?? getDefaultEventMultiplier(event.result);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getRunnerBaseSpeedMultiplier(speedTrait: number) {
  return 0.98 + clamp(speedTrait, 0, 100) * 0.0004;
}

export function getRunnerEffectiveSpeed(profile: ContinuousRunnerProfile, elapsedMs: number) {
  const activeEvents = profile.events.filter((event) => {
    const elapsed = elapsedMs - event.triggerMs;
    return elapsed >= 0 && elapsed < getEventDuration(event);
  });
  const eventMultiplier = activeEvents.reduce(
    (multiplier, event) => multiplier * getEventMultiplier(event),
    1,
  );
  return profile.baseSpeedMultiplier * eventMultiplier;
}

export function getRunnerMovementState(_profile: ContinuousRunnerProfile, _elapsedMs: number): RunnerMovementState {
  // Keep the authored run silhouette during slowdowns; playback cadence, not
  // the sprite sheet, communicates reduced speed.
  return 'run';
}

export function getRunnerSpriteCadenceMultiplier(speedMultiplier: number) {
  const normalizedSpeed = Math.max(0, speedMultiplier);
  return normalizedSpeed < RUNNER_SPRITE_SLOW_SPEED_THRESHOLD
    ? Math.max(RUNNER_SLOW_FRAME_CADENCE_FLOOR, normalizedSpeed)
    : Math.min(1.35, normalizedSpeed);
}

export function getContinuousRunnerPosition(
  profile: ContinuousRunnerProfile,
  elapsedMs: number,
  courseTravelEndPosition: number,
  raceDurationMs: number,
) {
  const elapsed = Math.max(0, Math.min(raceDurationMs, elapsedMs));
  const courseSpeed = courseTravelEndPosition / raceDurationMs;
  const baseTravel = courseSpeed * elapsed * profile.baseSpeedMultiplier;
  const eventTravel = profile.events.reduce((distance, event) => {
    const eventElapsed = clamp(elapsed - event.triggerMs, 0, getEventDuration(event));
    const multiplierDelta = getEventMultiplier(event) - 1;
    return distance + courseSpeed
      * profile.baseSpeedMultiplier
      * multiplierDelta
      * eventElapsed
      * RUNNER_EVENT_DISTANCE_GAIN;
  }, 0);
  return clamp(
    profile.startPosition + baseTravel + eventTravel,
    4,
    Math.max(RUNNER_MAX_POSITION, courseTravelEndPosition),
  );
}

/**
 * Resolve the continuous movement curve into a serializable playback trace.
 * Event boundaries and the finish crossing are always represented exactly;
 * regular samples keep playback interpolation faithful between those points.
 */
export function buildRunnerTrajectory(
  profile: ContinuousRunnerProfile,
  courseTravelEndPosition: number,
  raceDurationMs: number,
  sampleIntervalMs = 100,
  finishCrossingMs: number | null = null,
) {
  const sampleTimes = new Set<number>([0, raceDurationMs]);
  for (let elapsedMs = sampleIntervalMs; elapsedMs < raceDurationMs; elapsedMs += sampleIntervalMs) {
    sampleTimes.add(elapsedMs);
  }
  profile.events.forEach((event) => {
    sampleTimes.add(Math.max(0, Math.min(raceDurationMs, event.triggerMs)));
    const endMs = event.triggerMs + getEventDuration(event);
    sampleTimes.add(Math.max(0, Math.min(raceDurationMs, endMs)));
  });
  if (finishCrossingMs !== null) {
    sampleTimes.add(Math.max(0, Math.min(raceDurationMs, finishCrossingMs)));
  }
  return [...sampleTimes]
    .sort((a, b) => a - b)
    .map((elapsedMs): RunnerTrajectoryPoint => ({
      elapsedMs,
      position: getContinuousRunnerPosition(profile, elapsedMs, courseTravelEndPosition, raceDurationMs),
    }));
}

export function getRunnerTrajectoryPositionAtTime(
  trajectory: RunnerTrajectoryPoint[],
  elapsedMs: number,
) {
  if (!trajectory.length) return 0;
  if (elapsedMs <= trajectory[0].elapsedMs) return trajectory[0].position;
  const last = trajectory[trajectory.length - 1];
  if (elapsedMs >= last.elapsedMs) return last.position;
  for (let index = 1; index < trajectory.length; index += 1) {
    const current = trajectory[index];
    if (elapsedMs > current.elapsedMs) continue;
    const previous = trajectory[index - 1];
    const duration = Math.max(1, current.elapsedMs - previous.elapsedMs);
    const progress = (elapsedMs - previous.elapsedMs) / duration;
    return previous.position + (current.position - previous.position) * progress;
  }
  return last.position;
}

export function getRunnerFinishCrossingTime(
  profile: ContinuousRunnerProfile,
  finishThresholdPosition: number,
  courseTravelEndPosition: number,
  raceDurationMs: number,
) {
  const startPosition = getContinuousRunnerPosition(
    profile,
    0,
    courseTravelEndPosition,
    raceDurationMs,
  );
  if (startPosition >= finishThresholdPosition) return 0;

  const endPosition = getContinuousRunnerPosition(
    profile,
    raceDurationMs,
    courseTravelEndPosition,
    raceDurationMs,
  );
  if (endPosition < finishThresholdPosition) return null;

  let low = 0;
  let high = raceDurationMs;
  for (let iteration = 0; iteration < 32; iteration += 1) {
    const middle = (low + high) / 2;
    const position = getContinuousRunnerPosition(
      profile,
      middle,
      courseTravelEndPosition,
      raceDurationMs,
    );
    if (position >= finishThresholdPosition) high = middle;
    else low = middle;
  }
  return Math.ceil(high);
}