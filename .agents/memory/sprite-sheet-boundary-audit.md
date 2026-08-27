---
name: Sprite sheet boundary audit
description: Non-obvious risks when deriving transparent animation frames from horizontal sprite sheets.
---

When extracting animation frames from a horizontal sheet, a nominal cell boundary may cut through a pose or include pixels from the neighboring pose.

**Why:** Rollo’s raised hand crossed the nominal frame boundary, and a derivative with an opaque canvas made a single frame render black. Dimension-only checks did not catch either issue.

**How to apply:** Inspect source-sheet edge continuity and a rendered contact sheet for every frame set before tuning CSS viewport offsets. Confirm transparent corners, complete silhouettes, and a shared baseline at the target display sizes.