---
name: Movement sprite asset pipeline
description: How the race movement sheets are kept crisp without shipping unnecessarily large source uploads.
---

Keep original uploaded movement sheets as preserved source material and use transparent, pixel-crisp reduced derivatives for the browser renderer.

**Why:** The uploads are very high resolution and bundling them directly makes the web artifact unnecessarily heavy, while the race displays each frame at a small square size. Reducing each cell preserves the silhouette and alpha channel without changing the discrete grid.

**How to apply:** When adding or replacing movement sheets, derive an appropriately sized per-cell sheet, keep its columns and rows explicit in the movement configuration, and audit alpha plus first/middle/last frame boundaries before tuning the race viewport.

Race scenes should preload every action sheet before the first movement stage and preserve normalized animation phase when switching actions.

**Why:** Lazy-loading a jump or run sheet at the moment an obstacle appears can look like a blink, while resetting to frame zero makes otherwise continuous movement visibly snap.

**How to apply:** Preload idle, walk, run, and jump sources during the race overlay setup, then map the current frame proportionally to the next sheet's frame count instead of restarting the animation.

Multi-object reference sheets should become independent transparent square derivatives when each object is meant to be a separate collectible.

**Why:** The Curio Shelf earns, labels, positions, and previews items individually; keeping a composite sheet would make the collection state and shelf placement ambiguous.

**How to apply:** Preserve the uploaded sheet as reference material, crop each object tightly, remove only the connected exterior background, and register each derivative as its own image-backed collectible.