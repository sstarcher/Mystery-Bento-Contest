import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const ASSET_EXTENSIONS = /\.(png|webp|mp3|mp4)$/i;
const SOURCE_EXTENSIONS = /\.(ts|tsx)$/;

const canonicalFolders = [
  { label: 'source images', relativePath: 'assets/source/images' },
  { label: 'source audio', relativePath: 'assets/source/audio' },
  { label: 'derived contestants', relativePath: 'src/assets/derived/contestants' },
  { label: 'derived curios', relativePath: 'src/assets/derived/curios' },
  { label: 'runtime images', relativePath: 'public/runtime/images' },
  { label: 'runtime cooking', relativePath: 'public/runtime/video/cooking' },
  { label: 'runtime audio', relativePath: 'public/runtime/audio' },
  { label: 'archive', relativePath: 'assets/archive' },
  { label: 'review queue', relativePath: 'assets/review/unused' },
];

const readmeCountPaths = [
  'assets/source/images',
  'assets/source/audio',
  'src/assets/derived/contestants/portraits',
  'src/assets/derived/contestants/food',
  'src/assets/derived/contestants/cooking',
  'src/assets/derived/contestants/movement',
  'src/assets/derived/curios',
  'public/runtime/images',
  'public/runtime/video/cooking',
  'public/runtime/audio',
  'assets/archive',
  'assets/review/unused',
];

const allowedUnreferencedRuntimeFiles = new Set([
  'public/runtime/audio/previews/pip-takes-the-win.mp3',
]);

const legacyPrefixRules = [
  { prefix: 'attached_assets/', reason: 'workspace uploads are not canonical app assets' },
  { prefix: 'public/runtime/', reason: 'browser URLs must be rooted at runtime/ so BASE_URL remains valid' },
  { prefix: 'assets/source/', reason: 'source uploads must not be imported into the browser bundle' },
  { prefix: 'assets/archive/', reason: 'archived material must not be used by the active app' },
  { prefix: 'assets/review/', reason: 'review-queue material must not be used by the active app' },
];

const toPosix = (value) => value.split(path.sep).join('/');
const absolutePath = (relativePath) => path.join(PROJECT_ROOT, relativePath);

async function fileExists(relativePath) {
  try {
    return (await stat(absolutePath(relativePath))).isFile();
  } catch {
    return false;
  }
}

async function listFiles(relativePath) {
  const directory = absolutePath(relativePath);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childPath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(childPath));
    } else if (entry.isFile() && ASSET_EXTENSIONS.test(entry.name)) {
      files.push(toPosix(childPath));
    }
  }

  return files.sort();
}

async function listSourceFiles(relativePath) {
  const directory = absolutePath(relativePath);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childPath = path.join(relativePath, entry.name);
    if (entry.isDirectory() && entry.name !== 'assets') {
      files.push(...await listSourceFiles(childPath));
    } else if (entry.isFile() && SOURCE_EXTENSIONS.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      files.push(toPosix(childPath));
    }
  }

  return files.sort();
}

function addReference(referenceMap, relativePath, origin) {
  const normalized = toPosix(path.normalize(relativePath));
  if (!ASSET_EXTENSIONS.test(normalized)) return;
  const origins = referenceMap.get(normalized) ?? [];
  origins.push(origin);
  referenceMap.set(normalized, origins);
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

async function collectActiveReferences() {
  const sourceFiles = await listSourceFiles('src');
  const references = new Map();
  const sourceTexts = new Map();

  for (const relativeSourcePath of sourceFiles) {
    const source = await readFile(absolutePath(relativeSourcePath), 'utf8');
    sourceTexts.set(relativeSourcePath, source);

    const importPattern = /(?:from\s*|import\s*)["']([^"']+)["']/g;
    for (const match of source.matchAll(importPattern)) {
      const importPath = match[1];
      if (!importPath.startsWith('.') || !ASSET_EXTENSIONS.test(importPath)) continue;
      addReference(
        references,
        path.relative(PROJECT_ROOT, path.resolve(PROJECT_ROOT, path.dirname(relativeSourcePath), importPath)),
        `${relativeSourcePath}:${lineNumber(source, match.index)}`,
      );
    }

    const runtimePattern = /runtime\/([A-Za-z0-9_./${-]+\.(?:png|webp|mp3|mp4))/g;
    for (const match of source.matchAll(runtimePattern)) {
      if (match[1].includes('${')) continue;
      addReference(
        references,
        path.join('public/runtime', match[1]),
        `${relativeSourcePath}:${lineNumber(source, match.index)}`,
      );
    }

    if (relativeSourcePath === 'src/race-backgrounds.ts') {
      const raceFilePattern = /\bfile:\s*['"]([^'"]+\.(?:png|webp|mp3|mp4))['"]/g;
      for (const match of source.matchAll(raceFilePattern)) {
        addReference(
          references,
          path.join('public/runtime/images/race-backgrounds', match[1]),
          `${relativeSourcePath}:${lineNumber(source, match.index)}`,
        );
      }
    }

    if (relativeSourcePath === 'src/announcer-audio.ts') {
      const clipPathPattern = /\bclip\([^,]+,\s*['"]([^'"]+\.(?:png|webp|mp3|mp4))['"]/g;
      for (const match of source.matchAll(clipPathPattern)) {
        addReference(
          references,
          path.join('public/runtime/audio/announcer', match[1]),
          `${relativeSourcePath}:${lineNumber(source, match.index)}`,
        );
      }
    }

    if (relativeSourcePath === 'src/App.tsx') {
      const announcerClipPattern = /\bannouncerClip\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g;
      for (const match of source.matchAll(announcerClipPattern)) {
        addReference(
          references,
          path.join('public/runtime/audio/announcer', match[1], `${match[2]}.mp3`),
          `${relativeSourcePath}:${lineNumber(source, match.index)}`,
        );
      }
    }
  }

  const contestantConfig = sourceTexts.get('src/contestant-design-config.ts');
  const personaIds = [...contestantConfig.matchAll(/^\s*id:\s*['"]([^'"]+)['"]/gm)].map((match) => match[1]);
  const announcerSource = sourceTexts.get('src/announcer-audio.ts');
  if (announcerSource.includes('character-names/${personaId}.mp3')) {
    for (const personaId of personaIds) {
      addReference(
        references,
        `public/runtime/audio/announcer/character-names/${personaId}.mp3`,
        'src/announcer-audio.ts:dynamic character name',
      );
    }
  }
  if (sourceTexts.get('src/App.tsx').includes("announcerClip('character-names', persona.id")) {
    for (const personaId of personaIds) {
      addReference(
        references,
        `public/runtime/audio/announcer/character-names/${personaId}.mp3`,
        'src/App.tsx:dynamic contestant name',
      );
    }
  }

  return { references, sourceTexts };
}

function findLegacyPrefixes(sourceTexts) {
  const findings = [];
  for (const [relativeSourcePath, source] of sourceTexts) {
    for (const rule of legacyPrefixRules) {
      const prefixIndex = source.indexOf(rule.prefix);
      if (prefixIndex === -1) continue;
      const line = lineNumber(source, prefixIndex);
      findings.push(`${relativeSourcePath}:${line} uses ${rule.prefix} (${rule.reason})`);
    }
  }
  return findings;
}

async function verifyReadmeCounts(errors, inventory) {
  const readme = await readFile(absolutePath('README.md'), 'utf8');
  for (const relativePath of readmeCountPaths) {
    const escapedPath = relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const row = readme.match(new RegExp(`\\|\\s*\\\`${escapedPath}/?\\\`\\s*\\|\\s*(\\d+)\\s*\\|`));
    const actualCount = (await listFiles(relativePath)).length;
    inventory.push({ relativePath, actualCount });

    if (!row) {
      errors.push(`README.md is missing an asset count row for ${relativePath}/`);
      continue;
    }
    const documentedCount = Number(row[1]);
    if (documentedCount !== actualCount) {
      errors.push(`README.md count drift for ${relativePath}/: documents ${documentedCount}, found ${actualCount}`);
    }
  }
}

async function main() {
  const errors = [];
  const canonicalInventory = [];
  const readmeInventory = [];
  const { references, sourceTexts } = await collectActiveReferences();
  const activeFiles = new Set(references.keys());
  const allCanonicalFiles = new Set();

  for (const folder of canonicalFolders) {
    const files = await listFiles(folder.relativePath);
    canonicalInventory.push({ relativePath: folder.relativePath, actualCount: files.length });
    for (const file of files) allCanonicalFiles.add(file);
  }

  for (const [relativePath, origins] of references) {
    if (!allCanonicalFiles.has(relativePath)) {
      errors.push(`missing active file ${relativePath} (referenced by ${origins.join(', ')})`);
    }
    if (
      relativePath.startsWith('assets/source/') ||
      relativePath.startsWith('assets/archive/') ||
      relativePath.startsWith('assets/review/')
    ) {
      errors.push(`active reference points outside the active asset folders: ${relativePath}`);
    }
  }

  const derivedFiles = [
    ...await listFiles('src/assets/derived/contestants'),
    ...await listFiles('src/assets/derived/curios'),
  ];
  for (const file of derivedFiles) {
    if (!activeFiles.has(file)) {
      errors.push(`unreferenced derived asset outside the review queue: ${file}`);
    }
  }

  const runtimeFiles = [
    ...await listFiles('public/runtime/images'),
    ...await listFiles('public/runtime/video/cooking'),
    ...await listFiles('public/runtime/audio'),
  ];
  for (const file of runtimeFiles) {
    if (!activeFiles.has(file) && !allowedUnreferencedRuntimeFiles.has(file)) {
      errors.push(`unreferenced runtime asset outside the review queue: ${file}`);
    }
  }

  errors.push(...findLegacyPrefixes(sourceTexts));
  await verifyReadmeCounts(errors, readmeInventory);

  console.log('Mystery Bento asset inventory');
  console.log('============================');
  console.log('\nCanonical folder totals');
  for (const entry of canonicalInventory) {
    console.log(`${entry.relativePath.padEnd(44)} ${entry.actualCount}`);
  }
  console.log('\nREADME asset-map totals');
  for (const entry of readmeInventory) {
    console.log(`${entry.relativePath.padEnd(44)} ${entry.actualCount}`);
  }
  console.log(`Active source references: ${[...references].filter(([file]) => file.startsWith('src/')).length}`);
  console.log(`Active runtime references: ${[...references].filter(([file]) => file.startsWith('public/runtime/')).length}`);
  console.log(`Review queue files: ${(await listFiles('assets/review/unused')).length}`);

  if (errors.length > 0) {
    console.error('\nAsset inventory errors:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log('\nAsset inventory is synchronized.');
}

await main();