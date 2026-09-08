---
name: Obstacle narration clocks
description: Timing rule for keeping spoken obstacle callouts aligned with the moving race.
---

Obstacle callouts and reactions must be scheduled with the same race stage clock as the obstacle they describe. Generic race-progress narration is not a safe substitute because it can fire before any visible obstacle is present.

**Why:** A callout without its `timelineStage` was interpreted as warm-up time, causing a later matchup obstacle to be announced before the first visible hazard.

**How to apply:** When adding an obstacle announcer beat, set its stage explicitly and verify the spoken order in a voice-enabled browser race.