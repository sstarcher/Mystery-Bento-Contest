import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { MovementAction } from './movement-sprite-actions';
import {
  getMovementFrameIndex,
  getVictoryFrameIndex,
  movementActions,
  victorySpriteMetadata,
} from './movement-sprite-actions';
import { getMovementFrameDurationMs } from './movement-sprite-cadence';
import { movementSpriteNormalization } from './movement-sprite-normalization';
import {
  RACE_RUNNER_LANE_HEIGHT_PX,
  RACE_RUNNER_OVERLAY_TOP_PX,
  RACE_RUNNER_PRESENTATION_TOP_PX,
} from './race-timeline';

type SpriteSheetAudit = {
  file: string;
  columns: number;
  rows: number;
  occupiedFrames: number;
};

const spriteSheets: SpriteSheetAudit[] = [
  { file: 'bibi-bento-cooking-sprite-sheet.png', columns: 8, rows: 7, occupiedFrames: 52 },
  { file: 'captain-toro-cooking-sprite-sheet.png', columns: 8, rows: 4, occupiedFrames: 31 },
  { file: 'kiku-kettle-cooking-sprite-sheet.png', columns: 8, rows: 4, occupiedFrames: 28 },
  { file: 'miso-mallow-cooking-sprite-sheet.png', columns: 8, rows: 7, occupiedFrames: 55 },
  { file: 'nori-nib-cooking-sprite-sheet.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'panko-puff-cooking-sprite-sheet.png', columns: 8, rows: 5, occupiedFrames: 34 },
  { file: 'pip-making-food-sprite-sheet.png', columns: 5, rows: 5, occupiedFrames: 25 },
  { file: 'rollo-radish-cooking-sprite-sheet.png', columns: 8, rows: 7, occupiedFrames: 51 },
  { file: 'saffy-sashimi-cooking-sprite-sheet.png', columns: 8, rows: 7, occupiedFrames: 55 },
  { file: 'sencha-making-tea-sprite-sheet.png', columns: 5, rows: 5, occupiedFrames: 25 },
  { file: 'tilda-tofu-cooking-sprite-sheet.png', columns: 8, rows: 7, occupiedFrames: 49 },
  { file: 'uma-udon-cooking-sprite-sheet.png', columns: 8, rows: 6, occupiedFrames: 44 },
];

const movementSpriteSheets: SpriteSheetAudit[] = [
  { file: 'bibi-idle.png', columns: 8, rows: 4, occupiedFrames: 28 },
  { file: 'bibi-walk.png', columns: 8, rows: 6, occupiedFrames: 42 },
  { file: 'bibi-run.png', columns: 8, rows: 4, occupiedFrames: 31 },
  { file: 'bibi-jump.png', columns: 8, rows: 4, occupiedFrames: 31 },
  { file: 'bibi-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'bibi-victory.png', columns: 12, rows: 12, occupiedFrames: 143 },
  { file: 'toro-idle.png', columns: 7, rows: 7, occupiedFrames: 48 },
  { file: 'toro-walk.png', columns: 8, rows: 6, occupiedFrames: 43 },
  { file: 'toro-run.png', columns: 7, rows: 7, occupiedFrames: 48 },
  { file: 'toro-jump.png', columns: 7, rows: 4, occupiedFrames: 27 },
  { file: 'toro-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'toro-victory.png', columns: 12, rows: 12, occupiedFrames: 143 },
  { file: 'kiku-idle.png', columns: 8, rows: 4, occupiedFrames: 29 },
  { file: 'kiku-walk.png', columns: 8, rows: 6, occupiedFrames: 47 },
  { file: 'kiku-run.png', columns: 8, rows: 7, occupiedFrames: 54 },
  { file: 'kiku-jump.png', columns: 8, rows: 4, occupiedFrames: 28 },
  { file: 'kiku-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'kiku-victory.png', columns: 12, rows: 12, occupiedFrames: 143 },
  { file: 'miso-idle.png', columns: 8, rows: 7, occupiedFrames: 53 },
  { file: 'miso-walk.png', columns: 8, rows: 7, occupiedFrames: 49 },
  { file: 'miso-run.png', columns: 8, rows: 7, occupiedFrames: 50 },
  { file: 'miso-jump.png', columns: 8, rows: 5, occupiedFrames: 33 },
  { file: 'miso-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'miso-victory.png', columns: 12, rows: 12, occupiedFrames: 144 },
  { file: 'nori-idle.png', columns: 8, rows: 4, occupiedFrames: 30 },
  { file: 'nori-walk.png', columns: 8, rows: 7, occupiedFrames: 49 },
  { file: 'nori-run.png', columns: 8, rows: 5, occupiedFrames: 33 },
  { file: 'nori-jump.png', columns: 8, rows: 5, occupiedFrames: 40 },
  { file: 'nori-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'nori-victory.png', columns: 12, rows: 12, occupiedFrames: 144 },
  { file: 'panko-idle.png', columns: 8, rows: 5, occupiedFrames: 34 },
  { file: 'panko-walk.png', columns: 8, rows: 7, occupiedFrames: 49 },
  { file: 'panko-run.png', columns: 7, rows: 7, occupiedFrames: 48 },
  { file: 'panko-jump.png', columns: 8, rows: 5, occupiedFrames: 33 },
  { file: 'panko-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'panko-victory.png', columns: 12, rows: 12, occupiedFrames: 143 },
  { file: 'pip-idle.png', columns: 8, rows: 7, occupiedFrames: 52 },
  { file: 'pip-walk.png', columns: 8, rows: 6, occupiedFrames: 48 },
  { file: 'pip-run.png', columns: 8, rows: 7, occupiedFrames: 50 },
  { file: 'pip-jump.png', columns: 8, rows: 4, occupiedFrames: 32 },
  { file: 'pip-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'pip-victory.png', columns: 12, rows: 12, occupiedFrames: 143 },
  { file: 'rollo-idle.png', columns: 8, rows: 6, occupiedFrames: 46 },
  { file: 'rollo-walk.png', columns: 8, rows: 6, occupiedFrames: 46 },
  { file: 'rollo-run.png', columns: 8, rows: 5, occupiedFrames: 37 },
  { file: 'rollo-jump.png', columns: 8, rows: 5, occupiedFrames: 34 },
  { file: 'rollo-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'rollo-victory.png', columns: 12, rows: 12, occupiedFrames: 144 },
  { file: 'saffy-idle.png', columns: 8, rows: 5, occupiedFrames: 33 },
  { file: 'saffy-walk.png', columns: 8, rows: 5, occupiedFrames: 34 },
  { file: 'saffy-run.png', columns: 8, rows: 6, occupiedFrames: 47 },
  { file: 'saffy-jump.png', columns: 8, rows: 4, occupiedFrames: 32 },
  { file: 'saffy-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'saffy-victory.png', columns: 12, rows: 12, occupiedFrames: 143 },
  { file: 'tilda-idle.png', columns: 8, rows: 5, occupiedFrames: 37 },
  { file: 'tilda-walk.png', columns: 8, rows: 6, occupiedFrames: 42 },
  { file: 'tilda-run.png', columns: 8, rows: 6, occupiedFrames: 42 },
  { file: 'tilda-jump.png', columns: 8, rows: 5, occupiedFrames: 36 },
  { file: 'tilda-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'tilda-victory.png', columns: 12, rows: 12, occupiedFrames: 143 },
  { file: 'uma-idle.png', columns: 8, rows: 4, occupiedFrames: 31 },
  { file: 'uma-walk.png', columns: 8, rows: 7, occupiedFrames: 51 },
  { file: 'uma-run.png', columns: 8, rows: 4, occupiedFrames: 32 },
  { file: 'uma-jump.png', columns: 8, rows: 5, occupiedFrames: 35 },
  { file: 'uma-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'uma-victory.png', columns: 12, rows: 12, occupiedFrames: 143 },
  { file: 'sencha-idle.png', columns: 8, rows: 7, occupiedFrames: 50 },
  { file: 'sencha-walk.png', columns: 8, rows: 7, occupiedFrames: 51 },
  { file: 'sencha-run.png', columns: 8, rows: 6, occupiedFrames: 42 },
  { file: 'sencha-jump.png', columns: 8, rows: 4, occupiedFrames: 32 },
  { file: 'sencha-fall.png', columns: 8, rows: 7, occupiedFrames: 56 },
  { file: 'sencha-victory.png', columns: 12, rows: 12, occupiedFrames: 144 },
];
const movementSheetsByFile = new Map(movementSpriteSheets.map((sheet) => [sheet.file, sheet]));

const runtimeAssetPath = (file: string) => fileURLToPath(new URL(`../public/runtime/video/cooking/${file}`, import.meta.url));
const movementRuntimeAssetPath = (file: string) => fileURLToPath(new URL(`./assets/derived/contestants/movement/${file}`, import.meta.url));
const normalizedMovementMetrics = new Map<string, { action: MovementAction; height: number; baseline: number }[]>();

for (const sheet of [...spriteSheets, ...movementSpriteSheets]) {
  const file = movementSpriteSheets.includes(sheet)
    ? movementRuntimeAssetPath(sheet.file)
    : runtimeAssetPath(sheet.file);
  const width = Number(execFileSync('identify', ['-format', '%w', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  const frameSize = width / sheet.columns;
  const alphaMeans = execFileSync(
    'convert',
    [file, '-crop', `${frameSize}x${frameSize}`, '+repage', '-alpha', 'extract', '-format', '%[fx:mean]\n', 'info:'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(Number);
  const occupiedFrames = alphaMeans.filter((mean) => mean > 0.0001).length;

  assert.equal(alphaMeans.length, sheet.columns * sheet.rows, `${sheet.file}: unexpected grid size`);
  assert.equal(occupiedFrames, sheet.occupiedFrames, `${sheet.file}: occupied frame count changed`);
  assert.ok(alphaMeans.slice(0, sheet.occupiedFrames).every((mean) => mean > 0.0001), `${sheet.file}: a configured frame is blank`);
  assert.ok(alphaMeans[Math.floor(sheet.occupiedFrames / 2)] > 0.0001, `${sheet.file}: middle occupied frame is blank`);
  assert.ok(alphaMeans[sheet.occupiedFrames - 1] > 0.0001, `${sheet.file}: last occupied frame is blank`);
  assert.ok(alphaMeans.slice(sheet.occupiedFrames).every((mean) => mean <= 0.0001), `${sheet.file}: padded frame is not transparent`);

  if (movementSpriteSheets.includes(sheet)) {
    const [personaId, action] = sheet.file.replace(/\.png$/, '').split('-') as [string, MovementAction];
    const normalization = movementSpriteNormalization[personaId]?.[action];
    assert.ok(normalization, `${sheet.file}: missing per-character normalization metadata`);
    const boxes = execFileSync(
      'convert',
      [file, '-alpha', 'extract', '-threshold', '0', '-crop', `${frameSize}x${frameSize}`, '-format', '%@\\n', 'info:'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .trim()
      .split(/\s+/)
      .slice(0, sheet.occupiedFrames)
      .map((geometry) => {
        const match = geometry.match(/^(\d+)x(\d+)\+(-?\d+)\+(-?\d+)$/);
        assert.ok(match, `${sheet.file}: malformed alpha bounds`);
        return match!.slice(1).map(Number);
      });
    const median = (values: number[]) => values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];
    if (action !== 'victory') {
      assert.ok(
        boxes.every(([width, height, x, y]) => x > 0 && y > 0 && x + width < frameSize && y + height < frameSize),
        `${sheet.file}: silhouette reaches a frame boundary`,
      );
    }
    const normalizedHeight = median(boxes.map(([, height]) => (
      height * (216 / frameSize) * normalization!.scale
    )));
    const normalizedBaseline = median(boxes.map(([, height, , y]) => (
      216 + ((y + height) / frameSize * 216 - 216) * normalization!.scale + normalization!.baselineOffset
    )));
    const personaMetrics = normalizedMovementMetrics.get(personaId) ?? [];
    personaMetrics.push({ action, height: normalizedHeight, baseline: normalizedBaseline });
    normalizedMovementMetrics.set(personaId, personaMetrics);
    assert.ok(normalizedHeight > 120, `${sheet.file}: normalized silhouette is unexpectedly small`);
    assert.ok(normalizedBaseline > 140 && normalizedBaseline < 220, `${sheet.file}: normalized baseline is outside the runner frame`);
  }
}

for (const [personaId, metrics] of normalizedMovementMetrics) {
  const regularMetrics = metrics.filter(({ action }) => action !== 'victory');
  const regularHeights = regularMetrics.map(({ height }) => height);
  const victoryMetric = metrics.find(({ action }) => action === 'victory');
  const baselines = metrics.map(({ baseline }) => baseline);
  assert.ok(
    Math.max(...regularHeights) - Math.min(...regularHeights) <= 8,
    `${personaId}: normalized action scale drifted by more than 8 rendered pixels`,
  );
  assert.ok(victoryMetric, `${personaId}: victory normalization metrics are missing`);
  const regularMedianHeight = regularHeights.slice().sort((a, b) => a - b)[Math.floor(regularHeights.length / 2)];
  const expectedVictoryHeightMultiplier = personaId === 'rollo' ? 1.4 : 1.1;
  assert.ok(
    Math.abs(victoryMetric!.height - regularMedianHeight * expectedVictoryHeightMultiplier) <= 4,
    `${personaId}: victory pose size drifted from its presentation target`,
  );
  const baselineMetrics = personaId === 'rollo'
    ? metrics.filter(({ action }) => action !== 'victory')
    : metrics;
  assert.ok(
    Math.max(...baselineMetrics.map(({ baseline }) => baseline)) - Math.min(...baselineMetrics.map(({ baseline }) => baseline)) <= 3,
    `${personaId}: normalized action baseline drifted by more than 3 rendered pixels`,
  );
}

const raceCss = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');
const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const movementConfigSource = readFileSync(fileURLToPath(new URL('./movement-sprite-config.ts', import.meta.url)), 'utf8');
const movementRendererSource = readFileSync(fileURLToPath(new URL('./movement-sprite.tsx', import.meta.url)), 'utf8');
const debugPageSource = readFileSync(fileURLToPath(new URL('./pages/race-track-debug.tsx', import.meta.url)), 'utf8');
assert.match(raceCss, new RegExp(`\\.race-course-road \\{ padding-top: ${RACE_RUNNER_PRESENTATION_TOP_PX}px; \\}`));
assert.match(raceCss, new RegExp(`\\.race-runner-overlay \\{ padding-top: ${RACE_RUNNER_OVERLAY_TOP_PX}px; \\}`));
assert.match(raceCss, new RegExp(`\\.race-lane, \\.race-runner-lane \\{ height: ${RACE_RUNNER_LANE_HEIGHT_PX}px;`));
assert.doesNotMatch(raceCss, /race-reaction-/);
assert.match(appSource, /hasNegativeObstacleImpact\(encounter\?\.result\)/);
assert.match(appSource, /result === 'slow' \|\| result === 'reroute'/);
assert.match(appSource, /const hasJumpReaction = runnerReaction === 'jump'/);
assert.match(appSource, /hasJumpReaction\s*\n\s*\? 'jump'/);
assert.match(appSource, /getRaceRunnerFinishAction\(finishCrossed, isWinner\)/);
assert.match(appSource, /const RaceLiveRenderer = memo/);
assert.match(appSource, /setPresentations\(frameState\.presentations\)/);
assert.match(appSource, /translate3d\(\$\{presentation\.anchor/);
assert.match(movementRendererSource, /if \(effectiveAction === 'victory'\) return 0/);
assert.match(appSource, /const winningPersona = winner \?\? contestOutcome\.current\?\.winner/);
assert.match(appSource, /const outcome = contestOutcome\.current \?\? resolveContest\(contestants, createRng\(Date\.now\(\)\)\)/);
assert.match(debugPageSource, /race-sprite-test-strip/);
assert.match(debugPageSource, /getMovementSpriteSheet\(contestant\.id, 'jump'\)/);
assert.match(debugPageSource, /sequence="fall"/);
assert.match(debugPageSource, /sequence="jump"/);
assert.match(debugPageSource, /sequence="victory"/);
assert.match(debugPageSource, /Run → fall → run/);
assert.match(debugPageSource, /Run → jump → run/);
assert.match(debugPageSource, /Run → victory/);
assert.match(movementRendererSource, /getMovementFrameIndex\(current \+ 1, spriteSheet\.frameCount, false\)/);
assert.match(movementRendererSource, /const isJumpOneShot = action === 'jump'/);
assert.match(movementRendererSource, /effectiveAction === 'jump' && isJumpOneShot/);
assert.match(movementRendererSource, /getVictoryFrameIndex\(frameIndex, spriteSheet\.frameCount, prefersReducedMotion\)/);
assert.match(movementRendererSource, /getMovementSpriteRenderStyle\(spriteSheet\.normalization, scaleMultiplier\)/);
assert.match(movementRendererSource, /speedMultiplierRef\.current/);
assert.match(movementRendererSource, /window\.setTimeout/);
assert.doesNotMatch(movementRendererSource, /window\.setInterval/);
assert.doesNotMatch(movementRendererSource, /spriteSheet, speedMultiplier\]/);
assert.equal(
  getMovementFrameDurationMs(180, 0.58, false),
  getMovementFrameDurationMs(180, 0.58, false),
  'run cadence duration should be deterministic when the live speed is unchanged',
);
assert.notEqual(
  getMovementFrameDurationMs(180, 0.58, false),
  getMovementFrameDurationMs(180, 1.2, false),
  'run cadence duration should still respond to a changed live speed',
);
assert.deepEqual(movementActions, ['idle', 'walk', 'run', 'jump', 'fall', 'victory']);
const expectedVictoryGrid = { columns: 12, rows: 12 };
const expectedVictoryFrameCounts: Record<string, number> = {
  bibi: 143,
  toro: 143,
  kiku: 143,
  miso: 144,
  nori: 144,
  panko: 143,
  pip: 143,
  rollo: 144,
  saffy: 143,
  tilda: 143,
  uma: 143,
  sencha: 144,
};
for (const [personaId, metadata] of Object.entries(victorySpriteMetadata)) {
  assert.deepEqual(
    { columns: metadata.columns, rows: metadata.rows },
    expectedVictoryGrid,
    `${personaId}: victory sheet grid must isolate each authored pose`,
  );
  assert.equal(metadata.frameCount, expectedVictoryFrameCounts[personaId], `${personaId}: victory frame count must stop before any padded cell`);
  assert.match(
    movementConfigSource,
    new RegExp(`victory: sheet\\('${personaId}', 'victory', ${personaId}Victory, 12, 12, ${metadata.frameCount}\\)`),
    `${personaId}: victory sheet is not registered to its own persona`,
  );
  const asset = movementSheetsByFile.get(metadata.file);
  assert.ok(asset, `${metadata.file}: victory asset is missing from the audit inventory`);
  assert.equal(asset?.columns, metadata.columns);
  assert.equal(asset?.rows, metadata.rows);
  assert.equal(asset?.occupiedFrames, metadata.frameCount);
}
assert.equal(getVictoryFrameIndex(0, 64, false), 0, 'victory playback should begin on its first authored frame');
assert.equal(getVictoryFrameIndex(64, 64, false), 0, 'victory playback should loop at the sheet boundary');
assert.equal(getVictoryFrameIndex(127, 64, false), 63, 'victory playback should stay inside occupied frames');
assert.equal(getVictoryFrameIndex(37, 64, true), 0, 'reduced motion should hold a stable readable victory pose');
assert.equal(getMovementFrameIndex(99, 64, false), 63, 'one-shot playback should freeze on its final frame');
console.log(`Sprite-sheet audit passed for ${spriteSheets.length + movementSpriteSheets.length} runtime sheets with sprite-driven race reactions.`);