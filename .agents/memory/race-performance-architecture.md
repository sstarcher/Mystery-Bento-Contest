---
name: Race performance architecture
description: Durable guidance for keeping the Mystery Bento race smooth without changing authored simulation behavior.
---

Keep continuous race motion outside React reconciliation: the live renderer
should apply panorama and runner transforms imperatively, while React updates
only for discrete stage, contact, reaction, finish, or winner changes. Sprite
cadence should read changing speed from a ref rather than restarting its timer.

**Why:** The race combines a fixed pixel canvas, large sprite sheets, authored
timing, audio handoff, and several overlay controls; reconciling that full tree
on every clock tick creates avoidable tablet frame and input pressure.

**How to apply:** Preserve the pure timeline/speed/contact helpers and preload
contract, then add regression coverage for deterministic calculations and
stable cadence whenever the live renderer changes.