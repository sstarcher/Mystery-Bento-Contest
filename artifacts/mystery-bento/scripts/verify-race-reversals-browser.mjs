import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const browserUrl = process.env.RACE_BROWSER_URL
  ?? `http://127.0.0.1:${process.env.PORT ?? '5173'}/?raceCheck=109`;
const chromiumPath = process.env.CHROMIUM_PATH ?? '/repl/tools/bin/chromium';
const cdpPort = Number(process.env.CDP_PORT ?? 9229);
const profileDir = await mkdtemp(join(tmpdir(), 'mystery-bento-race-check-'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    this.events = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      const listeners = this.events.get(message.method) ?? [];
      listeners.forEach((listener) => listener(message.params));
    });
  }

  command(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.events.get(method) ?? [];
    listeners.push(listener);
    this.events.set(method, listeners);
  }
}

async function waitFor(predicate, timeoutMs, label, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function evaluate(cdp, expression, returnByValue = true) {
  const result = await cdp.command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Browser evaluation failed');
  }
  return returnByValue ? result.result?.value : result.result;
}

let browser;
let socket;
try {
  browser = spawn(chromiumPath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out starting Chromium')), 8000);
    browser.stderr.on('data', (chunk) => {
      if (chunk.toString().includes('DevTools listening')) {
        clearTimeout(timer);
        resolve();
      }
    });
    browser.once('error', reject);
  });

  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const page = targets.find((target) => target.type === 'page');
  assert(page?.webSocketDebuggerUrl, 'Chromium did not expose a page target');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  const cdp = new CdpClient(socket);
  await cdp.command('Page.enable');
  await cdp.command('Runtime.enable');
  const browserErrors = [];
  cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
    browserErrors.push(exceptionDetails?.text ?? 'uncaught browser exception');
  });

  await cdp.command('Page.navigate', { url: browserUrl.includes('?') ? browserUrl : `${browserUrl}?raceCheck=109` });
  await waitFor(
    () => evaluate(cdp, 'document.readyState === "complete" && Boolean(document.querySelector("[data-testid=\\"meter-charge-control\\"]"))'),
    15000,
    'Mystery Bento to load',
  );
  await evaluate(cdp, `localStorage.setItem('mystery-bento-voice-announcer', 'off'); localStorage.setItem('mystery-bento-meter', JSON.stringify({ progress: 100, lastAcknowledgement: 'race check ready' })); location.reload();`);
  await waitFor(
    () => evaluate(cdp, 'Boolean(document.querySelector("[data-testid=\\"meter-shell\\"]"))'),
    15000,
    'full meter to reload',
  );
  await evaluate(cdp, 'document.querySelector("[data-testid=\\"meter-shell\\"]")?.click(); true;');
  await waitFor(
    () => evaluate(cdp, 'Boolean(document.querySelector("[data-testid=\\"button-skip-contest\\"]"))'),
    15000,
    'contest overlay to open',
  );
  await waitFor(
    () => evaluate(cdp, 'Boolean(document.querySelector(".contest-race"))'),
    15000,
    'race presentation to begin',
  );

  const metadata = await evaluate(cdp, `(() => {
    const race = document.querySelector('.contest-race');
    return {
      winnerId: race?.dataset.raceWinnerId,
      initialOrder: JSON.parse(race?.dataset.raceInitialOrder ?? '[]'),
      initialGap: Number(race?.dataset.raceInitialGap ?? 0),
      checkpointLeaders: JSON.parse(race?.dataset.raceCheckpointLeaders ?? '{}'),
      leadChanges: JSON.parse(race?.dataset.raceLeadChanges ?? '[]'),
    };
  })()`);
  assert(metadata.initialGap >= 10, `expected a large initial gap, got ${metadata.initialGap.toFixed(2)}`);
  assert(metadata.initialOrder[0] === 'pip', `expected Pip to start in front, got ${metadata.initialOrder.join(', ')}`);
  assert(metadata.leadChanges.length >= 2, `expected at least two resolved lead changes, got ${metadata.leadChanges.length}`);
  assert(metadata.leadChanges.some(({ kind }) => kind === 'reversal'), 'expected a resolved lead reversal');

  const liveSamples = [];
  let sampling = true;
  const sampleLiveOrder = async () => {
    if (!sampling) return;
    const sample = await evaluate(cdp, `(() => {
      const lanes = [...document.querySelectorAll('.race-runner-lane')].map((lane) => ({
        id: lane.dataset.personaId,
        anchor: Number(lane.querySelector('.race-runner')?.dataset.runnerAnchor ?? NaN),
      }));
      return {
        order: lanes.slice().sort((a, b) => b.anchor - a.anchor).map((lane) => lane.id),
        lanes,
      };
    })()`);
    if (sample?.lanes?.every((lane) => Number.isFinite(lane.anchor))) liveSamples.push(sample);
  };
  const sampleTimer = setInterval(() => { void sampleLiveOrder(); }, 150);

  const observed = [];
  for (const change of metadata.leadChanges) {
    const checkpoint = metadata.checkpointLeaders[change.obstacleId];
    const checkpointIndex = Number.parseInt(change.obstacleId.split('-')[1], 10) - 1;
    await waitFor(
      () => evaluate(cdp, `(() => [...document.querySelectorAll('.race-runner-lane')].some((lane) => Number(lane.dataset.obstacleIndex ?? -1) >= ${checkpointIndex}))()`),
      12000,
      `${change.obstacleId} contact to begin`,
      150,
    );
    await new Promise((resolve) => setTimeout(resolve, 700));
    const snapshot = await evaluate(cdp, `(() => {
      const lanes = [...document.querySelectorAll('.race-runner-lane')].map((lane) => ({
        id: lane.dataset.personaId,
        obstacleIndex: Number(lane.dataset.obstacleIndex ?? -1),
        reaction: lane.dataset.runnerReaction,
        anchor: Number(lane.querySelector('.race-runner')?.dataset.runnerAnchor ?? NaN),
      }));
      return {
        order: lanes.slice().sort((a, b) => b.anchor - a.anchor).map((lane) => lane.id),
        lanes,
      };
    })()`);
    assert(snapshot.lanes.every((lane) => Number.isFinite(lane.anchor)), `${change.obstacleId} rendered a non-finite runner anchor`);
    const from = snapshot.lanes.find((lane) => lane.id === change.fromPersonaId);
    const to = snapshot.lanes.find((lane) => lane.id === change.toPersonaId);
    const matchesResolvedLeader = snapshot.order[0] === checkpoint.afterId;
    const resolvedPairVisible = Boolean(from && to && to.anchor > from.anchor);
    observed.push({
      obstacleId: change.obstacleId,
      resolvedLeader: checkpoint.afterId,
      renderedOrder: snapshot.order,
      matchesResolvedLeader,
      resolvedPairVisible,
      reactions: snapshot.lanes.map(({ id, reaction }) => ({ id, reaction })),
    });
  }

  const renderedOrders = observed.map(({ renderedOrder }) => renderedOrder.join('>'));
  const renderedLeadChanges = renderedOrders.slice(1).filter((order, index) => order !== renderedOrders[index]).length;
  assert(renderedLeadChanges >= 1, `expected a rendered lead change at checkpoints, got ${renderedOrders.join(' | ')}`);
  assert(observed.some(({ matchesResolvedLeader }) => matchesResolvedLeader), 'no obstacle checkpoint matched the resolved rendered leader');
  assert(observed.some(({ resolvedPairVisible }) => resolvedPairVisible), 'no resolved checkpoint pair appeared ahead in the rendered anchors');

  await waitFor(
    () => evaluate(cdp, 'Boolean(document.querySelector(".contest-race[data-finish-crossed=\\"true\\"]"))'),
    20000,
    'finish crossing to resolve',
    150,
  );
  await waitFor(
    () => evaluate(cdp, 'Boolean(document.querySelector("[data-testid=\\"winner-reveal-card\\"]"))'),
    12000,
    'winner reveal to render',
    150,
  );
  sampling = false;
  clearInterval(sampleTimer);
  await sampleLiveOrder();
  const liveOrders = liveSamples.map(({ order }) => order.join('>'));
  const liveLeadChanges = liveOrders.slice(1).filter((order, index) => order !== liveOrders[index]).length;
  const liveLeaders = liveSamples.map(({ order }) => order[0]).filter(Boolean);
  const liveReversal = liveLeaders.some((leader, index) => liveLeaders.slice(0, index).includes(leader) && leader !== liveLeaders[index - 1]);
  const liveLeaderTransitions = liveLeaders.filter((leader, index) => index === 0 || leader !== liveLeaders[index - 1]);
  assert(liveLeadChanges >= 2, `expected repeated live lead changes, got ${liveOrders.join(' | ')}`);
  assert(liveReversal, `expected a live leader reversal, got ${liveLeaders.join(' -> ')}`);
  const finish = await evaluate(cdp, `(() => {
    const race = document.querySelector('.contest-race');
    const reveal = document.querySelector('[data-testid="winner-reveal-card"]');
    return {
      winnerId: race?.dataset.raceWinnerId,
      revealText: reveal?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
      finishCrossed: race?.dataset.finishCrossed === 'true',
      victoryLanes: [...document.querySelectorAll('.race-runner-lane')].filter((lane) => lane.querySelector('[data-movement-action="victory"]') || lane.dataset.personaId === race?.dataset.raceWinnerId).map((lane) => lane.dataset.personaId),
    };
  })()`);
  assert(finish.finishCrossed, 'finish presentation did not mark the race crossed');
  assert(finish.winnerId === metadata.winnerId, 'finish winner did not match the resolved race winner');
  assert(finish.revealText.includes(finish.winnerId === 'pip' ? 'Pip Porridge' : finish.winnerId === 'sencha' ? 'Lady Sencha' : 'Nori Nib'), 'winner reveal did not name the resolved winner');
  assert(browserErrors.length === 0, `browser reported ${browserErrors.length} exception(s): ${browserErrors.join('; ')}`);

  console.log(JSON.stringify({
    status: 'passed',
    initialOrder: metadata.initialOrder,
    initialGap: Number(metadata.initialGap.toFixed(2)),
    leadChanges: metadata.leadChanges,
    renderedLeadChanges,
    liveLeadChanges,
    liveLeaderTransitions,
    observed,
    finish,
  }, null, 2));
} finally {
  socket?.close();
  if (browser && browser.exitCode === null) {
    browser.kill('SIGTERM');
    await new Promise((resolve) => browser.once('exit', resolve));
  }
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}