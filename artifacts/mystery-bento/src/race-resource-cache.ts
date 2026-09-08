export type RaceResourceStatus = 'pending' | 'ready' | 'failed';

export type RaceImageResource = {
  status: RaceResourceStatus;
  promise: Promise<boolean>;
};

export type RaceAudioResource = {
  status: RaceResourceStatus;
  durationMs?: number;
  promise: Promise<boolean>;
};

const imageResources = new Map<string, RaceImageResource>();
const audioResources = new Map<string, RaceAudioResource>();

function uniqueSources(sources: readonly string[]) {
  return [...new Set(sources.filter(Boolean))];
}

export function getUniqueRaceResourceSources(sources: readonly string[]) {
  return uniqueSources(sources);
}

export function preloadRaceImage(src: string): RaceImageResource {
  const existing = imageResources.get(src);
  if (existing) return existing;

  let resolveResource!: (ready: boolean) => void;
  let settled = false;
  const resource = {
    status: 'pending' as RaceResourceStatus,
    promise: new Promise<boolean>((resolve) => {
      resolveResource = resolve;
    }),
  };
  imageResources.set(src, resource);

  const settle = (ready: boolean) => {
    if (settled) return;
    settled = true;
    resource.status = ready ? 'ready' : 'failed';
    resolveResource(ready);
  };

  if (typeof Image === 'undefined') {
    settle(false);
    return resource;
  }

  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    if (typeof image.decode === 'function') {
      void image.decode().catch(() => undefined).then(() => settle(true));
    } else {
      settle(true);
    }
  };
  image.onerror = () => settle(false);
  image.src = src;
  if (image.complete && image.naturalWidth > 0) image.onload(new Event('load'));
  return resource;
}

export function preloadRaceAudioMetadata(src: string): RaceAudioResource {
  const existing = audioResources.get(src);
  if (existing) return existing;

  let resolveResource!: (ready: boolean) => void;
  let settled = false;
  const resource: RaceAudioResource = {
    status: 'pending',
    promise: new Promise<boolean>((resolve) => {
      resolveResource = resolve;
    }),
  };
  audioResources.set(src, resource);

  const settle = (ready: boolean, durationMs?: number) => {
    if (settled) return;
    settled = true;
    resource.status = ready ? 'ready' : 'failed';
    if (durationMs !== undefined) resource.durationMs = durationMs;
    resolveResource(ready);
  };

  if (typeof Audio === 'undefined') {
    settle(false);
    return resource;
  }

  const audio = new Audio();
  audio.preload = 'metadata';
  audio.addEventListener('loadedmetadata', () => {
    const durationMs = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration * 1000
      : undefined;
    settle(true, durationMs);
  }, { once: true });
  audio.addEventListener('error', () => settle(false), { once: true });
  audio.src = src;
  audio.load();
  return resource;
}

export function getRaceAudioResource(src: string) {
  return audioResources.get(src);
}

type StagedPreloadHandle = {
  promise: Promise<boolean[]>;
  cancel: () => void;
};

/**
 * Start a small number of decodes at a time. The browser cache remains shared,
 * while each contest only owns the timer that stages its lower-priority work.
 */
export function scheduleRaceImagePreload(
  sources: readonly string[],
  batchSize = 3,
  batchDelayMs = 45,
): StagedPreloadHandle {
  const pendingSources = uniqueSources(sources);
  const timers: number[] = [];
  let cancelled = false;
  let resolveAll!: (results: boolean[]) => void;
  const results: boolean[] = [];
  const promise = new Promise<boolean[]>((resolve) => {
    resolveAll = resolve;
  });

  const runBatch = (start: number) => {
    if (cancelled) {
      resolveAll(results);
      return;
    }
    if (start >= pendingSources.length) {
      resolveAll(results);
      return;
    }
    const batch = pendingSources.slice(start, start + Math.max(1, batchSize));
    Promise.all(batch.map((src) => preloadRaceImage(src).promise)).then((batchResults) => {
      results.push(...batchResults);
      if (cancelled) {
        resolveAll(results);
        return;
      }
      const timer = window.setTimeout(() => runBatch(start + batch.length), batchDelayMs);
      timers.push(timer);
    });
  };

  if (!pendingSources.length) {
    resolveAll([]);
  } else if (typeof window === 'undefined') {
    resolveAll([]);
  } else {
    runBatch(0);
  }

  return {
    promise,
    cancel: () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      resolveAll(results);
    },
  };
}

export function scheduleRaceAudioPreload(sources: readonly string[]) {
  const resources = uniqueSources(sources).map(preloadRaceAudioMetadata);
  return Promise.all(resources.map((resource) => resource.promise));
}

export function clearRaceResourceCacheForTests() {
  imageResources.clear();
  audioResources.clear();
}