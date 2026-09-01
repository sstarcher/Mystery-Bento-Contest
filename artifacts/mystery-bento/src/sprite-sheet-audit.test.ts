import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
  { file: 'toro-idle.png', columns: 7, rows: 7, occupiedFrames: 48 },
  { file: 'toro-walk.png', columns: 8, rows: 6, occupiedFrames: 43 },
  { file: 'toro-run.png', columns: 7, rows: 7, occupiedFrames: 48 },
  { file: 'toro-jump.png', columns: 7, rows: 4, occupiedFrames: 27 },
  { file: 'kiku-idle.png', columns: 8, rows: 4, occupiedFrames: 29 },
  { file: 'kiku-walk.png', columns: 8, rows: 6, occupiedFrames: 47 },
  { file: 'kiku-run.png', columns: 8, rows: 7, occupiedFrames: 54 },
  { file: 'kiku-jump.png', columns: 8, rows: 4, occupiedFrames: 28 },
  { file: 'miso-idle.png', columns: 8, rows: 7, occupiedFrames: 53 },
  { file: 'miso-walk.png', columns: 8, rows: 7, occupiedFrames: 49 },
  { file: 'miso-run.png', columns: 8, rows: 7, occupiedFrames: 50 },
  { file: 'miso-jump.png', columns: 8, rows: 5, occupiedFrames: 33 },
  { file: 'nori-idle.png', columns: 8, rows: 4, occupiedFrames: 30 },
  { file: 'nori-walk.png', columns: 8, rows: 7, occupiedFrames: 49 },
  { file: 'nori-run.png', columns: 8, rows: 5, occupiedFrames: 33 },
  { file: 'nori-jump.png', columns: 8, rows: 5, occupiedFrames: 40 },
  { file: 'panko-idle.png', columns: 8, rows: 5, occupiedFrames: 34 },
  { file: 'panko-walk.png', columns: 8, rows: 7, occupiedFrames: 49 },
  { file: 'panko-run.png', columns: 7, rows: 7, occupiedFrames: 48 },
  { file: 'panko-jump.png', columns: 8, rows: 5, occupiedFrames: 33 },
  { file: 'rollo-idle.png', columns: 8, rows: 6, occupiedFrames: 46 },
  { file: 'rollo-walk.png', columns: 8, rows: 6, occupiedFrames: 46 },
  { file: 'rollo-run.png', columns: 8, rows: 5, occupiedFrames: 37 },
  { file: 'rollo-jump.png', columns: 8, rows: 5, occupiedFrames: 34 },
  { file: 'saffy-idle.png', columns: 8, rows: 5, occupiedFrames: 33 },
  { file: 'saffy-walk.png', columns: 8, rows: 5, occupiedFrames: 34 },
  { file: 'saffy-run.png', columns: 8, rows: 6, occupiedFrames: 47 },
  { file: 'saffy-jump.png', columns: 8, rows: 4, occupiedFrames: 32 },
  { file: 'tilda-idle.png', columns: 8, rows: 5, occupiedFrames: 37 },
  { file: 'tilda-walk.png', columns: 8, rows: 6, occupiedFrames: 42 },
  { file: 'tilda-run.png', columns: 8, rows: 6, occupiedFrames: 42 },
  { file: 'tilda-jump.png', columns: 8, rows: 5, occupiedFrames: 36 },
  { file: 'uma-idle.png', columns: 8, rows: 4, occupiedFrames: 31 },
  { file: 'uma-walk.png', columns: 8, rows: 7, occupiedFrames: 51 },
  { file: 'uma-run.png', columns: 8, rows: 4, occupiedFrames: 32 },
  { file: 'uma-jump.png', columns: 8, rows: 5, occupiedFrames: 35 },
  { file: 'sencha-idle.png', columns: 8, rows: 7, occupiedFrames: 50 },
  { file: 'sencha-walk.png', columns: 8, rows: 7, occupiedFrames: 51 },
  { file: 'sencha-run.png', columns: 8, rows: 6, occupiedFrames: 42 },
  { file: 'sencha-jump.png', columns: 8, rows: 4, occupiedFrames: 32 },
];

const runtimeAssetPath = (file: string) => fileURLToPath(new URL(`../public/video/${file}`, import.meta.url));
const movementRuntimeAssetPath = (file: string) => fileURLToPath(new URL(`./assets/contestants/movement/${file}`, import.meta.url));

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
}

console.log(`Sprite-sheet audit passed for ${spriteSheets.length + movementSpriteSheets.length} runtime sheets.`);