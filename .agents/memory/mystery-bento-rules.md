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

Visual spectacle should always have a readable staged fallback when reduced motion is enabled.

**Why:** The belt, item splash, and contest race are part of the story but must not be required for understanding what happened.

**How to apply:** Keep the important item, race stage, and winner state in the DOM and use CSS motion only to amplify those states.

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

Chef videos should preserve their native aspect ratio and use a proportion-matched fallback poster; uploaded MP4s may contain an opaque transparency-checkerboard background.

**Why:** Stretching a tall still into a landscape video box makes the chef look distorted, while a checkerboard baked into the source will become a visible scene rectangle during playback.

**How to apply:** Use contain-style video rendering and a correctly framed poster for loading/autoplay fallback, and key or replace the source background before treating the video as a final transparent composite.