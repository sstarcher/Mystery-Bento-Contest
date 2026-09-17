---
name: Mystery Bento build environment
description: The Vite build requires the same runtime path variables supplied by the managed workflow.
---

Manual production builds for Mystery Bento require both `PORT` and `BASE_PATH`; the managed web workflow supplies them automatically.

**Why:** The Vite config intentionally fails early when either value is missing, so a plain package build can look like an application failure even when the source is healthy.

**How to apply:** Prefer the managed web workflow for runtime verification. When invoking the build directly, provide the workflow port and the artifact base path.

The browser race verifier must receive `RACE_BROWSER_URL` when the managed workflow uses a dynamically assigned Vite port.

**Why:** The verifier defaults to port 5173, while the managed workflow can expose the artifact on another local port.

**How to apply:** Read the active workflow URL from its logs and pass that URL explicitly; a timeout on the default port is not an app failure.