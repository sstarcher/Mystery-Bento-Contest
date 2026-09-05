# Mystery Bento asset library

This folder contains original uploaded source material and preserved review
material. Runtime assets are kept separately so source sheets can be revisited
without affecting the optimized files used by the app.

The complete product-facing asset map is in `../README.md`. This file documents
the source/runtime boundary and provenance details that are specific to this
folder.

## Source images

`source/images/character-sheets/` currently contains one flattened source sheet:

- `character-portraits-sheet.png` — portrait sheet for the 12 mascots

`source/images/race-backgrounds/`

- The six original high-resolution race scenes are preserved here in the
  deterministic course order: `asset_Jg8...`, `asset_HZMG...`, `asset_5ja...`,
  `asset_DLD...`, `asset_JLEx...`, then `asset_mqEP...`.
- `asset_mqEP...` is the final moonlit-pavilion destination used for the finish
  crossing and winner state.

`source/images/obstacles/` contains the 12 uploaded obstacle illustrations used
by the race catalog. Tea-puddle and moon-reflection are separate source images.

The extracted and optimized image files used by the app live in
`src/assets/derived/contestants/`, grouped by role and named by contestant.

The race uses reduced, pixel-crisp WebP derivatives from
`public/runtime/images/race-backgrounds/`; the six source PNG uploads remain available above
for future editing and are not shipped to the browser.

The six source panoramas are `6048 × 2592` opaque PNGs. Their active runtime
derivatives are `1600 × 686` opaque WebPs. The source character sheets are also
opaque flattened uploads; transparent cutouts and sprite sheets are derived
later in the pipeline.

## Image audit status

- 19 source images are preserved here: one character sheet, six race
  backgrounds, and 12 obstacle illustrations.
- The app currently has 12 portraits, 48 movement sheets, 12 public cooking
  sheets, six
  race-background WebPs, six sushi plates, three Pip keepsakes, and 36 active
  image-backed curios.
- `assets/review/unused/derived/contestants/cooking/` contains the 30 extracted
  cooking frames plus six aggregate cooking-frame sheets and six Toro frame
  PNGs. None are wired into the current counter renderer.
- The Rollo and Saffy curio sets use three independent transparent PNG
  derivatives each, all wired into the active collectible pool.
- `public/runtime/images/obstacles/` contains 11 transparent runtime derivatives
  for the 12 obstacle behaviors.
- No active image import or runtime image URL is currently missing.
- Run `pnpm --filter @workspace/mystery-bento run verify:assets` from the
  workspace root to repeat the import, runtime URL, folder, review-queue, and
  README count audit. The check intentionally allows the generated Pip
  listening preview under `public/runtime/audio/previews/`, which is not part
  of the contest sequence.

## Source audio

`source/audio/announcer/`

- `race-starts/` — reusable opening variants, including the primary and
  quiet-kitchen recordings
- `finish-results/takes-the-win.mp3` — reusable result fragment
- `character-intros/contestants-are.mp3` — reusable lead-in before name clips
- `character-names/` — one name-only clip per mascot, including `pip.mp3`
- `character-blurbs/` — one reusable name-free profile blurb per mascot
- `contest-names/` — current contest-title recordings
- `obstacles/` — reusable obstacle callouts and longer narrated obstacle
  variants
- `result-fragments/` — reusable contestant result clips, including short
  reactions and name-following sentence fragments
- `reactions/` — reusable physical reaction clips
- `pace-lead-changes/` — reusable pack and lead-change announcements
- `stage-transitions/` — reusable course-section transition announcements
- Unlabeled recordings awaiting phrase labels are in
  `../assets/review/unused/audio/announcer/unlabeled/`.

## Runtime audio

- `public/runtime/audio/announcer/` — bundled selected announcer clips
- `public/runtime/audio/announcer/race-starts/` — race-start variants
- `public/runtime/audio/announcer/character-intros/` — character-introduction lead-ins
- `public/runtime/audio/announcer/character-names/` — name-only clips by mascot
- `public/runtime/audio/announcer/finish-results/` — finish-result clips
- `public/runtime/audio/announcer/obstacles/` — obstacle callout clips
- `public/runtime/audio/announcer/result-fragments/` — contestant result clips
- `public/runtime/audio/announcer/reactions/` — physical reaction clips
- `public/runtime/audio/announcer/pace-lead-changes/` — pace and lead-change clips
- `public/runtime/audio/announcer/stage-transitions/` — course-section transitions
- `public/runtime/audio/previews/` — assembled listening previews, including
  `pip-takes-the-win.mp3`

The runtime announcer selects one of the three race-start variants
deterministically for each contest, then composes contestant names, course
beats, reactions, and the winner result from the folders above. Contest-title
and contestant-blurb clips are preserved in the review queue because they are
not selected by the current contest sequence. Missing clips are skipped without
blocking the visual race.
