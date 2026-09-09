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

Fall movement sheets are also one-shot reactions: they must finish one complete cycle before the runner resumes its gait, even if the obstacle contact window ends first.

**Why:** Returning to run as soon as contact ends truncates the authored fall and makes the reaction look broken; reduced-motion playback must not leave the runner stuck in the fall state.

**How to apply:** Hold the active fall key until its final frame, then hand off to the current gait; in reduced-motion mode, advance directly to the final fall frame so the handoff still completes.

Resolved race reactions are sprite-driven rather than CSS-transform-driven: the conceptual reaction label may remain distinct for narration, but only negative obstacle outcomes use the fall sheet, freeze on their grounded final frame, and the winner uses a looping victory sheet after the finish; victory must cancel any still-held fall immediately.

**Why:** CSS dodge, slide, duck, stumble, weave, and surge transforms made the race look like unrelated wobble effects and could fight the authored sprite silhouettes.

**How to apply:** Keep `getRaceRunnerReaction` for deterministic narrative labels and announcer copy, map only `slow`/`reroute` visual outcomes to `fall`, let `clear`/`surge` keep their normal gait, reset fall/victory playback with stable handoff keys, cancel a held fall when the finish resolves a winner, and reserve portraits for cards or missing-asset fallback only.

Any narration that describes a visible reaction must share the renderer's action mapping: jump narration must select a one-shot jump sheet, then return to the normal gait after the authored frames complete.

**Why:** A spoken “jumps over it” line paired with an unchanged run silhouette breaks the cause-and-effect story even when the underlying encounter result is correct.

**How to apply:** Derive the visual action from the same resolved reaction used for narration, and browser-check that a jump reaction renders `data-movement-action="jump"` at least once before completing.

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

Contest audio uses two anchored clocks: the contest-open clock for roster intro beats, then the actual race-start handoff clock for moving-race and winner beats; visual motion remains independent of clip readiness.

**Why:** Intro narration describes the lineup before motion, while hazard, lead-change, and winner narration must stay aligned to rendered race events even when the intro handoff finishes earlier or later than its budget.

**How to apply:** Anchor intro beats to contest open, anchor obstacle entry/reaction, lead-change, finish-in-sight, and winner beats to the race-start timestamp or resolved finish crossing, keep the queue serialized with the minimum gap, and reset only the audio session when Skip Scene jumps directly to the finish.

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

Obstacle callouts should announce the rendered obstacle's arrival at the viewport's right edge only when the first runner has at least one second before contact; reaction narration should remain attached to the first runner contact.

**Why:** Spectators need useful advance notice of an approaching hazard, while a callout with less than one second of warning sounds late and the reaction line should still describe the actual encounter rather than the obstacle's entrance.

**How to apply:** Schedule the reusable obstacle callout from the scrolling world-track entry point, then schedule the resolved reaction/result as a separate contact beat. Include shared horizontal obstacle offsets in the entry calculation.

Rendered obstacle offsets must be shared by entry timing, contact solving, and live contact anchors; obstacle callouts and reactions should retry around optional announcer lines instead of being dropped.

**Why:** A right-shifted hazard can otherwise trigger its reaction before the artwork arrives, while serialized stage or pace clips can erase a required callout; reduced motion also needs explicit spacing for multiple finale hazards.

**How to apply:** Keep obstacle beats ahead of optional narration, derive normal contact from the adjusted rendered anchor, and give reduced-motion finale hazards separate staged slots before the finish.

Obstacle speed effects should remain visibly consequential across the next race beat, not resolve almost immediately after contact.

**Why:** Short, mild windows made the three runners visually bunch together for most of the course and weakened the readable cause-and-effect of hazards.

**How to apply:** Tune the shared continuous speed model before changing per-obstacle logic; preserve multi-second slow/reroute/surge windows and assert both mid-impact separation and finish separation in the deterministic speed tests.

Meter charging and contest launch are separate actions: food selections and sustained holds may fill the meter, but only a distinct click on an already-full meter may launch the contest.

**Why:** Filling the meter should feel like preparation, while the explicit meter click gives the player control over when the race begins.

**How to apply:** Keep a short hold-arming delay before progressive charging, preserve the full-meter state after food or hold completion, suppress the release-generated click from a hold, and require a later full-meter click to queue the contest.
