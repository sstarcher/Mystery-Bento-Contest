---
name: Race performance measurement
description: Caveats and standards for interpreting the Mystery Bento browser race benchmark.
---

The browser benchmark must distinguish Resource Timing from image decode cost and avoid observing the whole document when frame sampling already captures the race phases.

**Why:** A full-document mutation observer and mislabeled resource duration can add measurement overhead and make network timing look like decode timing.

**How to apply:** Treat media resource timing as fetch/resource activity only; use a DevTools trace or explicit decode marks for decode/layout/paint attribution, and keep the benchmark observer narrow.