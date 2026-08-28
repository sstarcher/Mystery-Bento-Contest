# Mystery Bento announcer phrase plan

This catalog defines the short audio segments needed to narrate a complete
Mystery Bento race. The goal is to generate a small reusable library, not one
large recording per contest.

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

## Current installed clips

The first reusable segment is:

```text
public/audio/announcer/race-start.mp3
```

Source text:

> Good evening, night owls, and welcome to the Mystery Bento Match! The
> lanterns are lit, the lanes are set, and our contenders are poised. And
> we’re off!

It is used at the intro of every contest. The race waits for this clip to
finish before advancing beyond the intro stage.

The first reusable winner-result fragment is:

```text
public/audio/announcer/finish-takes-the-win.mp3
```

Source text:

> takes the win

Use it after the separate winner-name clip:

```text
[winner-name] + finish-takes-the-win
```

This keeps the result fragment reusable for every persona without generating a
separate winner sentence for each character.

The first installed winner-name clip is:

```text
public/audio/announcer/winner-name-pip.mp3
```

Source text:

> Pip

A back-to-back listening preview is also available:

```text
public/audio/previews/pip-takes-the-win.mp3
```

It combines `winner-name-pip` immediately followed by
`finish-takes-the-win`, so the assembled call is “Pip takes the win.”

## Recommended first generation batch

Generate these before adding dynamic obstacle narration:

### 1. Race starts

These are interchangeable opening clips. They contain no names.

```text
Good evening, night owls, and welcome to the Mystery Bento Match! The lanterns are lit, the lanes are set, and our contenders are poised. And we’re off!

The kitchen is quiet, the lanterns are glowing, and the course is ready. Contenders to the line — this bento dash is underway!

Welcome back to the after-hours kitchen! The route is set, the plates are polished, and the night’s race is about to begin. Let’s go!
```

### 2. Contest identity

Use only when the contest title is important. The title should be a separate
clip from the opening call.

```text
Tonight’s contest is the [CONTEST NAME].

The [CONTEST NAME] is ready for its first move.
```

`[CONTEST NAME]` is a generation slot, not literal spoken text. For a fully
static first batch, generate these current titles separately:

```text
Bento Dash.
Lantern Ladle League.
The Midnight Maki Match.
Wobble Plate Relay.
Tea Tray Twilight Trial.
```

### 3. Character introductions

Generate one clip per character. Keep every name clip short and end with a
small natural pause.

```text
Pip, ready at the lantern.
Sencha, ready at the lantern.
Toro, ready at the lantern.
Nori, ready at the lantern.
Tilda, ready at the lantern.
Rollo, ready at the lantern.
Miso, ready at the lantern.
Uma, ready at the lantern.
Panko, ready at the lantern.
Saffy, ready at the lantern.
Kiku, ready at the lantern.
Bibi, ready at the lantern.
```

Optional shorter name-only versions are useful when the UI already supplies
the action phrase:

```text
Pip!
Sencha!
Toro!
Nori!
Tilda!
Rollo!
Miso!
Uma!
Panko!
Saffy!
Kiku!
Bibi!
```

### 4. Obstacle callouts

Generate one reusable callout per obstacle. These are independent of the
character who caused or reaches the obstacle.

```text
Napkin gust ahead!
Tea puddle ahead!
Wobble stack ahead!
Moon reflection ahead!
Broken cart across the course!
Ribbon tunnel ahead!
Cushion pile ahead!
Flour sacks coming into the lane!
Crumb trail ahead!
Garnish gate ahead!
Steam gadget ahead!
Bento stack at the finish!
```

Longer alternate versions can be used when the race needs more drama:

```text
The napkin gust is sweeping across the straightaway!
A tea puddle demands a very careful step!
The wobble stack is swaying across the lane!
That moon reflection may be hiding a shortcut!
There’s a broken cart blocking the course!
The ribbon tunnel is moving faster than expected!
A cushion pile is blocking the safest-looking route!
Flour sacks are tumbling in from the side door!
A tempting crumb trail winds behind the crates!
The garnish gate leaves only one elegant line through!
The steam gadget has filled the lane with fog!
The bento stack has narrowed the final lane!
```

### 5. Universal contestant result clips

These are intentionally name-free. Compose them as
`name + result`, or use the named versions below for more character.

```text
Clean line!
Slowed down!
Found a break!
Rerouted!
```

Named sentence templates, to be rendered once per current character only if
the separate name-plus-result delivery does not sound natural:

```text
[NAME] finds a clean line.
[NAME] loses a few steps.
[NAME] finds an unexpected opening.
[NAME] takes the strange line around it.
```

### 6. Physical reactions

These should stay short and reusable across obstacles.

```text
Jumps over it and keeps moving!
Sidesteps it and holds the line!
Slides around it and recovers!
Ducks beneath it and keeps moving!
Stumbles, steadies, and carries on!
Weaves through and finds a stranger line!
Surges through the opening!
```

Recommended composition:

```text
[NAME] — [REACTION]
```

### 7. Pace and lead changes

These clips give the announcer a way to bridge the visual race without
describing every frame.

```text
The pack is still together!
The field is beginning to stretch!
There’s a new leader on the lantern route!
The lead has changed hands!
That gap is closing quickly!
One contender is finding another gear!
The back marker is not giving up!
```

### 8. Stage transitions

Use one transition between each course section. They do not name an obstacle,
so they work with any generated course.

```text
The warm-up is underway.
The first hazard is coming into view.
They’re around the bend and into the matchup.
The final lane is approaching.
The finish is in sight!
```

### 9. Finish and winner reveal

Keep the winner’s name as a separate clip. That lets the same finish phrases
work for every character.

```text
Into the final lane they go!
It’s a clean run to the lantern line!
Across the finish!
That is the race!

[NAME] takes the win!
[NAME] is tonight’s Mystery Bento champion!
[NAME] has earned the story of the night!
```

Optional neutral result phrases for reduced narration:

```text
The winner has been decided.
What a beautiful little mess.
The kitchen has its champion.
```

### 10. Closing and return

These are useful after the winner card, not during the moving race.

```text
The story is logged at the counter.
The lanterns can settle now.
Stay curious, and keep the rice warm.
```

## Suggested assembly for one complete race

The first full composable version should use this order:

```text
race-start
contest-name
character-name × 3 or 4
stage-transition: warm-up
obstacle-callout
name + result/reaction
lead-change or stage-transition
obstacle-callout
name + result/reaction
stage-transition: final lane
obstacle-callout
name + result/reaction
finish
winner-name + winner phrase
closing
```

Do not generate every possible combination. With the families above, a small
set of starts, transitions, obstacle callouts, result clips, reactions, and
character names can cover many randomized races.

## Generation checklist

- Keep the same British football-announcer voice for every family.
- Generate at least two variants for `race-start`, `finish`, and
  `lead-change`; one variant is enough for the first pass of the other
  families.
- Keep spoken names exactly consistent with the UI spelling.
- Avoid contractions or pronunciations that differ between clips.
- Leave 150–300 ms of clean silence at the end of name and result clips.
- Normalize loudness across the batch before committing the files.
- Record the exact source text in the manifest before wiring a clip into code.