# Mystery Bento asset library

This folder contains the original uploaded source material. Runtime assets are
kept separately so source sheets can be revisited without affecting the
optimized files used by the app.

## Source images

`source-images/character-sheets/`

- `character-portraits-sheet.png` — portrait sheet for the 12 mascots
- `character-food-stations-sheet.png` — food and cooking-station sheet
- `pip-porridge-animation-sheet.png`
- `sencha-tea-animation-sheet.png`
- `toro-grill-animation-sheet.png`
- `nori-nib-animation-sheet.png`
- `tilda-tofu-animation-sheet.png`
- `rollo-radish-animation-sheet.png`

`source-images/race-backgrounds/`

- The six original high-resolution race scenes are preserved here in the
  deterministic course order: `asset_Jg8...`, `asset_HZMG...`, `asset_5ja...`,
  `asset_DLD...`, `asset_JLEx...`, then `asset_mqEP...`.
- `asset_mqEP...` is the final moonlit-pavilion destination used for the finish
  crossing and winner state.

The extracted and optimized image files used by the app live in
`src/assets/contestants/`, grouped by contestant and named by role.

The race uses reduced, pixel-crisp WebP derivatives from
`public/race-backgrounds/`; the six source PNG uploads remain available above
for future editing and are not shipped to the browser.

## Source audio

`source-audio/announcer/`

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
- `unlabeled/` — uploaded recordings awaiting phrase labels

## Runtime audio

- `public/audio/announcer/` — active reusable announcer clips
- `public/audio/announcer/race-starts/` — race-start variants
- `public/audio/announcer/character-intros/` — character-introduction lead-ins
- `public/audio/announcer/character-names/` — name-only clips by mascot
- `public/audio/announcer/character-blurbs/` — name-free contestant profile clips
- `public/audio/announcer/contest-names/` — current contest-title clips
- `public/audio/announcer/finish-results/` — finish-result clips
- `public/audio/announcer/obstacles/` — obstacle callout clips
- `public/audio/announcer/result-fragments/` — contestant result clips
- `public/audio/announcer/reactions/` — physical reaction clips
- `public/audio/announcer/pace-lead-changes/` — pace and lead-change clips
- `public/audio/announcer/stage-transitions/` — course-section transitions
- `public/audio/previews/` — assembled listening previews, including
  `pip-takes-the-win.mp3`

The runtime announcer selects one of the three race-start variants
deterministically for each contest, then composes the selected title, contestant
names and blurbs, course beats, reactions, and winner result from the folders
above. Missing clips are skipped without blocking the visual race.