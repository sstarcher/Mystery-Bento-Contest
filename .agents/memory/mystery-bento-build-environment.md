---
name: Mystery Bento build environment
description: The Vite build requires the same runtime path variables supplied by the managed workflow.
---

Manual production builds for Mystery Bento require both `PORT` and `BASE_PATH`; the managed web workflow supplies them automatically.

**Why:** The Vite config intentionally fails early when either value is missing, so a plain package build can look like an application failure even when the source is healthy.

**How to apply:** Prefer the managed web workflow for runtime verification. When invoking the build directly, provide the workflow port and the artifact base path.