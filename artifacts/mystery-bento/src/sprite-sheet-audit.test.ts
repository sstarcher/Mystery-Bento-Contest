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

const runtimeAssetPath = (file: string) => fileURLToPath(new URL(`../public/video/${file}`, import.meta.url));

for (const sheet of spriteSheets) {
  const file = runtimeAssetPath(sheet.file);
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
}

console.log(`Sprite-sheet audit passed for ${spriteSheets.length} runtime sheets.`);