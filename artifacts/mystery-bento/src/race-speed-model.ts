export type RunnerSpeedEventResult = 'clear' | 'slow' | 'surge' | 'reroute';
export type RunnerMovementState = 'walk' | 'run';

export type RunnerSpeedEvent = {
  obstacleId: string;
  result: RunnerSpeedEventResult;
  triggerMs: number;
};

export type ContinuousRunnerProfile = {
  startPosition: number;
  baseSpeedMultiplier: number;
  events: RunnerSpeedEvent[];
};

export const RUNNER_SLOW_SPEED_MULTIPLIER = 0.68;
export const RUNNER_REROUTE_SPEED_MULTIPLIER = 0.8;
export const RUNNER_SURGE_SPEED_MULTIPLIER = 1.32;
export const RUNNER_SLOW_DURATION_MS = 1500;
export const RUNNER_REROUTE_DURATION_MS = 1050;
export const RUNNER_SURGE_DURATION_MS = 1200;
export const RUNNER_WALK_THRESHOLD = 0.86;
export const RUNNER_EVENT_DISTANCE_GAIN = 2.4;

function getEventDuration(result: RunnerSpeedEventResult) {
  if (result === 'slow') return RUNNER_SLOW_DURATION_MS;
  if (result === 'reroute') return RUNNER_REROUTE_DURATION_MS;
  if (result === 'surge') return RUNNER_SURGE_DURATION_MS;
  return 0;
}

function getEventMultiplier(result: RunnerSpeedEventResult) {
  if (result === 'slow') return RUNNER_SLOW_SPEED_MULTIPLIER;
  if (result === 'reroute') return RUNNER_REROUTE_SPEED_MULTIPLIER;
  if (result === 'surge') return RUNNER_SURGE_SPEED_MULTIPLIER;
  return 1;
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
    return elapsed >= 0 && elapsed < getEventDuration(event.result);
  });
  const eventMultiplier = activeEvents.reduce(
    (multiplier, event) => multiplier * getEventMultiplier(event.result),
    1,
  );
  return profile.baseSpeedMultiplier * eventMultiplier;
}

export function getRunnerMovementState(profile: ContinuousRunnerProfile, elapsedMs: number): RunnerMovementState {
  return getRunnerEffectiveSpeed(profile, elapsedMs) < RUNNER_WALK_THRESHOLD ? 'walk' : 'run';
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
    const eventElapsed = clamp(elapsed - event.triggerMs, 0, getEventDuration(event.result));
    const multiplierDelta = getEventMultiplier(event.result) - 1;
    return distance + courseSpeed
      * profile.baseSpeedMultiplier
      * multiplierDelta
      * eventElapsed
      * RUNNER_EVENT_DISTANCE_GAIN;
  }, 0);
  return clamp(profile.startPosition + baseTravel + eventTravel, 4, 96);
}