# Mystery Bento Meter & Persona Contest

## 1. Product goal

Build a small, playful web experience where ordinary item selections gradually charge an in-world **Mystery Bento Meter**. At 100%, the meter launches a short, fully automated **Persona Contest** in a miniature food-stall scene. The experience rewards exploration with cosmetic collectibles and a persistent contest ledger, without introducing gambling, skill-test, or monetization mechanics.

The primary success criterion is that the interaction feels like a delightful surprise: the meter is understandable and visible, while the early-start gesture remains discoverable only through experimentation or the documented README.

## 2. Scope

### In scope

- Prominent pixel-art Mystery Bento Meter rendered as an in-world object.
- Meter progress driven by successful item selections.
- Controlled randomized progress increments of 7–16%.
- In-world progress feedback and a 100% launch threshold.
- Local persistence for meter progress, contest history, and collectibles.
- Hidden 1.5-second pointer, touch, and keyboard hold gesture.
- Four to six original persistent persona contestants.
- Random selection of three or four contestants per contest.
- Five-to-ten-second automated contest sequence.
- Weighted, trait-driven, controlled-random outcomes.
- Winner, recap, collectible award, and ledger entry.
- Kitchen Curio Shelf and Contest Ledger overlay.
- Skip Scene behavior.
- `aria-live` event updates.
- `prefers-reduced-motion` result sequence.
- README documentation for the hidden gesture and accessibility behavior.

### Out of scope

- User-controlled timing, racing, betting, wagering, odds, currencies, prizes, or prize claims.
- Accounts, server-side storage, multiplayer, leaderboards, or external integrations.
- Real restaurant mascots, licensed characters, or recognizable game designs.
- A requirement to use AI-generated art; CSS/SVG/canvas pixel art is sufficient for the first version.

## 3. Recommended implementation shape

Use a client-side web app with:

- A component-based UI.
- A single persisted application state object in `localStorage`.
- Deterministic contest simulation driven by a seeded pseudo-random generator.
- CSS animations for the normal-motion contest.
- A staged result/event-log path for reduced motion.
- Inline SVG or CSS pixel art for original personas and scene elements.

Keep game rules independent from rendering. This allows the same contest result to drive:

1. Animated race visuals.
2. Reduced-motion staged results.
3. The final winner and collectible.
4. The accessible live-region announcements.
5. The contest ledger record.

## 4. Suggested screen structure

### Main conveyor scene

- Food-stall or kitchen counter background.
- Existing item-selection/conveyor interaction, if present; otherwise provide a small set of selectable bento items as the demo input.
- Mystery Bento Meter placed prominently in the scene, not in a generic dashboard panel.
- Meter contents:
  - Pixel-art cooker, glowing bento box, or enchanted lantern.
  - Percentage or segmented visual fill.
  - Accessible label such as `Mystery Bento Meter: 42 percent full`.
  - Brief in-world acknowledgment after successful selection.
- Small, unobtrusive **Kitchen Curio Shelf** button in a corner.
- No visible copy that describes the long-press shortcut.

### Contest scene

- Title card.
- Miniature food-stall/kitchen background.
- Three or four selected personas with distinct silhouettes.
- Simple lane or challenge track.
- Event callouts and progress indicators.
- Visible **Skip scene** button.
- Final winner card and collectible reveal.

### Curio overlay

Use tabs or clearly separated sections:

- **Curio Shelf:** collected cosmetic items, with empty-state copy.
- **Contest Ledger:** recent contests showing contest name, contestants, winner, and memorable event line.

The overlay should be dismissible with a close button and Escape. It must not interrupt an active contest unless the product explicitly chooses to allow that behavior; the safer default is to disable or defer the corner button during a contest.

## 5. State model

```ts
type MeterState = {
  progress: number; // integer from 0 to 100
  lastAcknowledgement?: string;
};

type PersonaId =
  | "miso"
  | "captain-toro"
  | "puck"
  | "luma"
  | "nori"
  | "radish-rin";

type Persona = {
  id: PersonaId;
  name: string;
  flavorText: string;
  traits: {
    speed: number;
    balance: number;
    focus: number;
    luck: number;
    chaos: number;
  };
  silhouetteKey: string;
  idleAnimationKey: string;
};

type Collectible = {
  id: string;
  kind: "recipe-fragment" | "lantern-charm" | "chef-sticker" | "plate-pattern" | "victory-snapshot";
  title: string;
  description: string;
  earnedBy: PersonaId;
  earnedAt: string;
};

type ContestLedgerEntry = {
  id: string;
  contestName: string;
  contestants: PersonaId[];
  winner: PersonaId;
  memorableEvent: string;
  collectibleId: string;
  completedAt: string;
};

type AppState = {
  meter: MeterState;
  ledger: ContestLedgerEntry[];
  collectibles: Collectible[];
};
```

### Persistence rules

- Store one versioned object, for example `mystery-bento-state-v1`.
- Clamp meter progress to `0..100` when reading and writing.
- Treat malformed or missing localStorage data as a fresh state.
- Write after every successful selection and after contest completion.
- Reset progress to `0` only after the contest has reached its final-result state.
- Do not reset the meter when a hold is canceled.
- Do not create a ledger record twice if a user activates Skip Scene repeatedly or if a completion callback fires more than once.

## 6. Meter behavior

### Normal selection flow

1. User successfully selects an item.
2. Generate an integer increment from 7 through 16 using the app RNG.
3. Set `nextProgress = min(100, currentProgress + increment)`.
4. Persist the new meter state.
5. Show one short in-world message, such as:
   - `+12 sparkle points`
   - `The bento hums warmly…`
   - `A tiny lantern flickers awake!`
6. If `nextProgress === 100`, wait for the meter fill transition to finish, then launch the contest exactly once.

Selections made while the contest is running must not add progress. Disable the underlying selection controls or ignore them at the domain/state layer.

### Feedback requirements

- Feedback should be brief and non-blocking.
- It should not depend on color alone.
- Keep the progress text readable at all times.
- Avoid showing the hidden shortcut in tooltips, helper text, onboarding, or button labels.

## 7. Secret early-start gesture

The meter is a focusable interactive element with:

- A semantic button or equivalent keyboard-operable control.
- An accessible name: `Mystery Bento Meter`.
- A visible focus indicator.
- Pointer/mouse hold support.
- Touch hold support.
- Enter and Space hold support while focused.

### Gesture algorithm

```text
onHoldStart:
  if contest is active: ignore
  capture current meter progress
  begin 1500ms timer
  add subtle "charging" visual state
  prevent browser context menu during the active hold
  prevent text selection during the active hold

onHoldProgress:
  strengthen glow/steam/shake only; do not expose instructional text

onHoldCancel:
  clear timer
  restore captured progress exactly
  remove charging visual state
  make no error announcement

onHoldComplete:
  clear timer
  set meter to 100
  persist meter
  launch contest
```

### Input edge cases

- Cancel on pointerup, pointercancel, pointerleave, touchend, touchcancel, blur, or window visibility change.
- Handle Space so the page does not scroll during the hold.
- Handle Enter without triggering an unrelated form submission.
- Prevent `contextmenu` only while the hold is active and only on the meter.
- Do not alter progress during an incomplete hold.
- Ignore additional starts while a hold or contest is already active.
- Ensure a completed pointer gesture does not also trigger a second keyboard/click action.

## 8. Persona cast

Create six original contestants so repeated contests have enough variety:

| Persona | Personality | Visual direction | Strong traits | Weak trait |
|---|---|---|---|---|
| Miso | Meticulous tea spirit who follows every rule | Tall teacup silhouette, tidy steam curls | Focus, balance | Chaos |
| Captain Toro | Dramatic retired tuna captain | Broad coat, tiny captain hat, fin-like sleeves | Luck, confidence flavor | Speed |
| Puck | Cheerful rice-ball courier who trips over enthusiasm | Round rice-ball body, oversized satchel | Speed, luck | Balance |
| Luma | Sleepy cat-food critic | Low cat silhouette, half-lidded eyes, tasting spoon | Focus | Speed |
| Nori | Tiny mushroom chef with an oversized ladle | Small cap, huge ladle, bouncing stem | Balance, chaos | Speed |
| Radish Rin | Hyperactive radish mascot | Leafy top, springy feet, zig-zag pose | Speed, chaos | Focus |

Each persona needs:

- A distinct silhouette readable at small size.
- A two- or three-frame idle animation.
- One short flavor line.
- Persistent stable traits.
- At least two event lines tied to their personality.

All art and names should be original and implemented as simple pixel art, SVG, CSS shapes, or project-owned assets.

## 9. Contest simulation

### Contest lifecycle

1. Select a contest title from a fixed original list.
2. Select three or four unique personas from the six-person cast.
3. Create a contest session ID and seed.
4. Derive each contestant’s starting performance from persistent traits.
5. Run a short sequence of challenge beats.
6. Emit one or two readable event lines.
7. Resolve the winner.
8. Show winner and recap.
9. Award an available collectible.
10. Add one ledger entry.
11. Reset meter to 0%.
12. Return to the conveyor scene.

### Challenge titles

- Bento Dash
- Lantern Ladle League
- The Midnight Maki Match
- Wobble Plate Relay
- Tea Tray Twilight Trial

### Challenge beats

Use three to five beats so the total scene lasts approximately five to ten seconds:

- Start line scramble.
- Mid-course obstacle.
- Personality event.
- Final stretch.
- Finish and winner reveal.

### Weighted performance

For each beat, calculate a score such as:

```text
score =
  0.30 * speed +
  0.25 * balance +
  0.20 * focus +
  0.15 * luck +
  0.10 * controlledRandom
  - chaosPenaltyForCurrentObstacle
```

The exact weights may vary by challenge. Normalize traits to a common range, for example `0..100`.

Important behavior:

- Use a seeded RNG per contest so event text, movement, and winner agree.
- Add bounded noise so the same persona is not guaranteed to win.
- Give persistent traits enough weight that personalities emerge over repeated contests.
- Resolve ties with a second seeded tie-break rather than arbitrary array order.
- Keep all outcomes friendly; no persona is humiliated or punished.

### Event examples

- `Miso takes a perfect turn!`
- `Captain Toro pauses for a dramatic bow.`
- `Puck trips over enthusiasm, then sprints ahead.`
- `Luma pauses to judge the plating.`
- `Nori's oversized ladle saves the wobbling stack!`
- `Radish Rin zooms into a harmless pile of cushions.`

## 10. Collectible system

Prepare a collectible pool larger than the number of early contests, with at least one item associated with each persona. Example items:

- Recipe-card fragment: `The Unfinished Midnight Sauce`
- Tiny lantern charm: `Warm-Glow Wisp`
- Chef sticker: `Ladle Champion`
- Ceramic plate pattern: `Moonlit Checker`
- Framed victory snapshot: `The Great Wobble`

Award rules:

- The winner earns one cosmetic collectible.
- Prefer an unowned collectible when alternatives remain.
- If all collectibles for that winner are owned, select a duplicate only as a fallback.
- Duplicates must be labeled clearly and must not affect gameplay.
- Collectibles have no monetary or real-world value.

## 11. Accessibility and motion

### Live updates

Create a visually unobtrusive `aria-live="polite"` region. Announce:

- Contest launch and selected contestants.
- Important contest events.
- Winner and collectible.
- Meter completion.

Do not flood the live region with every animation frame or percentage tick. Announcements should be concise and understandable without visuals.

### Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Do not run the moving race animation.
- Show the title card briefly.
- Present the contestants as a readable staged sequence or event log.
- Reveal the same simulated events, winner, recap, collectible, ledger update, and meter reset.
- Keep the Skip Scene button available.

### Other requirements

- Keyboard navigation must reach the meter, Curio Shelf button, close controls, and Skip Scene.
- Focus must be visibly indicated.
- Text must meet practical contrast requirements against the pixel-art scene.
- Do not use animation as the only way to communicate state.
- Respect Escape to close the Curio overlay.
- Ensure the contest is understandable from text updates alone.

## 12. Skip Scene behavior

Once a contest starts, show a visible `Skip scene` button.

On activation:

1. Stop or bypass active visual timers and animation loops.
2. Resolve the already-created contest session; do not reroll contestants or the winner.
3. Reveal the final winner, recap, and collectible.
4. Perform the ledger write once.
5. Reset and persist the meter at 0%.
6. Announce the final result through the live region.
7. Return to the conveyor after the result state has been acknowledged.

The skip control must be keyboard accessible and should be disabled after finalization to prevent duplicate completion.

## 13. Build phases

### Phase 1 — Foundation

- Set up app shell and scene layout.
- Add versioned localStorage state helpers.
- Define persona, collectible, contest, and ledger types.
- Add a small deterministic RNG utility.
- Add the meter and item-selection domain events.

**Exit condition:** A selection updates and persists the meter; reload restores it.

### Phase 2 — Meter and hidden gesture

- Build pixel-art meter presentation.
- Add progress feedback.
- Add pointer, touch, and keyboard long-press handling.
- Add cancellation cleanup and context-menu/text-selection prevention.
- Add focus and accessible naming.

**Exit condition:** Normal selection increments correctly; incomplete holds leave state unchanged; completed holds launch a contest.

### Phase 3 — Contest engine

- Define the six-persona cast and trait profiles.
- Implement contestant selection.
- Implement seeded scoring and tie-breaking.
- Implement challenge/event generation.
- Implement collectible selection.

**Exit condition:** The same session seed produces consistent contestants, events, winner, and collectible across render paths.

### Phase 4 — Contest presentation

- Build title card and miniature scene.
- Add idle animations and challenge beats.
- Add winner reveal and recap.
- Add Skip Scene.
- Add reduced-motion presentation.
- Add live-region announcements.

**Exit condition:** A contest can run without input, can be skipped, and always completes exactly once.

### Phase 5 — Shelf, ledger, and polish

- Build Curio Shelf and Contest Ledger overlay.
- Add empty states and duplicate handling.
- Tune animation timing and feedback copy.
- Add responsive layout and touch sizing.
- Document the long-press behavior in README.

**Exit condition:** A returning user can inspect history and collectibles after reload, with no loss of state.

## 14. Acceptance checklist

### Meter

- [ ] A prominent in-world pixel-art Mystery Bento Meter is visible in the main scene.
- [ ] Each successful item selection adds a controlled integer increment from 7–16%.
- [ ] Meter progress never exceeds 100%.
- [ ] Each successful selection produces brief in-world acknowledgment.
- [ ] Reaching 100% through normal selection launches the Persona Contest automatically.
- [ ] Meter progress survives page reload.
- [ ] Contest completion resets and persists the meter at 0%.
- [ ] Item controls cannot add meter progress during an active contest.

### Hidden gesture

- [ ] The meter is keyboard focusable.
- [ ] The meter has a useful accessible name.
- [ ] Holding pointer/mouse input for 1.5 seconds fills the meter and launches the contest.
- [ ] Holding touch input for 1.5 seconds fills the meter and launches the contest.
- [ ] Holding Enter for 1.5 seconds while the meter is focused works.
- [ ] Holding Space for 1.5 seconds while the meter is focused works.
- [ ] Releasing before 1.5 seconds restores the exact prior progress.
- [ ] An incomplete hold creates no visible error state.
- [ ] Hold feedback is subtle and in-world only.
- [ ] Normal UI does not reveal the gesture.
- [ ] Text selection and context-menu behavior are prevented only as needed during the hold.
- [ ] Blur, pointer cancellation, touch cancellation, and visibility changes clean up the hold.
- [ ] README documents the long-press behavior.

### Personas and contest

- [ ] The cast contains four to six original personas; target six.
- [ ] Each persona has a distinct name, silhouette, personality, idle animation, flavor text, and persistent traits.
- [ ] Each contest selects three or four unique personas.
- [ ] A title card appears before the challenge.
- [ ] The contest runs automatically for approximately five to ten seconds.
- [ ] No click, tap, timing, or decision is required once the contest begins.
- [ ] Contest outcomes use weighted traits and controlled randomness.
- [ ] Repeated contests show varied outcomes while preserving personality differences.
- [ ] Events are readable and playful.
- [ ] A clear winner and short recap appear at the end.
- [ ] No betting, wagering, odds, currencies, prizes, prize claims, slot reels, or gachapon language appears anywhere.

### Collectibles and ledger

- [ ] The winner earns one fictional cosmetic collectible.
- [ ] Collectibles have no monetary or real-world value.
- [ ] The system avoids duplicates while unowned alternatives remain.
- [ ] Collectibles persist through reload.
- [ ] Contest history and winners persist through reload.
- [ ] An unobtrusive corner button opens the Kitchen Curio Shelf and Contest Ledger.
- [ ] The ledger includes recent contest name, contestants, winner, and memorable event line.
- [ ] The overlay has usable empty states.
- [ ] Repeated Skip Scene activation cannot duplicate awards or ledger entries.

### Accessibility and motion

- [ ] An `aria-live` region announces selected contestants, key events, winner, collectible, and meter completion.
- [ ] Live updates are concise and are not emitted every animation frame.
- [ ] `prefers-reduced-motion: reduce` replaces the race animation with a staged result or readable event log.
- [ ] Reduced-motion mode produces the same final result as normal mode for the same contest session.
- [ ] Skip Scene is visible after contest start.
- [ ] Skip Scene reveals the same final result, updates the ledger, awards the collectible, resets the meter, and returns to the conveyor.
- [ ] All controls are keyboard reachable and visibly focusable.
- [ ] Escape closes the Curio overlay.
- [ ] Important state is never communicated by color or animation alone.

### Robustness

- [ ] Missing, malformed, or old localStorage data falls back safely.
- [ ] Progress is clamped to a valid range on load.
- [ ] Refreshing during the conveyor does not lose progress.
- [ ] Duplicate completion callbacks cannot award twice.
- [ ] A contest cannot be launched twice from one meter completion.
- [ ] Layout remains usable on narrow touch screens and desktop.
- [ ] No browser console errors occur during normal selection, gesture cancellation, contest completion, or skip.

## 15. Verification scenarios

1. Start at 0%, make one selection, reload, and confirm the persisted increment.
2. Continue selecting until an increment crosses 100%; confirm clamping and exactly one contest launch.
3. Start a 1.5-second pointer hold; confirm launch.
4. Release a pointer hold at 1.49 seconds; confirm exact progress restoration.
5. Repeat the same cancellation with touch, Enter, and Space.
6. Open the browser context menu during a hold attempt; confirm it does not appear on the meter.
7. Start a contest, press Skip Scene repeatedly, and confirm one winner, one collectible, and one ledger entry.
8. Reload after several contests; confirm the ledger and shelf remain populated.
9. Exhaust available collectibles for a winner; confirm the fallback duplicate behavior.
10. Enable reduced motion and run a contest; confirm no race animation but identical result data and completion side effects.
11. Navigate the full experience with keyboard only.
12. Inspect the live region with a screen reader or accessibility inspector.
13. Resize to a narrow viewport and test touch targets and overlay usability.

## 16. Definition of done

The feature is ready when every acceptance checklist item passes, the twelve verification scenarios have been exercised, the README documents the hidden gesture, and a fresh browser profile plus a returning localStorage profile both produce a coherent experience.