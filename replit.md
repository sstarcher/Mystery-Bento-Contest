# Mystery Bento

An after-hours pixel-art food stall where curious selections charge a magical Bento Meter and unlock automated persona contests.

## Run & Operate

Mystery Bento is a frontend-only web artifact and does not require the API
server, database, accounts, or environment secrets.

- `pnpm --filter @workspace/mystery-bento run dev` — run the managed web preview
  on port 24283
- `pnpm --filter @workspace/mystery-bento run build` — build the production
  static bundle
- `pnpm --filter @workspace/mystery-bento run typecheck` — typecheck the app
- `pnpm --filter @workspace/mystery-bento run verify:curios` — verify image-only
  curio coverage and sizing
- `pnpm --filter @workspace/mystery-bento run verify:race` — verify deterministic
  race timing, momentum, and live/Track obstacle-layout synchronization
- `pnpm --filter @workspace/mystery-bento run verify:sprites` — verify movement
  and cooking sprite-sheet boundaries
- `pnpm --filter @workspace/mystery-bento run verify:assets` — verify canonical
  asset counts, imports, runtime URLs, and review-queue boundaries

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS, Lucide Icons, Radix UI primitives
- Storage: Browser-local persistence (`localStorage`)

## Where things live

- `artifacts/mystery-bento/src/App.tsx` — the complete conveyor, meter, contest, collectible, and ledger experience.
- `artifacts/mystery-bento/src/race-obstacle-layout.ts` — the shared four-checkpoint
  layout consumed by the live race and Track inspector.
- `artifacts/mystery-bento/src/index.css` — the lacquer-and-parchment visual system, pixel illustrations, and motion/reduced-motion rules.
- `artifacts/mystery-bento/README.md` — canonical run guide, player behavior,
  asset map, and image audit.
- `artifacts/mystery-bento/assets/README.md` — source-image provenance and the
  source/runtime asset boundary.
- `artifacts/mystery-bento/ANNOUNCER_PHRASES.md` — announcer audio phrase
  catalog and live-verification checklist.

## Architecture decisions

- The first version is frontend-only; localStorage is intentional because the experience is personal and does not require accounts or a server.
- Contest outcomes are resolved once at launch with a seeded RNG so the animated, skipped, and reduced-motion paths share the same result.
- The first contestant to reach the marker-derived finish threshold wins; lane
  crossing timestamps resolve order, while the visible finish handoff carries
  every lane through its serialized terminal trajectory.
- The announcer uses the contest-open clock only for the roster intro. Moving
  race narration starts from the actual starting-lantern handoff; obstacle
  callouts use right-edge entry, reactions use rendered contact, and lead
  changes compare checkpoint leaders before and after each obstacle.
- Live race obstacles and Track inspector obstacles consume one shared placement
  module and are covered by the race verification suite.
- The meter long-press is implemented as a focusable progressbar with pointer and keyboard support, while its visual guidance remains intentionally hidden.

## Product

- Select one of four illustrated morsels to charge the Mystery Bento Meter by a randomized 7–16%.
- Watch a short, spectator-only Persona Contest with twelve original kitchen personas.
- Collect cosmetic curios and review recent winners in the Kitchen Curio Shelf and Contest Ledger.
- Progress, history, and collectibles survive reload in the same browser.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Contest completion is guarded so Skip scene and the automatic result path cannot award duplicate collectibles or ledger rows.
- Reduced-motion mode keeps the same contest result and side effects but replaces the moving race with readable staged updates.
- The Track inspector is a visual review surface, not a second source of race data;
  checkpoint positions and obstacle offsets must remain in
  `race-obstacle-layout.ts`.
- Active image assets are checked into the artifact's source and public folders;
  no API or database is needed to load the experience.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
