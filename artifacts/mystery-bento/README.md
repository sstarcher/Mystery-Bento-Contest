# Mystery Bento

Mystery Bento is a small after-hours food-stall experience. Choose morsels from the conveyor to charge the in-world Mystery Bento Meter, then watch an automated Persona Contest award a cosmetic kitchen curio.

## Run

```bash
pnpm --filter @workspace/mystery-bento run dev
```

## Hidden meter gesture

The Mystery Bento Meter has an intentionally undocumented-in-the-visual-UI long-press interaction. The meter is keyboard focusable and supports:

- Pointer or mouse press-and-hold for 1.5 seconds.
- Touch press-and-hold for 1.5 seconds.
- Enter or Space held for 1.5 seconds while the meter has focus.

Completing the hold fills the meter and starts the Persona Contest immediately. Releasing early cancels without changing progress. The interaction uses subtle in-world visual feedback and preserves keyboard focus and reduced-motion behavior.

## Long-form contest

The Persona Contest is a roughly two-minute, five-act spectator sequence: arrival, warm-up, main course, final stretch, and recap. The Skip Scene control reveals the same pre-resolved outcome without replaying the animation.

## Persistence

Meter progress, contest history, and cosmetic collectibles are stored locally in the browser. Use **Clear local memory** in the Curio Shelf or Contest Ledger to reset this browser's saved state.