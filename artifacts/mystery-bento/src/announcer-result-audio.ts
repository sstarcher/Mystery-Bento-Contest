export type AnnouncerEncounterResult = 'clear' | 'slow' | 'surge' | 'reroute';

export type MatchedEncounterResultAudio = {
  file: string;
  label: string;
};

const encounterResultAudio: Partial<Record<AnnouncerEncounterResult, MatchedEncounterResultAudio>> = {
  slow: { file: 'slowed-down', label: 'slowed down' },
  surge: { file: 'found-a-break', label: 'found a break' },
  reroute: { file: 'rerouted', label: 'rerouted' },
};

/**
 * Result audio is intentionally stricter than the visual encounter copy.
 * A clip is eligible only when its spoken fragment exactly matches the
 * headline rendered beside the obstacle.
 */
export function getMatchedEncounterResultAudio(
  result: AnnouncerEncounterResult,
  headline: string,
): MatchedEncounterResultAudio | undefined {
  const candidate = encounterResultAudio[result];
  return candidate?.label === headline ? candidate : undefined;
}