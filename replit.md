# Mystery Bento

An after-hours pixel-art food stall where curious selections charge a magical Bento Meter and unlock automated persona contests.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mystery-bento/src/App.tsx` — the complete conveyor, meter, contest, collectible, and ledger experience.
- `artifacts/mystery-bento/src/index.css` — the lacquer-and-parchment visual system, pixel illustrations, and motion/reduced-motion rules.
- `artifacts/mystery-bento/README.md` — run instructions and documentation for the hidden meter gesture.

## Architecture decisions

- The first version is frontend-only; localStorage is intentional because the experience is personal and does not require accounts or a server.
- Contest outcomes are resolved once at launch with a seeded RNG so the animated, skipped, and reduced-motion paths share the same result.
- The meter long-press is implemented as a focusable progressbar with pointer and keyboard support, while its visual guidance remains intentionally hidden.

## Product

- Select one of four illustrated morsels to charge the Mystery Bento Meter by a randomized 7–16%.
- Watch a short, spectator-only Persona Contest with six original kitchen personas.
- Collect cosmetic curios and review recent winners in the Kitchen Curio Shelf and Contest Ledger.
- Progress, history, and collectibles survive reload in the same browser.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Contest completion is guarded so Skip scene and the automatic result path cannot award duplicate collectibles or ledger rows.
- Reduced-motion mode keeps the same contest result and side effects but replaces the moving race with readable staged updates.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
