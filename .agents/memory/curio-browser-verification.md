---
name: Curio browser verification
description: Durable guidance for running real-browser checks in the Mystery Bento artifact.
---

The artifact can run real browser checks without adding a browser automation dependency: the environment provides Chromium and Node exposes a WebSocket client for the Chrome DevTools Protocol.

**Why:** The web package does not include Playwright or Puppeteer, while curio layering depends on actual focus, hover, viewport cropping, and paint order rather than static CSS inspection.

**How to apply:** Start the Vite dev server with explicit `PORT` and `BASE_PATH`, launch the managed Chromium binary with a temporary profile and remote debugging, then use CDP `Runtime.evaluate`, `Input.dispatchMouseEvent`, and viewport emulation for interaction checks.