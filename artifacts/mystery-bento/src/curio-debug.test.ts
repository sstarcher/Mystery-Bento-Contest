import { strict as assert } from 'node:assert';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getCurioDebugState, selectRestaurantShelfCollectibles } from './curio-debug';

assert.deepEqual(getCurioDebugState('?debug'), {
  isDebugMode: true,
  initialShowcaseEnabled: false,
});
assert.deepEqual(getCurioDebugState('?debug='), {
  isDebugMode: true,
  initialShowcaseEnabled: false,
});
assert.deepEqual(getCurioDebugState('?debug=curio-shelf'), {
  isDebugMode: true,
  initialShowcaseEnabled: true,
});
assert.deepEqual(getCurioDebugState('?debug=anything-else'), {
  isDebugMode: true,
  initialShowcaseEnabled: false,
});
assert.deepEqual(getCurioDebugState('?view=restaurant'), {
  isDebugMode: false,
  initialShowcaseEnabled: false,
});

const earned = ['earned-one', 'earned-two'];
const showcase = ['showcase-one', 'showcase-two', 'showcase-three'];
assert.deepEqual(
  selectRestaurantShelfCollectibles(earned, showcase, {
    isDebugMode: false,
    showcaseEnabled: true,
    maxItems: 2,
  }),
  earned,
  'showcase items stay hidden outside debug mode',
);
assert.deepEqual(
  selectRestaurantShelfCollectibles(earned, showcase, {
    isDebugMode: true,
    showcaseEnabled: false,
    maxItems: 2,
  }),
  earned,
  'the unchecked debug control restores earned curios',
);
assert.deepEqual(
  selectRestaurantShelfCollectibles(earned, showcase, {
    isDebugMode: true,
    showcaseEnabled: true,
    maxItems: 2,
  }),
  ['showcase-one', 'showcase-two'],
  'the showcase is bounded to the available shelf cells',
);

type CdpMessage = {
  id?: number;
  result?: Record<string, unknown>;
  error?: { message?: string };
  method?: string;
  params?: Record<string, unknown>;
};

type CdpEvaluation = {
  result?: {
    value?: unknown;
    description?: string;
  };
  exceptionDetails?: {
    text?: string;
    exception?: { description?: string };
  };
};

class DevToolsClient {
  private readonly socket: WebSocket;
  private nextId = 0;
  private readonly pending = new Map<number, {
    resolve: (message: CdpMessage) => void;
    reject: (error: Error) => void;
  }>();

  private constructor(socket: WebSocket) {
    this.socket = socket;
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as CdpMessage;
      if (!message.id) return;
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) {
        request.reject(new Error(message.error.message ?? 'Chrome DevTools Protocol request failed'));
      } else {
        request.resolve(message);
      }
    });
  }

  static async connect(url: string) {
    const socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener('open', () => resolve(), { once: true });
      socket.addEventListener('error', () => reject(new Error('Could not connect to Chrome DevTools Protocol')), { once: true });
    });
    return new DevToolsClient(socket);
  }

  async send(method: string, params: Record<string, unknown> = {}) {
    const id = ++this.nextId;
    const message = new Promise<CdpMessage>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    return message;
  }

  async evaluate<T>(expression: string): Promise<T> {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    const evaluation = response.result as unknown as CdpEvaluation | undefined;
    if (evaluation?.exceptionDetails) {
      throw new Error(
        evaluation.exceptionDetails.exception?.description
        ?? evaluation.exceptionDetails.text
        ?? 'Browser evaluation failed',
      );
    }
    return evaluation?.result?.value as T;
  }

  close() {
    this.socket.close();
  }
}

type BrowserProcess = {
  process: ChildProcess;
  client: DevToolsClient;
  profileDirectory: string;
};

function findBrowserBinary(): string | undefined {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/repl/tools/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean) as string[];
  return candidates.find((binary) => existsSync(binary));
}

const browserBinary = findBrowserBinary();
const appPort = 24284;
const devtoolsPort = 24285;
const packageDirectory = process.cwd().endsWith('artifacts/mystery-bento')
  ? process.cwd()
  : join(process.cwd(), 'artifacts/mystery-bento');
const appUrl = `http://127.0.0.1:${appPort}`;

async function waitForHttp(url: string, timeoutMs = 20_000, hasExited?: () => boolean) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no response';
  while (Date.now() < deadline) {
    if (hasExited?.()) {
      throw new Error(`Server process exited prematurely while waiting for ${url}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

async function openBrowser(): Promise<BrowserProcess> {
  if (!browserBinary) throw new Error('Missing browser binary');
  const profileDirectory = mkdtempSync(join(tmpdir(), 'mystery-bento-curio-browser-'));
  const browserProcess = spawn(browserBinary, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${devtoolsPort}`,
    `--user-data-dir=${profileDirectory}`,
    'about:blank',
  ], { stdio: 'ignore' });

  await waitForHttp(`http://127.0.0.1:${devtoolsPort}/json/version`);
  const targets = await (await fetch(`http://127.0.0.1:${devtoolsPort}/json/list`)).json() as Array<{ type?: string; webSocketDebuggerUrl?: string }>;
  const target = targets.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
  if (!target?.webSocketDebuggerUrl) {
    browserProcess.kill();
    rmSync(profileDirectory, { recursive: true, force: true });
    throw new Error('Chrome did not expose a page target');
  }

  return {
    process: browserProcess,
    client: await DevToolsClient.connect(target.webSocketDebuggerUrl),
    profileDirectory,
  };
}

async function navigate(
  client: DevToolsClient,
  width: number,
  height: number,
  mobile = false,
  deviceScaleFactor = 1,
) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor,
    mobile,
  });
  await client.send(
    'Emulation.setTouchEmulationEnabled',
    mobile ? { enabled: true, maxTouchPoints: 1 } : { enabled: false },
  );
  await client.send('Page.navigate', { url: `${appUrl}/?debug=curio-shelf` });
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const ready = await client.evaluate<boolean>(`
      Boolean(document.querySelector('.restaurant-curio-shelf-stage .displayed-curio'))
    `);
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for curio shelf at ${width}x${height}`);
}

type CurioInteractionResult = {
  focused: boolean;
  hovered: boolean;
  cardVisible: boolean;
  cardWidth: number;
  cardHeight: number;
  cardLeft: number;
  cardTop: number;
  cardRight: number;
  cardBottom: number;
  curioLeft: number;
  curioRight: number;
  windowWidth: number;
  visualViewportWidth: number | null;
  visualViewportOffsetLeft: number | null;
  tooltipShiftX: string;
  tooltipViewportWidth: string;
  appViewportLeft: number | null;
  appViewportRight: number | null;
  viewportWidth: number;
  viewportHeight: number;
  cardWithinViewport: boolean;
  cardWithinScene: boolean;
  activeZIndex: number;
  containerZIndex: number;
  neighborCount: number;
  neighborOverlap: boolean;
  tooltipIsTopmostAtOverlap: boolean;
};

async function inspectCurio(
  client: DevToolsClient,
  selector: string,
  inline: 'center' | 'nearest' = 'center',
  scrollIntoView = true,
  inputKind: 'mouse' | 'touch' = 'mouse',
): Promise<CurioInteractionResult> {
  await client.evaluate(`
    (() => {
      const curio = document.querySelector(${JSON.stringify(selector)});
      if (!curio) throw new Error('Missing curio: ' + ${JSON.stringify(selector)});
      if (${JSON.stringify(scrollIntoView)}) {
        curio.scrollIntoView({ block: 'center', inline: ${JSON.stringify(inline)} });
      }
      curio.focus({ preventScroll: true });
    })()
  `);
  await new Promise((resolve) => setTimeout(resolve, 180));

  const focusState = await client.evaluate<{ x: number; y: number }>(`
    (() => {
      const curio = document.querySelector(${JSON.stringify(selector)});
      if (!curio) throw new Error('Missing curio after focus');
      const rect = curio.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportRight = viewportLeft + (viewport?.width ?? window.innerWidth);
      const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
      const appRect = document.querySelector('.bento-app')?.getBoundingClientRect();
      const sceneRect = document.querySelector('.scene-shell')?.getBoundingClientRect();
      const left = Math.max(viewportLeft, appRect?.left ?? 0, sceneRect?.left ?? 0);
      const right = Math.min(viewportRight, appRect?.right ?? window.innerWidth, sceneRect?.right ?? window.innerWidth);
      const top = Math.max(viewportTop, appRect?.top ?? 0, sceneRect?.top ?? 0);
      const bottom = Math.min(viewportBottom, appRect?.bottom ?? window.innerHeight, sceneRect?.bottom ?? window.innerHeight);
      return {
        x: Math.max(left + 1, Math.min(right - 1, rect.left + rect.width / 2)),
        y: Math.max(top + 1, Math.min(bottom - 1, rect.top + rect.height / 2)),
      };
    })()
  `);
  if (inputKind === 'touch') {
    await client.evaluate(`
      (() => {
        const curio = document.querySelector(${JSON.stringify(selector)});
        if (!curio) throw new Error('Missing curio for touch pointer-down');
        curio.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
        }));
      })()
    `);
  } else if (inputKind === 'mouse') {
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: focusState.x,
      y: focusState.y,
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 180));

  return client.evaluate<CurioInteractionResult>(`
    (() => {
      const curio = document.querySelector(${JSON.stringify(selector)});
      if (!curio) throw new Error('Missing curio after hover');
      const card = curio.querySelector('.curio-info-card')
        ?? curio.parentElement?.querySelector(':scope > .curio-info-card');
      if (!card) throw new Error('Curio has no tooltip card');
      const cardRect = card.getBoundingClientRect();
      const sceneRect = document.querySelector('.scene-shell')?.getBoundingClientRect();
      const visualViewport = window.visualViewport;
      const viewportLeft = visualViewport?.offsetLeft ?? 0;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportRight = viewportLeft + (visualViewport?.width ?? window.innerWidth);
      const viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);
      const appRect = document.querySelector('.bento-app')?.getBoundingClientRect();
      const visibleLeft = Math.max(viewportLeft, appRect?.left ?? 0, sceneRect?.left ?? 0);
      const visibleTop = Math.max(viewportTop, appRect?.top ?? 0, sceneRect?.top ?? 0);
      const visibleRight = Math.min(viewportRight, appRect?.right ?? window.innerWidth, sceneRect?.right ?? window.innerWidth);
      const visibleBottom = Math.min(viewportBottom, appRect?.bottom ?? window.innerHeight, sceneRect?.bottom ?? window.innerHeight);
      const shelfStage = curio.closest('.restaurant-curio-shelf-stage');
      const siblingRoot = shelfStage ?? curio.parentElement;
      const siblingSelector = shelfStage ? '.curio-hotspot' : ':scope > .curio-hotspot';
      const siblings = [...(siblingRoot?.querySelectorAll(siblingSelector) ?? [])]
        .filter((node) => node !== curio && node instanceof HTMLElement && node.matches('.curio-hotspot'));
      const siblingRects = siblings.map((sibling) => sibling.getBoundingClientRect());
      const overlaps = siblingRects.filter((rect) => (
        rect.left < cardRect.right
        && rect.right > cardRect.left
        && rect.top < cardRect.bottom
        && rect.bottom > cardRect.top
      ));
      const overlap = overlaps[0];
      let tooltipIsTopmostAtOverlap = false;
      if (overlap) {
        const overlapLeft = Math.max(cardRect.left, overlap.left);
        const overlapRight = Math.min(cardRect.right, overlap.right);
        const overlapTop = Math.max(cardRect.top, overlap.top);
        const overlapBottom = Math.min(cardRect.bottom, overlap.bottom);
        const pointX = (overlapLeft + overlapRight) / 2;
        const pointY = (overlapTop + overlapBottom) / 2;
        const originalPointerEvents = card.style.pointerEvents;
        card.style.pointerEvents = 'auto';
        const topmost = document.elementFromPoint(pointX, pointY);
        card.style.pointerEvents = originalPointerEvents;
        tooltipIsTopmostAtOverlap = topmost === card || card.contains(topmost);
      }
      const style = getComputedStyle(curio);
      const cardStyle = getComputedStyle(card);
      return {
        focused: document.activeElement === curio,
        hovered: curio.matches(':hover'),
        cardVisible: cardStyle.visibility === 'visible' && Number(cardStyle.opacity) > .99,
        cardWidth: cardRect.width,
        cardHeight: cardRect.height,
        cardLeft: cardRect.left,
        cardTop: cardRect.top,
        cardRight: cardRect.right,
        cardBottom: cardRect.bottom,
        curioLeft: curio.getBoundingClientRect().left,
        curioRight: curio.getBoundingClientRect().right,
        windowWidth: window.innerWidth,
        visualViewportWidth: visualViewport?.width ?? null,
        visualViewportOffsetLeft: visualViewport?.offsetLeft ?? null,
        tooltipShiftX: card.style.getPropertyValue('--curio-tooltip-shift-x'),
        tooltipViewportWidth: card.style.getPropertyValue('--curio-visible-viewport-width'),
        appViewportLeft: appRect?.left ?? null,
        appViewportRight: appRect?.right ?? null,
        viewportWidth: visibleRight - visibleLeft,
        viewportHeight: visibleBottom - visibleTop,
        cardWithinViewport: cardRect.left >= visibleLeft
          && cardRect.top >= visibleTop
          && cardRect.right <= visibleRight
          && cardRect.bottom <= visibleBottom,
        cardWithinScene: Boolean(sceneRect)
          && cardRect.left >= (sceneRect?.left ?? 0)
          && cardRect.top >= (sceneRect?.top ?? 0)
          && cardRect.right <= (sceneRect?.right ?? 0)
          && cardRect.bottom <= (sceneRect?.bottom ?? 0),
        activeZIndex: Number(style.zIndex) || 0,
        containerZIndex: Number(getComputedStyle(curio.parentElement ?? curio).zIndex) || 0,
        neighborCount: siblings.length,
        neighborOverlap: Boolean(overlap),
        tooltipIsTopmostAtOverlap,
      };
    })()
  `);
}

function assertCurioInteraction(result: CurioInteractionResult, label: string) {
  assert.equal(result.focused, true, `${label} should expose its tooltip on keyboard focus`);
  assert.equal(result.hovered, true, `${label} should expose its tooltip on pointer hover`);
  assert.equal(result.cardVisible, true, `${label} tooltip should be visible`);
  assert.ok(result.cardWidth >= 280 && result.cardHeight > 40, `${label} tooltip should render at full size: ${JSON.stringify(result)}`);
  assert.equal(result.cardWithinViewport, true, `${label} tooltip should not be clipped by the viewport: ${JSON.stringify(result)}`);
  assert.equal(result.cardWithinScene, true, `${label} tooltip should not be clipped by the fixed scene`);
  assert.ok(result.activeZIndex >= 100, `${label} should promote the active curio above its neighbors`);
  assert.ok(result.neighborCount > 0, `${label} should have a neighboring curio to test against`);
  assert.equal(result.neighborOverlap, true, `${label} tooltip should overlap a neighboring curio: ${JSON.stringify(result)}`);
  assert.equal(result.tooltipIsTopmostAtOverlap, true, `${label} tooltip should paint above a neighboring curio: ${JSON.stringify(result)}`);
}

function assertCounterCurioInteraction(result: CurioInteractionResult, label: string) {
  assert.equal(result.focused, true, `${label} should expose its tooltip on keyboard focus`);
  assert.equal(result.hovered, true, `${label} should expose its tooltip on pointer hover`);
  assert.equal(result.cardVisible, true, `${label} tooltip should be visible`);
  assert.ok(result.cardWidth >= 280 && result.cardHeight > 40, `${label} tooltip should render at full size: ${JSON.stringify(result)}`);
  assert.equal(result.cardWithinViewport, true, `${label} tooltip should not be clipped by the viewport: ${JSON.stringify(result)}`);
  assert.equal(result.cardWithinScene, true, `${label} tooltip should not be clipped by the fixed scene`);
  assert.ok(result.activeZIndex >= 100, `${label} should promote the active curio above its neighbors`);
  assert.ok(result.containerZIndex >= 100, `${label} should promote its counter cluster above the counter scene`);
  assert.equal(result.neighborCount, 1, `${label} should have a neighboring counter curio`);
}

function assertMobileCurioInteraction(result: CurioInteractionResult, label: string) {
  assert.equal(result.focused, true, `${label} should open its tooltip on a phone-sized viewport: ${JSON.stringify(result)}`);
  assert.equal(result.cardVisible, true, `${label} tooltip should be visible on a phone-sized viewport: ${JSON.stringify(result)}`);
  assert.ok(result.cardWidth >= 280 && result.cardHeight > 40, `${label} tooltip should keep its reduced full size: ${JSON.stringify(result)}`);
  assert.equal(result.cardWithinViewport, true, `${label} tooltip should fit the visual viewport: ${JSON.stringify(result)}`);
  assert.equal(result.cardWithinScene, true, `${label} tooltip should fit the fixed scene: ${JSON.stringify(result)}`);
  assert.ok(result.containerZIndex >= 100, `${label} should promote the active slot above its neighbors: ${JSON.stringify(result)}`);
  assert.equal(result.neighborOverlap, true, `${label} tooltip should overlap a neighboring curio: ${JSON.stringify(result)}`);
  assert.equal(result.tooltipIsTopmostAtOverlap, true, `${label} tooltip should paint above a neighboring curio: ${JSON.stringify(result)}`);
}

async function addCounterCurioFixture(client: DevToolsClient) {
  await client.evaluate(`
    (() => {
      if (document.querySelector('.counter-curio-item')) return;
      const counter = document.querySelector('.restaurant-counter');
      if (!counter) throw new Error('Missing restaurant counter for counter-curio path');
      const cluster = document.createElement('div');
      cluster.className = 'counter-curio-cluster browser-check-counter-curio';
      cluster.innerHTML = [
        '<button type="button" class="curio-hotspot counter-curio-item" aria-label="Counter curio one">',
        '<span class="curio-art-box"><span aria-hidden="true"></span></span>',
        '<span class="curio-info-card" role="tooltip"><strong>Counter curio one</strong><span class="curio-info-description">A counter keepsake.</span></span>',
        '</button>',
        '<button type="button" class="curio-hotspot counter-curio-item" aria-label="Counter curio two">',
        '<span class="curio-art-box"><span aria-hidden="true"></span></span>',
        '<span class="curio-info-card" role="tooltip"><strong>Counter curio two</strong><span class="curio-info-description">Another counter keepsake.</span></span>',
        '</button>',
      ].join('');
      counter.append(cluster);
    })()
  `);
}

async function identifyRightmostShelfCurio(client: DevToolsClient) {
  return client.evaluate<string>(`
    (() => {
      const curios = [...document.querySelectorAll('.restaurant-curio-shelf-stage .displayed-curio')];
      const sceneRect = document.querySelector('.scene-shell')?.getBoundingClientRect();
      if (!sceneRect) throw new Error('Missing fixed scene');
      const visible = curios.filter((curio) => {
        const rect = curio.getBoundingClientRect();
        return rect.right > sceneRect.left
          && rect.left < sceneRect.right
          && rect.bottom > sceneRect.top
          && rect.top < sceneRect.bottom;
      });
      if (!visible.length) {
        const scrollport = document.querySelector('.bento-app');
        const stageRect = document.querySelector('.restaurant-curio-shelf-stage')?.getBoundingClientRect();
        throw new Error('No shelf curios intersect the visible app viewport: ' + JSON.stringify({
          innerWidth: window.innerWidth,
          visualViewport: viewport ? { width: viewport.width, offsetLeft: viewport.offsetLeft } : null,
          appViewport: appRect ? { left: appRect.left, right: appRect.right } : null,
          scrollport: scrollport instanceof HTMLElement
            ? { clientWidth: scrollport.clientWidth, scrollWidth: scrollport.scrollWidth, scrollLeft: scrollport.scrollLeft }
            : null,
          stage: stageRect ? { left: stageRect.left, right: stageRect.right } : null,
          curioBounds: curios.slice(0, 3).map((curio) => {
            const rect = curio.getBoundingClientRect();
            return { left: rect.left, right: rect.right };
          }),
        }));
      }
      const rightmost = visible.reduce((current, candidate) => (
        Math.min(candidate.getBoundingClientRect().right, sceneRect.right)
          > Math.min(current.getBoundingClientRect().right, sceneRect.right)
          ? candidate
          : current
      ));
      rightmost.id = 'browser-check-rightmost-shelf-curio';
      return '#browser-check-rightmost-shelf-curio';
    })()
  `);
}

async function scrollBentoViewportToRight(client: DevToolsClient, selector: string) {
  await client.evaluate(`
    (() => {
      const scrollport = document.querySelector('.bento-app');
      if (!(scrollport instanceof HTMLElement)) throw new Error('Missing app viewport');
      const curio = document.querySelector(${JSON.stringify(selector)});
      if (!(curio instanceof HTMLElement)) throw new Error('Missing right-edge shelf curio');
      const appRect = scrollport.getBoundingClientRect();
      const curioRect = curio.getBoundingClientRect();
      const desiredScrollLeft = curioRect.right - appRect.left
        + scrollport.scrollLeft - scrollport.clientWidth + 2;
      scrollport.scrollLeft = Math.max(
        0,
        Math.min(scrollport.scrollWidth - scrollport.clientWidth, desiredScrollLeft),
      );
    })()
  `);
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function captureRightmostCurioScreenshot(client: DevToolsClient, width: number, suffix = '') {
  const response = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const data = response.result?.data;
  if (typeof data !== 'string') throw new Error('Chromium did not return a tooltip screenshot');
  const filePath = join(tmpdir(), `mystery-bento-curio-right-${width}${suffix}.png`);
  writeFileSync(filePath, Buffer.from(data, 'base64'));
  console.log(`Captured hovered rightmost curio at ${width}px: ${filePath}`);
}

async function runCurioBrowserCheck() {
  if (!browserBinary) {
    console.log('Skipping curio browser interaction checks: no Chromium/Chrome binary found.');
    return;
  }
  const packageRunner = process.env.PACKAGE_RUNNER
    ?? (existsSync('/repl/tools/bin/pnpm') ? 'pnpm' : (process.platform === 'win32' ? 'npm.cmd' : 'npm'));
  let serverExited = false;
  const serverProcess = spawn(packageRunner, ['run', 'dev'], {
    cwd: packageDirectory,
    env: { ...process.env, PORT: String(appPort), BASE_PATH: '/' },
    stdio: 'ignore',
  });
  serverProcess.on('exit', () => {
    serverExited = true;
  });
  let browser: BrowserProcess | undefined;
  try {
    try {
      await waitForHttp(appUrl, 10_000, () => serverExited);
    } catch (error) {
      console.log(`Skipping curio browser interaction checks: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    browser = await openBrowser();
    const { client } = browser;
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 640, height: 800 },
      { width: 360, height: 800 },
    ]) {
      await navigate(client, viewport.width, viewport.height);
      assertCurioInteraction(
        await inspectCurio(client, '.displayed-curio:not(.displayed-curio-hanging-tools)'),
        `${viewport.width}px upward shelf curio`,
      );
      const rightmostShelfCurio = await identifyRightmostShelfCurio(client);
      await scrollBentoViewportToRight(client, rightmostShelfCurio);
      const rightmostResult = await inspectCurio(client, rightmostShelfCurio, 'nearest', false);
      assertCurioInteraction(
        rightmostResult,
        `${viewport.width}px right-edge shelf curio`,
      );
      if (process.env.CURIO_CAPTURE_SCREENSHOTS === '1') {
        console.log(`Rightmost popup bounds at ${viewport.width}px: ${JSON.stringify(rightmostResult)}`);
        await captureRightmostCurioScreenshot(client, viewport.width);
      }
      assertCurioInteraction(
        await inspectCurio(client, '.displayed-curio-hanging-tools'),
        `${viewport.width}px downward shelf curio`,
      );
      await addCounterCurioFixture(client);
      assertCounterCurioInteraction(
        await inspectCurio(client, '.browser-check-counter-curio .counter-curio-item:last-child'),
        `${viewport.width}px counter curio`,
      );
    }

    await navigate(client, 360, 803, true, 3);
    const mobileRightmostCurio = await identifyRightmostShelfCurio(client);
    await scrollBentoViewportToRight(client, mobileRightmostCurio);
    const mobileRightmostResult = await inspectCurio(client, mobileRightmostCurio, 'nearest', false, 'touch');
    assertMobileCurioInteraction(mobileRightmostResult, '360px phone right-edge shelf curio');
    if (process.env.CURIO_CAPTURE_SCREENSHOTS === '1') {
      console.log(`Phone-sized popup bounds at mobile 360px: ${JSON.stringify(mobileRightmostResult)}`);
      await captureRightmostCurioScreenshot(client, 360, '-mobile');
    }
  } finally {
    browser?.client.close();
    browser?.process.kill();
    serverProcess.kill();
    if (browser) {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
          rmSync(browser.profileDirectory, { recursive: true, force: true });
          break;
        } catch (error) {
          if (attempt === 9) throw error;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }
  }
}

console.log('Curio debug tests passed for query-key gating, legacy initialization, and bounded showcase selection.');
await runCurioBrowserCheck();
console.log('Curio browser check passed for focused/hovered upward and downward shelf tooltips at desktop and narrow widths, including the counter-curio path.');