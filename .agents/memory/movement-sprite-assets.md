---
name: Movement sprite asset pipeline
description: How the race movement sheets are kept crisp without shipping unnecessarily large source uploads.
---

Keep original uploaded movement sheets as preserved source material and use transparent, pixel-crisp reduced derivatives for the browser renderer.

**Why:** The uploads are very high resolution and bundling them directly makes the web artifact unnecessarily heavy, while the race displays each frame at a small square size. Reducing each cell preserves the silhouette and alpha channel without changing the discrete grid.

**How to apply:** When adding or replacing movement sheets, derive an appropriately sized per-cell sheet, keep its columns and rows explicit in the movement configuration, and audit alpha plus first/middle/last frame boundaries before tuning the race viewport.