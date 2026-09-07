export type RaceMomentumTrait = 'speed' | 'balance' | 'focus' | 'luck' | 'chaos';
export type RaceMomentumTraits = Record<RaceMomentumTrait, number>;
export type RaceMomentumEncounterResult = 'clear' | 'slow' | 'surge' | 'reroute';

const successfulEncounterResults = new Set<RaceMomentumEncounterResult>(['clear', 'surge']);

export function ensureRaceEncounterVariety(
  results: RaceMomentumEncounterResult[],
  divergingIndex = 0,
) {
  if (results.length < 2) return results;

  const allSuccessful = results.every((result) => successfulEncounterResults.has(result));
  const allUnsuccessful = results.every((result) => !successfulEncounterResults.has(result));
  if (!allSuccessful && !allUnsuccessful) return results;

  const normalizedIndex = ((divergingIndex % results.length) + results.length) % results.length;
  const divergentResult: RaceMomentumEncounterResult = allSuccessful ? 'slow' : 'clear';
  return results.map((result, index) => index === normalizedIndex ? divergentResult : result);
}

export function getRaceMomentumAdjustment(laneIndex: number, laneCount: number, spread: number) {
  if (laneCount < 2 || laneIndex !== 0 && laneIndex !== laneCount - 1) return 0;
  const boundedSpread = Math.max(0, Math.min(24, spread));
  if (boundedSpread === 0) return 0;
  const adjustmentScale = 2;
  if (boundedSpread <= 8) {
    return (laneIndex === 0 ? -1 : 1) * boundedSpread * 0.375 * adjustmentScale;
  }
  const meaningfulSpread = 3 + ((boundedSpread - 8) / 16) * 11;
  return (laneIndex === 0 ? -1 : 1) * meaningfulSpread * adjustmentScale;
}

export type RaceLeadChangeKind = 'overtake' | 'reversal';

export function getRaceLeadChangeKind(
  leaderBeforeId: string,
  leaderAfterId: string,
  previouslyLedIds: ReadonlySet<string>,
): RaceLeadChangeKind | undefined {
  if (leaderBeforeId === leaderAfterId) return undefined;
  return previouslyLedIds.has(leaderAfterId) ? 'reversal' : 'overtake';
}

export function resolveRaceEncounterResult({
  traits,
  primaryTrait,
  secondaryTrait,
  obstacleKind,
  rankIndex,
  laneCount,
  spread,
  rng,
}: {
  traits: RaceMomentumTraits;
  primaryTrait: RaceMomentumTrait;
  secondaryTrait: RaceMomentumTrait;
  obstacleKind: string;
  rankIndex: number;
  laneCount: number;
  spread: number;
  rng: () => number;
}): RaceMomentumEncounterResult {
  const momentumAdjustment = getRaceMomentumAdjustment(rankIndex, laneCount, spread);
  const control = traits[primaryTrait] * 0.52
    + traits[secondaryTrait] * 0.24
    + traits.luck * 0.12
    + (100 - traits.chaos) * 0.12;
  const luckyBreak = traits.chaos >= 70
    && (primaryTrait === 'luck' || obstacleKind === 'ribbon-tunnel' || obstacleKind === 'shortcut-reflection')
    && rng() > 0.35;
  const momentumBreak = momentumAdjustment >= 8
    && control >= 48
    && rng() < 0.08 + traits.luck * 0.0012;
  const leaderDisruption = momentumAdjustment <= -8
    && traits.chaos >= 55
    && rng() < 0.12;
  const roll = control + momentumAdjustment + rng() * 22 - 11;
  return luckyBreak || momentumBreak
    ? 'surge'
    : leaderDisruption
      ? 'reroute'
      : roll >= 76
        ? 'clear'
        : roll < 51
          ? 'slow'
          : traits.chaos >= 72 && rng() > 0.48
            ? 'reroute'
            : 'clear';
}