---
name: Mystery Bento interaction rules
description: Durable product decisions for the Mystery Bento meter and spectator contest.
---

The Mystery Bento experience is intentionally client-only and personal: browser localStorage is the persistence boundary, not a backend account system.

**Why:** The product has no cross-user state, identity, or server-side capability; keeping state local makes the playful loop immediate and private.

**How to apply:** Preserve local persistence for meter progress, contest history, and cosmetic curios unless the product explicitly grows accounts or shared play.

Contest results must be resolved once per contest session and reused by animation, reduced-motion, and Skip scene paths.

**Why:** A skip or accessibility mode should reveal the same story the spectator would have seen, not reroll a different winner.

**How to apply:** Resolve contestants, winner, event, and collectible choice before the visual sequence begins, then guard completion side effects against duplicate calls.

Each new contest uses exactly three eligible personas and excludes the latest ledger winner from that roster.

**Why:** Keeping the previous winner out creates a clear rematch-free handoff between stories while preserving a consistent three-lane race format.

**How to apply:** Filter the most recent ledger winner before deterministic shuffling, then take three unique contestants; keep the resolved winner within that selected trio.

The race-start handoff is authoritative for when movement begins, but post-handoff runner movement is continuous rather than stage-owned; narrative stages remain presentation beats.

**Why:** A stage-driven walk/run switch made movement feel artificial: every racer walked during warm-up and ran during matchup regardless of obstacle impact. The course now travels at a stable reference pace while stat and obstacle modifiers move each runner relative to it.

**How to apply:** Serialize the roster clips first, wait one second after the last name, show the race scene during the start call, begin the race clock when that call finishes, and retain a deterministic muted fallback. Use a small speed-trait multiplier at baseline, temporary slow/surge windows after obstacle results, walk only during slow recovery, and run otherwise. Schedule winner narration only after the visual finish has crossed.

Jump movement sheets are one-shot reactions tied to an obstacle encounter; after one authored cycle the runner returns to its normal gait.

**Why:** Looping a jump sheet makes a single obstacle reaction look like repeated bouncing and disconnects the animation from the race event.

**How to apply:** Give each jump encounter a stable animation key, reset at the start of that key, stop on its final frame, and switch back to walk/run without changing the deterministic race outcome.

Resolved race reactions are sprite-driven rather than CSS-transform-driven: the conceptual reaction label may remain distinct for narration, but every non-ready obstacle reaction uses the fall sheet, freezes on its grounded final frame, and the winner uses a looping victory sheet after the finish.

**Why:** CSS dodge, slide, duck, stumble, weave, and surge transforms made the race look like unrelated wobble effects and could fight the authored sprite silhouettes.

**How to apply:** Keep `getRaceRunnerReaction` for deterministic narrative labels and announcer copy, map its visual output to `fall`, reset fall/victory playback with stable handoff keys, and reserve portraits for cards or missing-asset fallback only.

Visual spectacle should always have a readable staged fallback when reduced motion is enabled.

**Why:** The belt, item splash, and contest race are part of the story but must not be required for understanding what happened.

**How to apply:** Keep the important item, race stage, and winner state in the DOM and use CSS motion only to amplify those states.

Reduced-motion presentation may change race timing and staged positions, but it must preserve the normal path's resolved winner, finish completion, and collectible result.

**Why:** Accessibility presentation is a different view of the same contest, not a second contest resolution.

**How to apply:** Resolve the contest once before motion begins, reuse its winner/reward identity in both paths, and test each reduced stage snapshot plus the final state against that shared resolution.

The open-kitchen center is reserved for its current state: the Japanese return sign before the first contest, or the latest winner’s chef station afterward. Enlarged wall curios should remain on the side rails.

**Why:** The wall curios were scaled up for readability, which can otherwise make the central kitchen story collide with the sign or chef.

**How to apply:** Keep responsive curio placements away from the kitchen center and recheck both desktop and mobile after backdrop scale changes.

The supplied cooking-character sheet has a baked-in neutral checkerboard rather than an alpha channel; transparent sprites are needed before compositing the artwork into the restaurant scene.

**Why:** Rendering the sheet directly would expose the checkerboard as a background, especially when the winner sprite is enlarged behind the counter.

**How to apply:** Preserve the original sheet as reference and use transparent per-character derivatives for scene compositing while keeping the existing portrait assets for contest cards.

Sprite-sheet motion must change frames discretely; never interpolate the transform across the strip.

**Why:** Interpolating between frame offsets visibly slides the character and can expose neighboring poses.

**How to apply:** Use exact one-frame offsets with discrete timing, and verify the first, middle, and last poses at the final display size.

Contest audio should follow one absolute contest clock, while visual stage transitions run independently of clip readiness.

**Why:** A long, missing, or autoplay-blocked clip must never create a visible pause in the race; serialization belongs to the announcer queue, not the motion timeline.

**How to apply:** Schedule beats from the contest start timestamp, keep the queue serialized with the minimum gap, and reset only the audio session when Skip Scene jumps directly to the finish.

The race-start handoff must use the same duration-plus-gap fallback when audio is muted, missing, or blocked.

**Why:** Different fallback lengths make the visible starting-lantern state and the race clock depend on browser audio availability.

**How to apply:** Keep the final-name pause, start-announcement duration, and post-announcement gap in shared timeline helpers, and test the fallback paths against the same completion boundary.

Chef videos should preserve their native aspect ratio and use a proportion-matched fallback poster; uploaded MP4s may contain an opaque transparency-checkerboard background.

**Why:** Stretching a tall still into a landscape video box makes the chef look distorted, while a checkerboard baked into the source will become a visible scene rectangle during playback.

**How to apply:** Use contain-style video rendering and a correctly framed poster for loading/autoplay fallback, and key or replace the source background before treating the video as a final transparent composite.

Fixed-canvas shell padding must be budgeted inside the logical canvas height when the scene is rendered with CSS zoom.

**Why:** The shell’s vertical padding participates in the rendered layout, so keeping a full logical content minimum in addition to top and bottom padding creates an extra scroll range on the target tablet.

**How to apply:** For the 800px logical scene, keep the shell’s top spacing but account for its bottom spacing in the content minimum; verify both the exact 1600px target and a narrow cropped viewport after changes.

The shared curio art fit scale is `0.774`, which is a 10% reduction from the previous `0.86` scale; preserve the common multiplier instead of adding per-item size overrides.

**Why:** Curio items were visually too large, and a shared reduction keeps the shelf consistent while preserving each artwork’s proportions.

**How to apply:** Change the shared fit scale for future global curio sizing adjustments, then run the curio sizing and footprint audits plus desktop and narrow previews.

For normal-motion race reactions, visible runner/obstacle contact is the authoritative trigger; reduced-motion may use the resolved simulation checkpoint.

**Why:** The scrolling course and bounded runner projection use different coordinate systems, so a logical world-position threshold can fire while the character still looks far from the artwork.

**How to apply:** Derive contact from the rendered screen anchors for staged obstacles, keep outcomes deterministic, and retain the simulation-based fallback when motion is reduced.

Obstacle speed effects should remain visibly consequential across the next race beat, not resolve almost immediately after contact.

**Why:** Short, mild windows made the three runners visually bunch together for most of the course and weakened the readable cause-and-effect of hazards.

**How to apply:** Tune the shared continuous speed model before changing per-obstacle logic; preserve multi-second slow/reroute/surge windows and assert both mid-impact separation and finish separation in the deterministic speed tests.
