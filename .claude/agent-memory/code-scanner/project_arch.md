---
name: DevHub Architecture Snapshot (code-scanner)
description: Key architectural decisions, patterns, and anti-patterns found during the initial audit
type: project
---

DevHub is in early development (Dashboard UI + DB layer only — no auth, no API routes, no Server Actions yet).

**Why:** Project is being built incrementally per the project spec.
**How to apply:** Do not flag missing features (auth gating, API routes, Server Actions) as issues — only flag what is actually in the code and broken/risky.

## Known intentional patterns
- `DEMO_USER_ID` hardcoded in `dashboard/page.tsx`, `dashboard/layout.tsx`, and `items/[type]/layout.tsx` — intentional placeholder until auth is wired up. All three files have a TODO comment noting this.
- `src/lib/mock-data.ts` still exists but is no longer imported anywhere in the app — dead code.
- `datasource db` in `prisma/schema.prisma` has no `url` field — connection string passed via PrismaPg adapter at runtime. Correct for Prisma 7 pg adapter pattern.

## Recurring issues found
- Duplicate layout code: `dashboard/layout.tsx` and `items/[type]/layout.tsx` are structurally identical.
- Double fetch: dashboard layout + page both independently call `getCollectionsWithMeta`.
- `getCollectionsWithMeta` does deep nested include + JS-side aggregation — N+1 risk at scale.
- `mock-data.ts` is unused dead code.
- No middleware.ts — all routes publicly accessible.
- TopBar search/toggle buttons are purely decorative (no handlers).
