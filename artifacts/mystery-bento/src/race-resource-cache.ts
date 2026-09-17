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

type RaceAudioPreloadMode = 'metadata' | 'auto';

export function preloadRaceAudioMetadata(src: string, preload: RaceAudioPreloadMode = 'metadata'): RaceAudioResource {
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
  audio.preload = preload;
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
  priorityPromise?: Promise<boolean[]>;
  cancel: () => void;
};

/**
 * Keep the visible intro and the first movement sheets ahead of course art.
 * The browser cache remains shared, while each contest only owns the timers
 * that stage its lower-priority work.
 */
export type RaceImagePreloadPlan = {
  prioritySources: readonly string[];
  deferredSources: readonly string[];
};

export function createRaceImagePreloadPlan(
  prioritySources: readonly string[],
  deferredSources: readonly string[],
): RaceImagePreloadPlan {
  const priority = uniqueSources(prioritySources);
  const prioritySet = new Set(priority);
  return {
    prioritySources: priority,
    deferredSources: uniqueSources(deferredSources).filter((src) => !prioritySet.has(src)),
  };
}

type RaceImagePreloadOptions = {
  concurrency?: number;
  idleDelayMs?: number;
};

function scheduleIdle(callback: () => void, delayMs: number) {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(callback, { timeout: Math.max(50, delayMs * 4) });
  } else {
    window.setTimeout(callback, delayMs);
  }
}

export function scheduleRaceImagePreloadPlan(
  plan: RaceImagePreloadPlan,
  options: RaceImagePreloadOptions = {},
): StagedPreloadHandle {
  const prioritySources = uniqueSources(plan.prioritySources);
  const prioritySet = new Set(prioritySources);
  const pendingSources = [
    ...prioritySources,
    ...uniqueSources(plan.deferredSources).filter((src) => !prioritySet.has(src)),
  ];
  const priorityCount = prioritySources.length;
  const concurrency = Math.max(1, options.concurrency ?? 2);
  const idleDelayMs = Math.max(0, options.idleDelayMs ?? 24);
  const timers: number[] = [];
  let cancelled = false;
  let resolveAll!: (results: boolean[]) => void;
  let resolvePriority!: (results: boolean[]) => void;
  let priorityRemaining = priorityCount;
  let allSettled = false;
  let prioritySettled = priorityCount === 0;
  const results: boolean[] = [];
  const promise = new Promise<boolean[]>((resolve) => {
    resolveAll = resolve;
  });
  const priorityPromise = new Promise<boolean[]>((resolve) => {
    resolvePriority = resolve;
  });

  const settlePriority = () => {
    if (prioritySettled) return;
    prioritySettled = true;
    resolvePriority(results.slice(0, priorityCount));
  };
  const settleAll = () => {
    if (allSettled) return;
    allSettled = true;
    settlePriority();
    resolveAll(results);
  };
  let cursor = 0;
  let active = 0;
  const runNext = () => {
    if (cancelled) {
      settleAll();
      return;
    }
    while (!cancelled && active < concurrency && cursor < pendingSources.length) {
      const index = cursor;
      const src = pendingSources[cursor];
      cursor += 1;
      active += 1;
      void preloadRaceImage(src).promise.then((ready) => {
        results[index] = ready;
        active -= 1;
        if (index < priorityCount) {
          priorityRemaining -= 1;
          if (priorityRemaining === 0) settlePriority();
        }
        if (cursor >= pendingSources.length && active === 0) {
          settleAll();
          return;
        }
        scheduleIdle(runNext, idleDelayMs);
      });
    }
    if (cursor >= pendingSources.length && active === 0) {
      settleAll();
    } else if (!pendingSources.length) {
      settleAll();
    }
  };

  if (!pendingSources.length || typeof window === 'undefined') {
    if (typeof window === 'undefined') {
      resolvePriority([]);
      prioritySettled = true;
    }
    settleAll();
  } else {
    // Start the first visible resources immediately; every subsequent dispatch
    // yields to the browser so announcement paints and input stay responsive.
    runNext();
  }

  return {
    promise,
    priorityPromise,
    cancel: () => {
      if (cancelled || allSettled) return;
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      settleAll();
    },
  };
}

export function scheduleRaceImagePreload(
  sources: readonly string[],
  batchSize = 3,
  batchDelayMs = 45,
): StagedPreloadHandle {
  return scheduleRaceImagePreloadPlan(
    createRaceImagePreloadPlan(sources, []),
    { concurrency: batchSize, idleDelayMs: batchDelayMs },
  );
}

export function scheduleRaceAudioPreload(
  sources: readonly string[],
  preload: RaceAudioPreloadMode = 'metadata',
) {
  const pendingSources = uniqueSources(sources);
  if (!pendingSources.length) return Promise.resolve([]);
  const results: boolean[] = [];
  let cursor = 0;
  let active = 0;
  return new Promise<boolean[]>((resolve) => {
    const runNext = () => {
      while (active < 2 && cursor < pendingSources.length) {
        const index = cursor;
        cursor += 1;
        active += 1;
        void preloadRaceAudioMetadata(pendingSources[index], preload).promise.then((ready) => {
          results[index] = ready;
          active -= 1;
          if (cursor >= pendingSources.length && active === 0) {
            resolve(results);
          } else {
            scheduleIdle(runNext, 30);
          }
        });
      }
    };
    runNext();
  });
}

export function clearRaceResourceCacheForTests() {
  imageResources.clear();
  audioResources.clear();
}