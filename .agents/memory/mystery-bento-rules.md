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