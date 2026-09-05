# Mystery Bento

Mystery Bento is an after-hours pixel-art sushi club. Choose a morsel from the
conveyor to charge the in-world Mystery Bento Meter, then watch a deterministic,
spectator-only Persona Contest award a cosmetic kitchen curio.

This README is the canonical guide for the `artifacts/mystery-bento` web
artifact. The project is frontend-only: it does not require the API server,
PostgreSQL, an account, or a secret to run.

## Run and build

Run these commands from the workspace root:

```bash
# Development preview on the managed artifact workflow
pnpm --filter @workspace/mystery-bento run dev

# Production build (the managed workflow supplies these automatically)
PORT=24283 BASE_PATH=/ pnpm --filter @workspace/mystery-bento run build

# Optional static preview of the production build
PORT=24283 BASE_PATH=/ pnpm --filter @workspace/mystery-bento run serve
```

The managed web service uses port `24283`, serves the artifact at `/`, and
builds to `artifacts/mystery-bento/dist/public`. The Vite app uses
`import.meta.env.BASE_URL` for asset URLs so the same build works in the
artifact preview and in production.

## Player experience

1. Select one of four illustrated morsels. Each selection charges the meter by
   a randomized 7–16% and adds a small in-world acknowledgement.
2. Fill the meter to unlock the Persona Contest.
3. Listen to the contestant introductions and watch the five-act contest:
   arrival, warm-up, main course, final stretch, and winner recap.
4. Open **Curios** to see the cosmetic collection or **Ledger** to review
   recent winners.
5. Use **Skip Scene** to reveal the already-resolved outcome without replaying
   the animation.

The contest is resolved once per launch with seeded deterministic data. The
animated, skipped, muted, unavailable-audio, and reduced-motion paths reuse the
same winner, race events, collectible, and ledger entry.

## Hidden meter gesture

The long-press interaction is intentionally not advertised in the visual UI.
The meter is still keyboard-accessible:

- Pointer or mouse press-and-hold for 1.5 seconds.
- Touch press-and-hold for 1.5 seconds.
- Hold **Enter** or **Space** for 1.5 seconds while the meter has focus.

Completing the hold fills the meter and starts the contest. Releasing early
cancels without changing progress. Reduced-motion mode keeps the same result and
side effects while replacing moving scenes with readable staged updates.

## Persistence and reset

The app stores these personal, browser-local values in `localStorage`:

- Meter progress and its latest acknowledgement.
- Contest ledger entries.
- Earned curios.
- Announcer voice preference.

There are no accounts or shared state. Use **Clear local memory** in the Curio
Shelf or Contest Ledger to reset this browser's saved progress.

## Visual layout and responsive contract

- The restaurant scene and race scene are separate fixed `1280 × 800` pixel-art
  canvases.
- Narrow screens crop the canvas horizontally rather than shrinking the artwork
  until it becomes unreadable.
- Contestants use portraits for the restaurant, cooking art for
  the counter, 12 movement sprite sets for the race, and cooking sprite sheets
  for the winner reveal. Course obstacles appear once per obstacle position
  rather than once in every contestant lane.
- Uma Udon is the enlarged and right-shifted fallback for the restaurant chef
  presentation.
- Curio art is rendered through one square art-box contract with a shared
  `0.774` fit buffer (a 10% reduction from the previous shared scale).
  Artwork proportions are preserved; there are no legacy
  CSS-glyph curios.

## Contestants

The roster contains 12 kitchen personas. Every persona has a portrait, cooking
reveal, and six movement actions: idle, walk, run, jump, fall, and victory.

| Persona | Contest edge | Movement | Cooking reveal | Curio set |
| --- | --- | --- | --- | --- |
| Pip Porridge | Speed | Yes | Public sprite sheet | 3 |
| Lady Sencha | Focus | Yes | Public sprite sheet | 3 |
| Captain Toro | Balance | Yes | Public sprite sheet | 3 |
| Nori Nib | Patience | Yes | Public sprite sheet | 3 |
| Tilda Tofu | Repair | Yes | Public sprite sheet | 3 |
| Rollo Radish | Shortcut luck | Yes | Public sprite sheet | 3 |
| Miso Mallow | Calm | Yes | Public sprite sheet | 3 |
| Uma Udon | Strength | Yes | Public sprite sheet | 3 |
| Panko Puff | Investigation | Yes | Public sprite sheet | 3 |
| Saffy Sashimi | Precision | Yes | Public sprite sheet | 3 |
| Kiku Kettle | Invention | Yes | Public sprite sheet | 3 |
| Bibi Bento | Preparation | Yes | Public sprite sheet | 3 |

The current collection has 36 image-backed curios: three public Pip keepsakes
plus 33 imported curio derivatives. Every contestant has a complete three-item
set, including Rollo and Saffy.

## Image asset map

The image pipeline intentionally keeps source uploads, imported source assets,
and browser-delivered runtime assets separate.

| Location | Count | Purpose | Status |
| --- | ---: | --- | --- |
| `assets/source/images/` | 47 | Character, race-background, obstacle, and runner-action art uploads | Source archive |
| `assets/source/audio/` | 85 | Original announcer recordings for active runtime families | Source archive |
| `src/assets/derived/contestants/portraits/` | 12 | Opaque contestant portraits | Active imports |
| `src/assets/derived/contestants/movement/` | 72 | 12 contestants × 6 transparent movement sheets | Active imports |
| `src/assets/derived/curios/` | 33 | Three independent curio derivatives for 11 non-Pip contestants | Active imports |
| `public/runtime/images/` | 28 | Race backgrounds, obstacle art, plates, keepsakes, and restaurant art | Active browser assets |
| `public/runtime/video/cooking/` | 12 | Winner cooking sprite sheets | Active browser assets |
| `public/runtime/audio/` | 69 | 68 selected announcer clips plus one Pip listening preview | Active browser assets |
| `assets/review/unused/` | 18 | Confirmed unused audio candidates awaiting review | Not shipped |

### Runtime image families

- **12 portraits**: opaque `320 × 292` PNGs, one per contestant, in
  `src/assets/derived/contestants/portraits/`.
- **72 movement sheets**: transparent square-cell grids in
  `src/assets/derived/contestants/movement/`, with explicit rows, columns,
  occupied-frame counts, and per-persona normalization. Fall sheets are
  one-shot and freeze on their grounded final frame; victory sheets loop.
- **12 cooking sheets**: transparent public sprite sheets used for winner
  cooking reveals. The sprite audit covers all 12 cooking sheets and all 72
  movement sheets.
- **12 obstacle images**: transparent pixel-art runtime derivatives in
  `public/runtime/images/obstacles/`, including separate tea-puddle and
  moon-reflection art.
- **6 race backgrounds**: opaque WebP derivatives rendered at their source
  proportions. They render in this fixed order: village market street, tea
  stall crossing, evening market, lantern crossing, central stall, and
  moonlit pavilion destination. The original uploaded panoramas remain
  preserved in the source archive.
- **6 sushi plates** and **3 Pip keepsakes**: transparent `2048 × 2048` and
  `160 × 160` PNGs respectively, under `public/runtime/images/`.
- **Restaurant backdrop**: `public/runtime/images/restaurant/background.png`.

All browser-delivered media is now under `public/runtime/`. Imported,
build-time derivatives live under `src/assets/derived/`. Original uploads live
under `assets/source/`; and confirmed unused candidates live under
`assets/review/unused/`.

## Race track visual inspector

Open `/race-track-debug` (or use the `Track` link beside Curios and Ledger in
the restaurant header) to inspect the complete race panorama without starting
a contest. Drag left and right, use the scrollbar, or focus the track and use
the arrow keys.

### Asset review queue

The review queue is intentionally separate from active source and runtime
folders:

- 6 aggregate cooking sheets and 6 Toro frame exports that are superseded by
  the public cooking sheets.
- 12 contestant profile clips and 5 contest-title clips not selected by the
  current contest sequence.
- 1 unlabeled source recording awaiting a phrase label.

The active asset audit found no missing file among imports, public runtime URLs,
race-background mappings, or collectible assets. Do not treat workspace-level
`attached_assets/` uploads as canonical once a source or derived asset has been
copied into this artifact.

## Announcer audio

Runtime audio lives under `public/runtime/audio/announcer/` and is composed from reusable
families:

- Three race-start variants.
- One contestant-intro lead-in.
- 12 contestant names.
- 24 obstacle callouts.
- Eight result fragments, seven physical reactions, seven pace/lead-change
  clips, and five stage transitions.
- One reusable `takes-the-win` finish fragment.

The review queue contains five contest-title clips and 12 character-blurb clips
because the current `App.tsx` contest sequence does not select those families.
The active sequence uses the selected race-start clip, contestant names,
obstacle and reaction clips, pace/stage transitions, and the winner
name-plus-result fragment.

The selected race-start clip controls the actual race handoff. Muted, blocked,
missing, or delayed audio uses the deterministic timing fallback instead of
blocking the visual contest. `ANNOUNCER_PHRASES.md` is the detailed generation
and verification catalog; its unchecked items distinguish “available but not
selected” or “needs live browser verification” from missing files.

## Verification

Run the focused checks before changing or shipping assets:

```bash
pnpm --filter @workspace/mystery-bento run typecheck
pnpm --filter @workspace/mystery-bento run verify:curios
pnpm --filter @workspace/mystery-bento run verify:race
pnpm --filter @workspace/mystery-bento run verify:sprites
pnpm --filter @workspace/mystery-bento run verify:assets
pnpm --filter @workspace/mystery-bento run build
```

`verify:curios` checks all 36 image-backed variants, shared sizing, and the
absence of legacy glyph paths. `verify:sprites` checks 60 runtime sheets for
valid grids, occupied frames, transparent padding, and frame-boundary safety.
`verify:assets` scans active source imports and browser runtime URLs, checks
that referenced files exist in the canonical folders, rejects legacy asset
prefixes, flags unreferenced derived/runtime files outside the review queue,
and compares the asset-map counts above with the live folders.
