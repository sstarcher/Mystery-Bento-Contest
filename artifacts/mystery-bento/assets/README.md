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

The extracted and optimized image files used by the app live in
`src/assets/contestants/`, grouped by contestant and named by role.

## Source audio

`source-audio/announcer/`

- `race-starts/` — reusable opening variants, including the primary and
  quiet-kitchen recordings
- `finish-results/takes-the-win.mp3` — reusable result fragment
- `character-intros/contestants-are.mp3` — reusable lead-in before name clips
- `character-names/` — one name-only clip per mascot, including `pip.mp3`
- `obstacles/` — reusable obstacle callouts and longer narrated obstacle
  variants
- `result-fragments/` — reusable contestant result clips, including short
  reactions and name-following sentence fragments
- `reactions/` — reusable physical reaction clips
- `pace-lead-changes/` — reusable pack and lead-change announcements
- `unlabeled/` — uploaded recordings awaiting phrase labels

## Runtime audio

- `public/audio/announcer/` — active reusable announcer clips
- `public/audio/announcer/race-starts/` — race-start variants
- `public/audio/announcer/character-intros/` — character-introduction lead-ins
- `public/audio/announcer/character-names/` — name-only clips by mascot
- `public/audio/announcer/finish-results/` — finish-result clips
- `public/audio/announcer/obstacles/` — obstacle callout clips
- `public/audio/announcer/result-fragments/` — contestant result clips
- `public/audio/announcer/reactions/` — physical reaction clips
- `public/audio/announcer/pace-lead-changes/` — pace and lead-change clips
- `public/audio/previews/` — assembled listening previews, including
  `pip-takes-the-win.mp3`

The runtime race-start clip is loaded from
`public/audio/announcer/race-starts/race-start-primary.mp3`.