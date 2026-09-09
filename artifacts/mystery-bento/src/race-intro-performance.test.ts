import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appSource = readFileSync(fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8');
const cssSource = readFileSync(fileURLToPath(new URL('./index.css', import.meta.url)), 'utf8');

assert.match(appSource, /scheduleRaceImagePreloadPlan\(getRaceImagePreloadPlan/);
assert.match(appSource, /concurrency: renderingProfile\.constrained \? 1 : 2/);
assert.match(appSource, /new AnimatedChefSprite|AnimatedChefSprite persona=\{activeChef\} suspended=\{contestOpen\}/);
assert.match(appSource, /bento-app\$\{contestOpen \? ' is-contest-active' : ''\}/);
assert.match(cssSource, /\.bento-app\.is-contest-active \.conveyor-track/);
assert.match(cssSource, /animation-play-state: paused/);
assert.match(cssSource, /\.contest-race-backdrop \{ backdrop-filter: none; \}/);

console.log('Race intro performance verification passed: preload, suspension, and compositing guards are wired.');