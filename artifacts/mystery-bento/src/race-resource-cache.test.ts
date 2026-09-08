import assert from 'node:assert/strict';
import {
  clearRaceResourceCacheForTests,
  getUniqueRaceResourceSources,
  getRaceAudioResource,
  preloadRaceAudioMetadata,
  preloadRaceImage,
} from './race-resource-cache';

assert.deepEqual(
  getUniqueRaceResourceSources(['selected-run.png', 'selected-run.png', '', 'obstacle.png']),
  ['selected-run.png', 'obstacle.png'],
);

const originalImage = globalThis.Image;
let imageConstructed = 0;
class TestImage {
  decoding = 'auto';
  complete = false;
  naturalWidth = 0;
  onload: ((event: Event) => void) | null = null;
  onerror: (() => void) | null = null;
  decode() {
    return Promise.resolve();
  }
  set src(_value: string) {
    imageConstructed += 1;
    this.complete = true;
    this.naturalWidth = 1;
    queueMicrotask(() => this.onload?.(new Event('load')));
  }
}
globalThis.Image = TestImage as unknown as typeof Image;

clearRaceResourceCacheForTests();
const first = preloadRaceImage('selected-run.png');
const second = preloadRaceImage('selected-run.png');
assert.equal(first, second);
assert.equal(imageConstructed, 1);
assert.equal(await first.promise, true);
assert.equal(first.status, 'ready');

const originalAudio = globalThis.Audio;
let audioConstructed = 0;
class TestAudio {
  duration = 1.25;
  private listeners = new Map<string, () => void>();
  constructor() {
    audioConstructed += 1;
  }
  preload = 'none';
  src = '';
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }
  load() {
    queueMicrotask(() => this.listeners.get('loadedmetadata')?.());
  }
}
globalThis.Audio = TestAudio as unknown as typeof Audio;

const firstAudio = preloadRaceAudioMetadata('selected-announcer.mp3');
const secondAudio = preloadRaceAudioMetadata('selected-announcer.mp3');
assert.equal(firstAudio, secondAudio);
assert.equal(audioConstructed, 1);
assert.equal(await firstAudio.promise, true);
assert.equal(getRaceAudioResource('selected-announcer.mp3')?.durationMs, 1250);

globalThis.Image = originalImage;
globalThis.Audio = originalAudio;
clearRaceResourceCacheForTests();
console.log('Race resource cache verification passed.');