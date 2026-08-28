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

- `race-demo-full.mp3` — original full-race demo kept as a reference recording
- `finish-takes-the-win.mp3` — reusable result fragment
- `winner-name-pip.mp3` — reusable winner-name fragment

## Runtime audio

- `public/audio/announcer/` — active reusable announcer clips
- `public/audio/previews/` — assembled listening previews, including
  `pip-takes-the-win.mp3`

The runtime race-start clip is loaded from
`public/audio/announcer/race-start.mp3`.