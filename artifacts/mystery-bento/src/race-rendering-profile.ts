export type RaceDeviceSignals = {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
  maxTouchPoints?: number;
};

export type RaceRenderingProfile = {
  constrained: boolean;
  transformSampleIntervalMs: number;
  useBackdropEffects: boolean;
};

export function getRaceRenderingProfile(signals: RaceDeviceSignals): RaceRenderingProfile {
  const lowMemory = typeof signals.deviceMemory === 'number' && signals.deviceMemory <= 2;
  const fewCores = typeof signals.hardwareConcurrency === 'number' && signals.hardwareConcurrency <= 4;
  const touchConstrained = Boolean(signals.maxTouchPoints && signals.maxTouchPoints > 0)
    && ((signals.deviceMemory ?? Number.POSITIVE_INFINITY) <= 4
      || (signals.hardwareConcurrency ?? Number.POSITIVE_INFINITY) <= 6);
  const constrained = Boolean(signals.saveData) || lowMemory || fewCores || touchConstrained;

  return {
    constrained,
    // This only samples the already-authored transform curve. Simulation
    // timestamps and sprite cadence remain independent of this budget.
    transformSampleIntervalMs: constrained ? 32 : 16,
    useBackdropEffects: !constrained,
  };
}

export function getCurrentRaceDeviceSignals(): RaceDeviceSignals {
  if (typeof navigator === 'undefined') return {};
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean };
  }).connection;
  return {
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    saveData: connection?.saveData,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}

export function isRaceDebugEnabled(search = '') {
  const params = new URLSearchParams(search);
  return params.get('raceDebug') === '1' || params.get('raceCheck') === '109';
}