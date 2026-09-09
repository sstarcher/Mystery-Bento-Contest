# Tablet race performance check

## What changed

The race used to keep its animation clock in `ContestOverlay`. Every animation
frame updated React state, which reconciled the announcement/report controls,
panorama artwork, obstacles, and every runner together. Runner movement also
used `left`, and sprite cadence effects were recreated whenever the live speed
changed.

The current path keeps the authored timeline and simulation data unchanged:

- `RaceLiveRenderer` owns the animation frame and writes only the panorama
  `transform` and runner transforms directly to their existing DOM nodes.
- React reconciles the live layer only for discrete stage, obstacle-contact,
  fall, victory, finish, and reduced-motion changes.
- Runner positions use transform-only updates, while the fixed course viewport
  and moving layers use bounded containment.
- `MovementSprite` keeps one self-scheduling cadence timer per action/sheet and
  reads the latest speed from a ref on each frame.
- Narrow tablet layouts skip the full-screen backdrop blur while retaining the
  same opaque stage color and contrast.
- While the contest owns the screen, the restaurant scene stays mounted for an
  immediate resume but pauses its conveyor, chef video/sprite cadence, curio
  shimmer, meter hold effect, and selection splash. The race backdrop also
  avoids backdrop filtering because the fixed stage is already opaque.
- Race image preparation now shares one URL cache and uses a priority queue:
  contestant portraits, idle sheets, first-movement sheets, and the first
  course panels start first; fall/victory sheets, later panels, and obstacles
  yield through bounded idle-time work. Audio metadata uses the same bounded
  pattern.
- Intro idle sheets advance by imperative background-position writes on their
  existing frame nodes. React still owns discrete action changes, reactions,
  finish poses, debug attributes, and all post-start transforms.
- The starting-lantern handoff keeps its popup visible through the authored
  race-start call, leads it out by 360 ms, and starts the race clock on the
  announcement completion boundary with no extra post-call pause.

## Before/after capture matrix

Use the browser Performance panel with a 1280 × 800 viewport and a narrow
1024 × 768 viewport. Record the same 15-second window for each row, using the
same contest seed/session where possible:

| Path | Before hotspot | After check |
| --- | --- | --- |
| Normal announcement | Overlay reconciliation while cards and audio update | Cards/audio remain responsive; no race RAF runs before handoff |
| Normal movement | Whole overlay reconciled on every RAF; runner `left` updates | Only transforms change per RAF; report updates only at discrete contacts |
| Obstacle reactions | Speed changes restarted sprite intervals | Fall/action handoff changes React state once; cadence timer remains alive |
| Finish crossing/winner | Final movement and report shared the clock rerender | Finish transforms continue until the same crossing deadline, then victory/reveal remain responsive |
| Reduced motion | Snapshot still shared the clock owner | No RAF loop; authored stage snapshots and final winner state remain deterministic |
| Narrow tablet crop | Full-screen blur competed with the fixed canvas | Blur is removed below 1100px; the fixed 1280px canvas still crops identically |
| Skip scene / voice | Controls competed with per-frame overlay work | Skip and voice handlers stay in the static overlay and do not wait on movement reconciliation |
| Race-start handoff | Popup and movement waited through an extra announcer gap | Popup leads out shortly before the call ends; intro, clock, panorama, and runners share the exact completion boundary |

The managed-Chromium check also emits an `introPerformance` object in its JSON
result. It separates `overlayOpen`, `contestantCardReveal`, `startingLantern`,
and `firstMovingFrame`, and includes frame count/median/p95 interval, dropped
frame percentage, long-task count and duration, event timing, and resource
transfer/decode-body activity. Run it against the managed workflow port:

```sh
PORT=<managed-workflow-port> \
RACE_BROWSER_URL=http://127.0.0.1:<managed-workflow-port>/?raceCheck=109 \
pnpm --filter @workspace/mystery-bento run verify:race-browser
```

For a before/after comparison, save one JSON result from the previous build and
one from the optimized build using the same browser profile and seed. Compare
the four phase timestamps relative to `overlayOpen`, the intro frame cadence,
long-task totals, and the image resource list. The first movement sheets should
appear before the deferred fall/victory and course-obstacle resources, while a
repeat contest should reuse the same cached URLs.

The code-level before/after indicators are:

- React animation-clock writes: `setRaceClockMs` on every RAF → none.
- Runner layout writes: `left` on every RAF → `translate3d` on existing nodes.
- Sprite timer dependency: `speedMultiplier` → latest `speedMultiplierRef`.
- Normal-motion frame loop: one loop for DOM transforms only; reduced motion:
  no frame loop.

## Regression commands

Run from the workspace root:

```sh
pnpm --filter @workspace/mystery-bento run typecheck
pnpm --filter @workspace/mystery-bento run verify:race
pnpm --filter @workspace/mystery-bento run verify:sprites
pnpm --filter @workspace/mystery-bento run verify:assets
pnpm --filter @workspace/mystery-bento run build
```

The deterministic race tests cover unchanged movement, obstacle contact,
finish crossing, reduced-motion snapshots, and winner resolution. The
sprite-sheet audit additionally checks transform-only live rendering and that
cadence responds to speed without using a repeating timer.
The race timeline assertions also lock the starting-lantern lead-out and the
zero-extra-delay movement boundary. The managed-Chromium race check observes
the popup while the call is active, its lead-out while the intro remains
stationary, and the first moving frame after the race class appears.

## Second-wave tablet profile

Use this repeatable profile for before/after captures. It is intentionally
separate from the authored race plan: throttling changes the browser budget,
never the contest seed, timestamps, obstacle outcomes, or finish ordering.

| Setting | Low-end tablet profile | Target tablet |
| --- | --- | --- |
| Viewport | 1024 × 768, fixed 1280px canvas cropped | native portrait/landscape viewport |
| CPU | 4× slowdown | device default |
| Network | Fast 3G, cache disabled for the first run; cache enabled for repeat | device default |
| Memory signals | `deviceMemory: 2`, `hardwareConcurrency: 4`, touch enabled | record reported values |
| Motion/audio | normal motion, then reduced motion; muted and blocked-audio runs | repeat both |
| Seed | `raceCheck=109` | same deterministic seed where possible |

Record one JSON row per run for announcement, active motion, each obstacle
reaction, finish crossing, and winner reveal:

- frame count, median/p95 frame interval, and dropped-frame percentage;
- long-task count and total duration;
- `Performance` style/layout/paint/composite timing where the browser exposes it;
- image/audio resource count, transfer size, decode duration, and failed source
  count;
- time from a Skip, voice, or finish-control event to its visible DOM state.

The implementation's expected comparison is explicit: normal devices keep a
16ms transform sample budget, constrained devices use a steady 32ms sample
budget, both preserve the same simulation timestamps, and only
`raceDebug=1` or the deterministic `raceCheck=109` run writes per-frame
diagnostic attributes. The shared resource cache should show one image/audio
setup per source across repeated contests, with no restaurant, shelf, or
unselected contestant sources in the race request list.

For a browser capture, use the managed Chromium binary used by
`verify:race-browser`, enable the Performance panel, and save the trace with
the profile settings above. Run the normal and reduced-motion paths before
comparing cached repeat-contest runs; a first-load decode burst is not a fair
comparison for the shared-cache path.