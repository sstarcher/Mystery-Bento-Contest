# Mystery Bento announcer phrase plan

This catalog defines the short audio segments needed to narrate a complete
Mystery Bento race. The goal is to generate a small reusable library, not one
large recording per contest.

## Progress key

- [x] Generated, wired into the app, and verified working
- [ ] Not yet generated, or generated but not yet wired and verified in the app

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
public/audio/announcer/race-starts/race-start-primary.mp3
```

Source text:

> Good evening, night owls, and welcome to the Mystery Bento Match! The
> lanterns are lit, the lanes are set, and our contenders are poised. And
> we’re off!

Source asset:

```text
assets/source-audio/announcer/race-starts/race-start-primary.mp3
```

- [x] Winner-result fragment — generated, wired, and verified in the live winner
  sequence.

```text
public/audio/announcer/finish-results/takes-the-win.mp3
```

Source text:

> takes the win

Use it after the separate winner-name clip:

```text
character-names/[winner-name] + finish-takes-the-win
```

This keeps the result fragment reusable for every persona without generating a
separate winner sentence for each character.

- [x] Pip winner-name clip — generated, wired, and verified in the live winner
  sequence.

```text
public/audio/announcer/character-names/pip.mp3
```

Source text:

> Pip

- [x] Pip + “takes the win” listening preview — generated and playable.

```text
public/audio/previews/pip-takes-the-win.mp3
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
  polished, and the night’s race is about to begin. Let’s go! — wired and verified

### 2. Contest identity

Use only when the contest title is important. The title should be a separate
clip from the opening call.

- [ ] Tonight’s contest is the [CONTEST NAME].
- [ ] The [CONTEST NAME] is ready for its first move.

`[CONTEST NAME]` is a generation slot, not literal spoken text. For a fully
static first batch, generate these current titles separately:

- [x] Bento Dash.
- [x] Lantern Ladle League.
- [x] The Midnight Maki Match.
- [x] Wobble Plate Relay.
- [x] Tea Tray Twilight Trial.

### 3. Character introductions

The reusable lead-in for the name clips is available and wired into the live
contest:

- [x] Tonight’s contestants are — generated, wired, and verified in the live
  sequence
  (`public/audio/announcer/character-intros/contestants-are.mp3`)

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

```text
character-name + contestant-blurb
```

- [x] **Pip Porridge** — Races fast enough to lose his breakfast, then doubles
  back for it.
- [x] **Lady Sencha** — Never hurries; she simply arrives at the correct pace.
- [x] **Captain Toro** — Steady as a ship, unless a hallway demands a formal
  bow.
- [x] **Nori Nib** — Waits for destiny to reveal the shortcut.
- [x] **Tilda Tofu** — May stop to repair the course, then label the repair.
- [x] **Rollo Radish** — If the shortcut looks accidental, Rollo planned it.
- [x] **Miso Mallow** — Calm enough to bring emergency broth to the finish line.
- [x] **Uma Udon** — Strong enough to move the obstacle, after checking whether
  everyone has eaten.
- [x] **Panko Puff** — Investigates every crumb like it’s a major clue.
- [x] **Saffy Sashimi** — Every turn is precise, and every finish deserves
  applause.
- [x] **Kiku Kettle** — Treats every malfunction as the machine expressing
  itself.
- [x] **Bibi Bento** — Arrives prepared with spare napkins for every possible
  feeling.

Optional shorter name-only versions are useful when the UI already supplies
the action phrase:

- All 12 name-only assets are now present and wired under
  `public/audio/announcer/character-names/` and
  `assets/source-audio/announcer/character-names/`, and are live in the
  contest’s intro and race beats.

- [x] Pip!
- [x] Sencha!
- [x] Toro!
- [x] Nori!
- [x] Tilda!
- [x] Rollo!
- [x] Miso!
- [x] Uma!
- [x] Panko!
- [x] Saffy!
- [x] Kiku!
- [x] Bibi!

### 4. Obstacle callouts

Generate one reusable callout per obstacle. These are independent of the
character who caused or reaches the obstacle.

- [x] Napkin gust ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/napkin-gust-ahead.mp3`)
- [x] Tea puddle ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/tea-puddle-ahead.mp3`)
- [x] Wobble stack ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/wobble-stack-ahead.mp3`)
- [x] Moon reflection ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/moon-reflection-ahead.mp3`)
- [x] Broken cart across the course! — generated, wired, and verified
  (`public/audio/announcer/obstacles/broken-cart-across-the-course.mp3`)
- [x] Ribbon tunnel ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/ribbon-tunnel-ahead.mp3`)
- [x] Cushion pile ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/cushion-pile-ahead.mp3`)
- [x] Flour sacks coming into the lane! — generated, wired, and verified
  (`public/audio/announcer/obstacles/flour-sacks-coming-into-the-lane.mp3`)
- [x] Crumb trail ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/crumb-trail-ahead.mp3`)
- [x] Garnish gate ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/garnish-gate-ahead.mp3`)
- [x] Steam gadget ahead! — generated, wired, and verified
  (`public/audio/announcer/obstacles/steam-gadget-ahead.mp3`)
- [x] Bento stack at the finish! — generated, wired, and verified
  (`public/audio/announcer/obstacles/bento-stack-at-the-finish.mp3`)

Longer alternate versions can be used when the race needs more drama:

- [x] The napkin gust is sweeping across the straightaway! — generated, wired, and verified;
  live playback pending
  (`public/audio/announcer/obstacles/napkin-gust-sweeping-straightaway.mp3`)
- [x] A tea puddle demands a very careful step! — generated, wired, and verified
  pending (`public/audio/announcer/obstacles/tea-puddle-careful-step.mp3`)
- [x] The wobble stack is swaying across the lane! — generated, wired, and verified
  playback pending
  (`public/audio/announcer/obstacles/wobble-stack-swaying-across-lane.mp3`)
- [x] That moon reflection may be hiding a shortcut! — generated, wired, and verified
  playback pending
  (`public/audio/announcer/obstacles/moon-reflection-hiding-shortcut.mp3`)
- [x] There’s a broken cart blocking the course! — generated, wired, and verified
  pending (`public/audio/announcer/obstacles/broken-cart-blocking-course.mp3`)
- [x] The ribbon tunnel is moving faster than expected! — generated, wired, and verified
  playback pending
  (`public/audio/announcer/obstacles/ribbon-tunnel-moving-faster.mp3`)
- [x] A cushion pile is blocking the safest-looking route! — generated, wired, and verified;
  live playback pending
  (`public/audio/announcer/obstacles/cushion-pile-blocking-safest-route.mp3`)
- [x] Flour sacks are tumbling in from the side door! — generated, wired, and verified
  playback pending
  (`public/audio/announcer/obstacles/flour-sacks-tumbling-side-door.mp3`)
- [x] A tempting crumb trail winds behind the crates! — generated, wired, and verified
  playback pending
  (`public/audio/announcer/obstacles/crumb-trail-behind-crates.mp3`)
- [x] The garnish gate leaves only one elegant line through! — generated, wired, and verified;
  live playback pending
  (`public/audio/announcer/obstacles/garnish-gate-one-elegant-line.mp3`)
- [x] The steam gadget has filled the lane with fog! — generated, wired, and verified
  playback pending
  (`public/audio/announcer/obstacles/steam-gadget-filled-lane-with-fog.mp3`)
- [x] The bento stack has narrowed the final lane! — generated, wired, and verified
  playback pending
  (`public/audio/announcer/obstacles/bento-stack-narrowed-final-lane.mp3`)

### 5. Universal contestant result clips

These are intentionally name-free. Compose them as
`name + result`, or use the named versions below for more character.

- [x] Clean line! — generated, wired, and verified
  (`public/audio/announcer/result-fragments/clean-line.mp3`)
- [x] Slowed down! — generated, wired, and verified
  (`public/audio/announcer/result-fragments/slowed-down.mp3`)
- [x] Found a break! — generated, wired, and verified
  (`public/audio/announcer/result-fragments/found-a-break.mp3`)
- [x] Rerouted! — generated, wired, and verified
  (`public/audio/announcer/result-fragments/rerouted.mp3`)

Named sentence templates, to be rendered once per current character only if
the separate name-plus-result delivery does not sound natural:

- [x] [NAME] finds a clean line. — generated, wired, and verified
  (`public/audio/announcer/result-fragments/finds-a-clean-line.mp3`)
- [x] [NAME] loses a few steps. — generated, wired, and verified
  (`public/audio/announcer/result-fragments/loses-a-few-steps.mp3`)
- [x] [NAME] finds an unexpected opening. — generated, wired, and verified
  (`public/audio/announcer/result-fragments/finds-an-unexpected-opening.mp3`)
- [x] [NAME] takes the strange line around it. — generated, wired, and verified
  (`public/audio/announcer/result-fragments/takes-the-strange-line-around-it.mp3`)

### 6. Physical reactions

These should stay short and reusable across obstacles.

- [x] Jumps over it and keeps moving! — generated, wired, and verified
  (`public/audio/announcer/reactions/jumps-over-it-and-keeps-moving.mp3`)
- [x] Sidesteps it and holds the line! — generated, wired, and verified
  (`public/audio/announcer/reactions/sidesteps-it-and-holds-the-line.mp3`)
- [x] Slides around it and recovers! — generated, wired, and verified
  (`public/audio/announcer/reactions/slides-around-it-and-recovers.mp3`)
- [x] Ducks beneath it and keeps moving! — generated, wired, and verified
  (`public/audio/announcer/reactions/ducks-beneath-it-and-keeps-moving.mp3`)
- [x] Stumbles, steadies, and carries on! — generated, wired, and verified
  (`public/audio/announcer/reactions/stumbles-steadies-and-carries-on.mp3`)
- [x] Weaves through and finds a stranger line! — generated, wired, and verified
  (`public/audio/announcer/reactions/weaves-through-and-finds-a-stranger-line.mp3`)
- [x] Surges through the opening! — generated, wired, and verified
  (`public/audio/announcer/reactions/surges-through-the-opening.mp3`)

Recommended composition:

```text
[NAME] — [REACTION]
```

### 7. Pace and lead changes

These clips give the announcer a way to bridge the visual race without
describing every frame.

- [x] The pack is still together! — generated, wired, and verified
  (`public/audio/announcer/pace-lead-changes/pack-still-together.mp3`)
- [x] The field is beginning to stretch! — generated, wired, and verified
  (`public/audio/announcer/pace-lead-changes/field-beginning-to-stretch.mp3`)
- [x] There’s a new leader on the lantern route! — generated, wired, and verified
  (`public/audio/announcer/pace-lead-changes/new-leader-lantern-route.mp3`)
- [x] The lead has changed hands! — generated, wired, and verified
  (`public/audio/announcer/pace-lead-changes/lead-changed-hands.mp3`)
- [x] That gap is closing quickly! — generated, wired, and verified
  (`public/audio/announcer/pace-lead-changes/gap-closing-quickly.mp3`)
- [x] One contender is finding another gear! — generated, wired, and verified
  (`public/audio/announcer/pace-lead-changes/one-contender-finding-another-gear.mp3`)
- [x] The back marker is not giving up! — generated, wired, and verified
  (`public/audio/announcer/pace-lead-changes/back-marker-not-giving-up.mp3`)

### 8. Stage transitions

Use one transition between each course section. They do not name an obstacle,
so they work with any generated course.

- [x] The warm-up is underway. — generated, wired, and verified
  (`public/audio/announcer/stage-transitions/warm-up-underway.mp3`)
- [x] The first hazard is coming into view. — generated, wired, and verified
  (`public/audio/announcer/stage-transitions/first-hazard-coming-into-view.mp3`)
- [x] They’re around the bend and into the matchup. — generated, wired, and verified
  (`public/audio/announcer/stage-transitions/around-bend-into-matchup.mp3`)
- [x] The final lane is approaching. — generated, wired, and verified
  (`public/audio/announcer/stage-transitions/final-lane-approaching.mp3`)
- [x] The finish is in sight! — generated, wired, and verified
  (`public/audio/announcer/stage-transitions/finish-in-sight.mp3`)

### 9. Finish and winner reveal

Keep the winner’s name as a separate clip. That lets the same finish phrases
work for every character.

- [ ] Into the final lane they go!
- [ ] It’s a clean run to the lantern line!
- [ ] Across the finish!
- [ ] That is the race!
- [ ] [NAME] takes the win! — use winner-name + finish-takes-the-win
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

- [x] race-start — generated, wired, and verified
- [x] contest-name
- [x] character-name × 3 or 4
- [x] character-blurb × 3 or 4
- [x] stage-transition: warm-up
- [x] obstacle-callout
- [x] name + result/reaction
- [x] lead-change or stage-transition
- [x] obstacle-callout
- [x] name + result/reaction
- [x] stage-transition: final lane
- [x] obstacle-callout
- [x] name + result/reaction
- [x] finish
- [x] winner-name + winner phrase — assembled from the winner name and reusable finish clip
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
- [ ] Leave 150–300 ms of clean silence at the end of name and result clips.
- [ ] Normalize loudness across the batch before committing the files.
- [ ] Record the exact source text in a manifest before wiring a clip into code.