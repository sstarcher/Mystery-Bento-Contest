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

# Production build
pnpm --filter @workspace/mystery-bento run build

# Optional static preview of the production build
pnpm --filter @workspace/mystery-bento run serve
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
- Contestants use portraits for the restaurant, transparent food/cooking art for
  the counter, 12 movement sprite sets for the race, and cooking sprite sheets
  for the winner reveal.
- Uma Udon is the enlarged and right-shifted fallback for the restaurant chef
  presentation.
- Curio art is rendered through one square art-box contract with a shared
  `0.774` fit buffer (a 10% reduction from the previous shared scale).
  Artwork proportions are preserved; there are no legacy
  CSS-glyph curios.

## Contestants

The roster contains 12 kitchen personas. Every persona has a portrait, food
still, and four movement actions: idle, walk, run, and jump.

| Persona | Contest edge | Movement | Cooking reveal | Curio set |
| --- | --- | --- | --- | --- |
| Pip Porridge | Speed | Yes | Public sprite sheet | 3 |
| Lady Sencha | Focus | Yes | Public sprite sheet | 3 |
| Captain Toro | Balance | Yes | Public sprite sheet | 3 |
| Nori Nib | Patience | Yes | Public sprite sheet | 3 |
| Tilda Tofu | Repair | Yes | Public sprite sheet | 3 |
| Rollo Radish | Shortcut luck | Yes | Public sprite sheet | — |
| Miso Mallow | Calm | Yes | Public sprite sheet | 3 |
| Uma Udon | Strength | Yes | Public sprite sheet | 3 |
| Panko Puff | Investigation | Yes | Public sprite sheet | 3 |
| Saffy Sashimi | Precision | Yes | Public sprite sheet | — |
| Kiku Kettle | Invention | Yes | Public sprite sheet | 3 |
| Bibi Bento | Preparation | Yes | Public sprite sheet | 3 |

The current collection has 30 image-backed curios: three public Pip keepsakes
plus 27 files in `src/assets/curios/`. Rollo and Saffy currently have no active
curio set; Saffy's three image files are retained as unwired source material.

## Image asset map

The image pipeline intentionally keeps source uploads, imported source assets,
and browser-delivered runtime assets separate.

| Location | Count | Purpose | Status |
| --- | ---: | --- | --- |
| `assets/source-images/` | 14 | Eight original character sheets and six original race-background uploads | Source archive |
| `src/assets/contestants/` | 66 | Portraits, food stills, extracted cooking frames, and aggregate frame sheets | Imported source/derived assets |
| `src/assets/contestants/movement/` | 48 | 12 contestants × 4 transparent movement sheets | Active; all imported by `movement-sprite-config.ts` |
| `src/assets/curios/` | 30 | 10 potential three-item curio sets | 27 active; 3 Saffy files currently unwired |
| `public/` image files | 67 | Browser-delivered cooking sheets, race backgrounds, plates, keepsakes, restaurant art, Pip exports, and favicon | 29 active; 38 retained alternates/exports |
| `public/audio/` | 86 MP3s | 85 runtime announcer clips plus one Pip listening preview | Active audio library |

### Runtime image families

- **12 portraits**: opaque `320 × 292` PNGs, one per contestant.
- **12 food stills**: transparent PNG cutouts used around the restaurant.
- **48 movement sheets**: transparent square-cell grids with explicit rows,
  columns, occupied-frame counts, and per-persona normalization.
- **12 cooking sheets**: transparent public sprite sheets used for winner
  cooking reveals. The sprite audit covers all 12 cooking sheets and all 48
  movement sheets.
- **6 race backgrounds**: `1600 × 686` opaque WebP derivatives of the six
  `6048 × 2592` source panoramas. They render in this fixed order:
  lantern gate market, garden market, night alley, lantern crossing, central
  stall, and moonlit pavilion destination.
- **6 sushi plates** and **3 Pip keepsakes**: transparent `2048 × 2048` and
  `160 × 160` PNGs respectively.
- **Restaurant backdrop**: the active choice is
  `public/restaurant-background-attached.png`. The two
  `restaurant-interior*` files are alternate exports and are not referenced.

Cooking has two different source paths. Five contestants
(Pip, Sencha, Nori, Tilda, and Rollo) retain six extracted transparent frames
in `src/assets/contestants/` for the counter presentation. The runtime winner
reveal uses one public sprite sheet for each of all 12 contestants, including
Toro, Kiku, Saffy, Miso, Uma, Panko, and Bibi.

### Preserved but unwired image exports

These files are intentionally not deleted because they preserve source
provenance or may be useful for future art work:

- Six aggregate extracted cooking sheets in `src/assets/contestants/` are not
  imported by the current counter renderer.
- Toro's six extracted cooking frames and aggregate sheet are superseded by the
  public Toro cooking sprite sheet.
- Saffy's three curio PNGs are present but not in the active collectible pool.
- `public/video/pip-frames/` contains 36 individual Pip frame exports that are
  superseded by `pip-making-food-sprite-sheet.png`.
- `public/restaurant-interior-attached.png` and
  `public/restaurant-interior.webp` are unused alternate restaurant exports.

The image audit found no missing file among active imports, public runtime
URLs, race-background mappings, or collectible assets. Source character sheets
are opaque flattened archives while the cutout, movement, cooking, curio, and
plate derivatives use transparency; that difference is expected.

The workspace-level `attached_assets/` staging area contains 108 additional
uploaded image files (95 PNG and 13 WebP). Those uploads are not browser
runtime dependencies and are not treated as canonical after the corresponding
source or derived asset has been copied into this artifact.

## Announcer audio

Runtime audio lives under `public/audio/announcer/` and is composed from reusable
families:

- Three race-start variants.
- One contestant-intro lead-in.
- 12 contestant names and 12 contestant blurbs.
- Five contest titles.
- 24 obstacle callouts.
- Eight result fragments, seven physical reactions, seven pace/lead-change
  clips, and five stage transitions.
- One reusable `takes-the-win` finish fragment.

The bundled library contains five contest-title clips and 12 character-blurb
clips, but the current `App.tsx` contest sequence does not select those two
families yet. The active sequence uses the selected race-start clip, contestant
names, obstacle and reaction clips, pace/stage transitions, and the winner
name-plus-result fragment. `announcer-audio.ts` keeps the complete reusable
catalog available for a future narration pass.

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
pnpm --filter @workspace/mystery-bento run build
```

`verify:curios` checks all 30 image-backed variants, shared sizing, and the
absence of legacy glyph paths. `verify:sprites` checks 60 runtime sheets for
valid grids, occupied frames, transparent padding, and frame-boundary safety.