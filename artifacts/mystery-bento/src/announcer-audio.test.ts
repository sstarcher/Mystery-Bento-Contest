import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { announcerAudio, selectRaceStartClip } from './announcer-audio';
import {
  getRaceStartHandoffTiming,
  RACE_LAST_CONTESTANT_PAUSE_MS,
  RACE_START_POPUP_LEAD_OUT_MS,
  RACE_START_POST_ANNOUNCEMENT_GAP_MS,
} from './race-timeline';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const startClips = announcerAudio.raceStarts;

assert.equal(startClips.length, 3, 'the race-start catalog should contain exactly three clips');
assert.deepEqual(
  startClips.map((clip) => clip.id),
  ['race-start-primary', 'race-start-quiet-kitchen', 'race-start-welcome-back'],
  'the catalog should keep the three authored opening variants in a stable order',
);
assert.ok(
  startClips.every((clip) => clip.src.includes('/runtime/audio/announcer/race-starts/')),
  'every race-start clip should resolve from the runtime announcer asset base',
);
assert.ok(
  startClips.every((clip) => Number.isFinite(clip.durationMs) && (clip.durationMs ?? 0) > 0),
  'every race-start clip should provide a positive conservative duration hint',
);
assert.equal(selectRaceStartClip(0).id, 'race-start-primary');
assert.equal(selectRaceStartClip(1 / 3).id, 'race-start-quiet-kitchen');
assert.equal(selectRaceStartClip(0.999999).id, 'race-start-welcome-back');
assert.equal(selectRaceStartClip(Number.NaN).id, 'race-start-primary');

const commonRoster = [850, 900, 800, 800];
for (const clip of startClips) {
  const handoff = getRaceStartHandoffTiming(
    1330,
    commonRoster,
    80,
    clip.durationMs ?? 0,
    RACE_START_POST_ANNOUNCEMENT_GAP_MS,
  );
  assert.equal(
    handoff.raceStartOffset - handoff.finalNameEndOffset,
    RACE_LAST_CONTESTANT_PAUSE_MS,
    `${clip.id} should preserve the final-name pause`,
  );
  assert.equal(
    handoff.announcementEndOffset,
    handoff.raceStartOffset + (clip.durationMs ?? 0),
    `${clip.id} duration should define the movement handoff`,
  );
  assert.equal(
    handoff.announcementEndOffset - handoff.raceStartPopupHideOffset,
    RACE_START_POPUP_LEAD_OUT_MS,
    `${clip.id} should preserve the starting-lantern lead-out`,
  );
  assert.equal(
    handoff.movementStartOffset,
    handoff.announcementEndOffset + RACE_START_POST_ANNOUNCEMENT_GAP_MS,
    `${clip.id} should start movement at its completion boundary`,
  );
}

assert.match(
  appSource,
  /raceStartClip: selectRaceStartClip\(rng\(\)\)/,
  'the opening clip should be selected once while resolving a contest',
);
assert.match(
  appSource,
  /buildAnnouncerSequence\(contestants, race, raceStartClip, prefersReducedMotion\)/,
  'the selected opening clip should feed the intro sequence',
);
assert.match(
  appSource,
  /\[contestants, race, raceStartClip, prefersReducedMotion\]/,
  'the intro sequence should retain the selected clip across rerenders',
);
assert.doesNotMatch(
  appSource,
  /race-starts\/race-start-quiet-kitchen'\)/,
  'the intro sequence must not hard-code the quiet-kitchen variant',
);
assert.match(
  appSource,
  /getRaceAudioResource\(raceStartClip\.src\)\?\.durationMs \?\? raceStartClip\.durationMs/,
  'muted handoff timing should use loaded metadata before the conservative hint',
);
assert.match(
  appSource,
  /getRaceStartAnnouncementCompletionDelay\(clipDurationMs\(clip\)\)/,
  'audio fallback completion should use the selected clip duration',
);
assert.match(
  appSource,
  /if \(!clip\.id\.startsWith\('race-starts\/'\)\) return/,
  'starting-lantern presentation should remain limited to race-start clips',
);

console.log('Race-start announcer verification passed.');