# Mystery Bento announcer phrase plan

This catalog defines the short audio segments needed to narrate a complete
Mystery Bento race. The goal is to generate a small reusable library, not one
large recording per contest.

## Progress key

- [x] Generated and wired into the runtime announcer sequence
- [ ] Asset is available but not wired, or still needs live playback verification

The checklist intentionally separates catalog availability from runtime wiring.
The `wired; verify in the live race` notes identify assets selected by the
resolved contest timeline; they are not a claim that every randomized variant
has been listened to in a browser yet.

## Composition rules

1. **One semantic beat per file.** Each file should communicate one event and
   end cleanly. Target 1–5 seconds for most clips and 6–10 seconds for the
   opening or finish.
2. **Keep names separate from race copy.** Generate one name callout per
   character, then place a 150–300 ms pause before the reusable action phrase.
   This prevents a new character name from requiring a new recording of every
   obstacle and result.
3. **Put the name first when it is part of a sentence.** Use
   “Pip — clean line!” rather than “Clean line from Pip.” The first form can be
   assembled as `name + result` and stays easy to understand when clips are
   swapped.
4. **Do not include contest names, obstacle names, or winners in universal
   clips.** Those values change every race. Make them their own clip families.
5. **Use punctuation as performance direction.** Commas create light pauses;
   em dashes create a commentator beat; an ellipsis is reserved for a genuine
   suspense hold. Do not add stage directions to the spoken text.
6. **Keep each clip mono, clean, and voice-only.** No bed music, crowd, or
   reverb should be baked into the voice files. Sound design can be layered
   independently.

## File naming

Use lowercase kebab-case with a stable family and variant number:

```text
race-start-01.mp3
name-pip-01.mp3
obstacle-napkin-gust-01.mp3
result-clear-01.mp3
reaction-jump-01.mp3
lead-change-01.mp3
finish-winner-01.mp3
finish-takes-the-win-01.mp3
```

The number is a voice/performance variant, not a race number. Keep a small
manifest beside the files later with the exact text, voice name, and duration.

## Current installed clips and status

- [x] Race-start clip — generated, wired into every contest intro, and verified
  to hold the race until the audio `ended` event.

```text
public/runtime/audio/announcer/race-starts/race-start-primary.mp3
```

Source text:

> Good evening, night owls, and welcome to the Mystery Bento Match! The
> lanterns are lit, the lanes are set, and our contenders are poised. And
> we’re off!

Source asset:

```text
assets/source/audio/announcer/race-starts/race-start-primary.mp3
```

- [x] Winner-result fragment — wired as the reusable second half of the winner
  call; verify end-to-end in the live race.

```text
public/runtime/audio/announcer/finish-results/takes-the-win.mp3
```

Source text:

> takes the win

Use it after the separate winner-name clip:

```text
character-names/[winner-name] + finish-takes-the-win
```

This keeps the result fragment reusable for every persona without generating a
separate winner sentence for each character.

- [x] Pip winner-name clip — available to the shared winner-name mapping; verify
  end-to-end in the live race.

```text
public/runtime/audio/announcer/character-names/pip.mp3
```

Source text:

> Pip

- [x] Pip + “takes the win” listening preview — generated and playable.

```text
public/runtime/audio/previews/pip-takes-the-win.mp3
```

It combines `character-names/pip` immediately followed by
`finish-takes-the-win`, so the assembled call is “Pip takes the win.”

## Recommended first generation batch

Generate these before adding dynamic obstacle narration:

### 1. Race starts

These are interchangeable opening clips. They contain no names.

- [x] Good evening, night owls, and welcome to the Mystery Bento Match! The
  lanterns are lit, the lanes are set, and our contenders are poised. And
  we’re off! — wired and verified
- [x] The kitchen is quiet, the lanterns are glowing, and the course is ready.
  Contenders to the line — this bento dash is underway! — wired and verified
- [x] Welcome back to the after-hours kitchen! The route is set, the plates are
  polished, and the night’s race is about to begin. Let’s go! — wired and
  verified

### 2. Contest identity

Use only when the contest title is important. The title should be a separate
clip from the opening call.

The five generated title clips are preserved in
`assets/review/unused/audio/announcer/contest-names/`; they are not shipped in
the current runtime because the contest title is currently rendered as text.

- [ ] Tonight’s contest is the [CONTEST NAME].
- [ ] The [CONTEST NAME] is ready for its first move.

`[CONTEST NAME]` is a generation slot, not literal spoken text. For a fully
static first batch, generate these current titles separately:

- [ ] Bento Dash.
- [ ] Lantern Ladle League.
- [ ] The Midnight Maki Match.
- [ ] Wobble Plate Relay.
- [ ] Tea Tray Twilight Trial.

### 3. Character introductions

The reusable lead-in for the name clips is wired into the shared intro
sequence:

- [x] Tonight’s contestants are — wired; verify in the live race
  (`public/runtime/audio/announcer/character-intros/contestants-are.mp3`)

Generate one clip per character. Keep every name clip short and end with a
small natural pause.

- [ ] Pip, ready at the lantern.
- [ ] Sencha, ready at the lantern.
- [ ] Toro, ready at the lantern.
- [ ] Nori, ready at the lantern.
- [ ] Tilda, ready at the lantern.
- [ ] Rollo, ready at the lantern.
- [ ] Miso, ready at the lantern.
- [ ] Uma, ready at the lantern.
- [ ] Panko, ready at the lantern.
- [ ] Saffy, ready at the lantern.
- [ ] Kiku, ready at the lantern.
- [ ] Bibi, ready at the lantern.

#### Tiny contestant blurbs

Read one of these after each name clip. Generate the blurb as a separate,
name-free clip so the assembly stays reusable:

The 12 generated blurb clips are preserved in
`assets/review/unused/audio/announcer/character-blurbs/`; they are not selected
by the current contest sequence.

```text
character-name + contestant-blurb
```

- [ ] **Pip Porridge** — Races fast enough to lose his breakfast, then doubles
  back for it.
- [ ] **Lady Sencha** — Never hurries; she simply arrives at the correct pace.
- [ ] **Captain Toro** — Steady as a ship, unless a hallway demands a formal
  bow.
- [ ] **Nori Nib** — Waits for destiny to reveal the shortcut.
- [ ] **Tilda Tofu** — May stop to repair the course, then label the repair.
- [ ] **Rollo Radish** — If the shortcut looks accidental, Rollo planned it.
- [ ] **Miso Mallow** — Calm enough to bring emergency broth to the finish line.
- [ ] **Uma Udon** — Strong enough to move the obstacle, after checking whether
  everyone has eaten.
- [ ] **Panko Puff** — Investigates every crumb like it’s a major clue.
- [ ] **Saffy Sashimi** — Every turn is precise, and every finish deserves
  applause.
- [ ] **Kiku Kettle** — Treats every malfunction as the machine expressing
  itself.
- [ ] **Bibi Bento** — Arrives prepared with spare napkins for every possible
  feeling.

Optional shorter name-only versions are useful when the UI already supplies
the action phrase:

- All 12 name-only assets are now present under
  `public/runtime/audio/announcer/character-names/` and
  `assets/source/audio/announcer/character-names/`. They are mapped into the
  runtime sequence; the checklist below still tracks live browser playback
  verification.

- [x] Pip! — wired; verify in the live race
- [x] Sencha! — wired; verify in the live race
- [x] Toro! — wired; verify in the live race
- [x] Nori! — wired; verify in the live race
- [x] Tilda! — wired; verify in the live race
- [x] Rollo! — wired; verify in the live race
- [x] Miso! — wired; verify in the live race
- [x] Uma! — wired; verify in the live race
- [x] Panko! — wired; verify in the live race
- [x] Saffy! — wired; verify in the live race
- [x] Kiku! — wired; verify in the live race
- [x] Bibi! — wired; verify in the live race

### 4. Obstacle callouts

Generate one reusable callout per obstacle. These are independent of the
character who caused or reaches the obstacle.

- [x] Napkin gust ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/napkin-gust-ahead.mp3`)
- [x] Tea puddle ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/tea-puddle-ahead.mp3`)
- [x] Wobble stack ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/wobble-stack-ahead.mp3`)
- [x] Moon reflection ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/moon-reflection-ahead.mp3`)
- [x] Broken cart across the course! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/broken-cart-across-the-course.mp3`)
- [x] Ribbon tunnel ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/ribbon-tunnel-ahead.mp3`)
- [x] Cushion pile ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/cushion-pile-ahead.mp3`)
- [x] Flour sacks coming into the lane! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/flour-sacks-coming-into-the-lane.mp3`)
- [x] Crumb trail ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/crumb-trail-ahead.mp3`)
- [x] Garnish gate ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/garnish-gate-ahead.mp3`)
- [x] Steam gadget ahead! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/steam-gadget-ahead.mp3`)
- [x] Bento stack at the finish! — wired; verify in the live race
  (`public/runtime/audio/announcer/obstacles/bento-stack-at-the-finish.mp3`)

Longer alternate versions can be used when the race needs more drama:

- [ ] The napkin gust is sweeping across the straightaway! — asset received;
  live playback pending
  (`public/runtime/audio/announcer/obstacles/napkin-gust-sweeping-straightaway.mp3`)
- [ ] A tea puddle demands a very careful step! — asset received; live playback
  pending (`public/runtime/audio/announcer/obstacles/tea-puddle-careful-step.mp3`)
- [ ] The wobble stack is swaying across the lane! — asset received; live
  playback pending
  (`public/runtime/audio/announcer/obstacles/wobble-stack-swaying-across-lane.mp3`)
- [ ] That moon reflection may be hiding a shortcut! — asset received; live
  playback pending
  (`public/runtime/audio/announcer/obstacles/moon-reflection-hiding-shortcut.mp3`)
- [ ] There’s a broken cart blocking the course! — asset received; live playback
  pending (`public/runtime/audio/announcer/obstacles/broken-cart-blocking-course.mp3`)
- [ ] The ribbon tunnel is moving faster than expected! — asset received; live
  playback pending
  (`public/runtime/audio/announcer/obstacles/ribbon-tunnel-moving-faster.mp3`)
- [ ] A cushion pile is blocking the safest-looking route! — asset received;
  live playback pending
  (`public/runtime/audio/announcer/obstacles/cushion-pile-blocking-safest-route.mp3`)
- [ ] Flour sacks are tumbling in from the side door! — asset received; live
  playback pending
  (`public/runtime/audio/announcer/obstacles/flour-sacks-tumbling-side-door.mp3`)
- [ ] A tempting crumb trail winds behind the crates! — asset received; live
  playback pending
  (`public/runtime/audio/announcer/obstacles/crumb-trail-behind-crates.mp3`)
- [ ] The garnish gate leaves only one elegant line through! — asset received;
  live playback pending
  (`public/runtime/audio/announcer/obstacles/garnish-gate-one-elegant-line.mp3`)
- [ ] The steam gadget has filled the lane with fog! — asset received; live
  playback pending
  (`public/runtime/audio/announcer/obstacles/steam-gadget-filled-lane-with-fog.mp3`)
- [ ] The bento stack has narrowed the final lane! — asset received; live
  playback pending
  (`public/runtime/audio/announcer/obstacles/bento-stack-narrowed-final-lane.mp3`)

### 5. Universal contestant result clips

These are intentionally name-free. Compose them as
`name + result`, or use the named versions below for more character.

- [x] Clean line! — wired as the first clear-result callout only; later clear
  results use varied physical reactions
  (`public/runtime/audio/announcer/result-fragments/clean-line.mp3`)
- [x] Slowed down! — wired; verify in the live race
  (`public/runtime/audio/announcer/result-fragments/slowed-down.mp3`)
- [ ] Found a break! — asset received; live playback pending
  (`public/runtime/audio/announcer/result-fragments/found-a-break.mp3`)
- [x] Rerouted! — wired; verify in the live race
  (`public/runtime/audio/announcer/result-fragments/rerouted.mp3`)

Named sentence templates, to be rendered once per current character only if
the separate name-plus-result delivery does not sound natural:

- [ ] [NAME] finds a clean line. — asset received; live playback pending
  (`public/runtime/audio/announcer/result-fragments/finds-a-clean-line.mp3`)
- [ ] [NAME] loses a few steps. — asset received; live playback pending
  (`public/runtime/audio/announcer/result-fragments/loses-a-few-steps.mp3`)
- [x] [NAME] finds an unexpected opening. — wired; verify in the live race
  (`public/runtime/audio/announcer/result-fragments/finds-an-unexpected-opening.mp3`)
- [ ] [NAME] takes the strange line around it. — asset available; not selected
  by the current result-fragment mapping
  (`public/runtime/audio/announcer/result-fragments/takes-the-strange-line-around-it.mp3`)

### 6. Physical reactions

These should stay short and reusable across obstacles.

- [x] Jumps over it and keeps moving! — wired; verify in the live race
  (`public/runtime/audio/announcer/reactions/jumps-over-it-and-keeps-moving.mp3`)
- [x] Sidesteps it and holds the line! — wired; verify in the live race
  (`public/runtime/audio/announcer/reactions/sidesteps-it-and-holds-the-line.mp3`)
- [x] Slides around it and recovers! — wired; verify in the live race
  (`public/runtime/audio/announcer/reactions/slides-around-it-and-recovers.mp3`)
- [x] Ducks beneath it and keeps moving! — wired; verify in the live race
  (`public/runtime/audio/announcer/reactions/ducks-beneath-it-and-keeps-moving.mp3`)
- [x] Stumbles, steadies, and carries on! — wired; verify in the live race
  (`public/runtime/audio/announcer/reactions/stumbles-steadies-and-carries-on.mp3`)
- [x] Weaves through and finds a stranger line! — wired; verify in the live race
  (`public/runtime/audio/announcer/reactions/weaves-through-and-finds-a-stranger-line.mp3`)
- [x] Surges through the opening! — wired; verify in the live race
  (`public/runtime/audio/announcer/reactions/surges-through-the-opening.mp3`)

Recommended composition:

```text
[NAME] — [REACTION]
```

### 7. Pace and lead changes

These clips give the announcer a way to bridge the visual race without
describing every frame.

- [x] The pack is still together! — wired; verify in the live race
  (`public/runtime/audio/announcer/pace-lead-changes/pack-still-together.mp3`)
- [x] The field is beginning to stretch! — wired; verify in the live race
  (`public/runtime/audio/announcer/pace-lead-changes/field-beginning-to-stretch.mp3`)
- [x] There’s a new leader on the lantern route! — wired; verify in the live race
  (`public/runtime/audio/announcer/pace-lead-changes/new-leader-lantern-route.mp3`)
- [x] The lead has changed hands! — wired; verify in the live race
  (`public/runtime/audio/announcer/pace-lead-changes/lead-changed-hands.mp3`)
- [ ] That gap is closing quickly! — asset received; live playback pending
  (`public/runtime/audio/announcer/pace-lead-changes/gap-closing-quickly.mp3`)
- [x] One contender is finding another gear! — wired; verify in the live race
  (`public/runtime/audio/announcer/pace-lead-changes/one-contender-finding-another-gear.mp3`)
- [ ] The back marker is not giving up! — asset received; live playback pending
  (`public/runtime/audio/announcer/pace-lead-changes/back-marker-not-giving-up.mp3`)

### 8. Stage transitions

Use one transition between each course section. They do not name an obstacle,
so they work with any generated course.

- [x] The warm-up is underway. — wired; verify in the live race
  (`public/runtime/audio/announcer/stage-transitions/warm-up-underway.mp3`)
- [ ] The first hazard is coming into view. — asset received; live playback
  pending
  (`public/runtime/audio/announcer/stage-transitions/first-hazard-coming-into-view.mp3`)
- [x] They’re around the bend and into the matchup. — wired; verify in the live race
  (`public/runtime/audio/announcer/stage-transitions/around-bend-into-matchup.mp3`)
- [ ] The final lane is approaching. — asset received; live playback pending
  (`public/runtime/audio/announcer/stage-transitions/final-lane-approaching.mp3`)
- [x] The finish is in sight! — wired; verify in the live race
  (`public/runtime/audio/announcer/stage-transitions/finish-in-sight.mp3`)

### 9. Finish and winner reveal

Keep the winner’s name as a separate clip. That lets the same finish phrases
work for every character.

- [ ] Into the final lane they go!
- [ ] It’s a clean run to the lantern line!
- [ ] Across the finish!
- [ ] That is the race!
- [x] [NAME] takes the win! — wired as winner-name + finish-takes-the-win;
  verify in the live race
- [ ] [NAME] is tonight’s Mystery Bento champion!
- [ ] [NAME] has earned the story of the night!

Optional neutral result phrases for reduced narration:

- [ ] The winner has been decided.
- [ ] What a beautiful little mess.
- [ ] The kitchen has its champion.

### 10. Closing and return

These are useful after the winner card, not during the moving race.

- [ ] The story is logged at the counter.
- [ ] The lanterns can settle now.
- [ ] Stay curious, and keep the rice warm.

## Suggested assembly for one complete race

The first full composable version should use this order:

- [x] race-start — generated and wired; previously verified
- [ ] contest-name
- [x] character-name × 3 or 4 — wired; verify in the live race
- [x] stage-transition: warm-up — wired; verify in the live race
- [x] obstacle-callout — wired; verify in the live race
- [x] result or physical reaction — wired; verify in the live race
- [x] lead-change or stage-transition — wired; verify in the live race
- [x] obstacle-callout — wired; verify in the live race
- [x] result or physical reaction — wired; verify in the live race
- [x] stage-transition: final lane — wired; verify in the live race
- [x] obstacle-callout — wired; verify in the live race
- [x] result or physical reaction — wired; verify in the live race
- [ ] finish
- [x] winner-name + winner phrase — assets wired; verify in the live race
- [ ] closing

Do not generate every possible combination. With the families above, a small
set of starts, transitions, obstacle callouts, result clips, reactions, and
character names can cover many randomized races.

## Generation checklist

- [x] Use the same British football-announcer voice for every current clip.
- [ ] Generate at least two variants for `race-start`, `finish`, and
  `lead-change`; one variant is enough for the first pass of the other
  families.
- [ ] Keep spoken names exactly consistent with the UI spelling across the full
  generated batch.
- [ ] Avoid contractions or pronunciations that differ between clips.
- [x] Keep a clear pause between clips — the runtime sequencer waits at least
  520 ms after every clip, including across contest stages and autoplay recovery.
- [ ] Normalize loudness across the batch before committing the files.
- [ ] Record the exact source text in a manifest before wiring a clip into code.