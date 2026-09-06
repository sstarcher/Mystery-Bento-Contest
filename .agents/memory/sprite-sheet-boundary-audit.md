---
name: Sprite sheet boundary audit
description: Non-obvious risks when deriving transparent animation frames from horizontal sprite sheets.
---

When extracting animation frames from a horizontal sheet, a nominal cell boundary may cut through a pose or include pixels from the neighboring pose.

**Why:** Rollo’s raised hand crossed the nominal frame boundary, and a derivative with an opaque canvas made a single frame render black. Dimension-only checks did not catch either issue.

**How to apply:** Inspect source-sheet edge continuity and a rendered contact sheet for every frame set before tuning CSS viewport offsets. Confirm transparent corners, complete silhouettes, and a shared baseline at the target display sizes.

Padded sprite grids can contain blank trailing cells even when their nominal dimensions look correct.

**Why:** Several cooking sheets advertised full rectangular grids but ended with empty cells, which made the animation briefly show an invisible chef.

**How to apply:** Treat occupied alpha cells as the source of truth for frame counts, and keep an automated audit for every runtime sheet.

Victory sheets may keep a square canvas while using a finer grid than other actions, with trailing-cell padding varying by persona.

**Why:** The victory artwork used 12×12 poses on a 2048px canvas, while the prior 8×8 registration combined neighboring poses and clipped the race preview.

**How to apply:** Infer each action’s grid from the authored pose cadence, measure fractional cell bounds, and record occupied-frame counts per sheet rather than copying a shared grid assumption.