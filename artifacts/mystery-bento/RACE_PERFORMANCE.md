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