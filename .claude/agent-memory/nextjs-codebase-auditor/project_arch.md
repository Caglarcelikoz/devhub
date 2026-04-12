---
name: DevHub Architecture Snapshot
description: Key architectural patterns, security measures, and recurring issues found in the first full audit
type: project
---

DevHub is an early-to-mid-stage Next.js 16 / React 19 app with Prisma 7, NextAuth v5, Upstash Redis rate limiting, and S3 (Cloudflare R2-compatible) file storage.

**Why:** Captured during the first full codebase audit to accelerate future reviews.

**How to apply:** Use as baseline context when doing targeted audits or reviewing new features.

## Auth & Security

- Middleware (`src/proxy.ts`) only protects `/dashboard/**`. `/items/**` and `/profile/**` are protected via layout-level `auth()` checks — adequate but not middleware-enforced.
- Rate limiting via Upstash Redis covers all auth endpoints (register, login-check, forgot-password, reset-password, resend-verification). Fails open when Redis is unavailable.
- Server Actions (`src/actions/items.ts`) correctly call `auth()` and validate with Zod before calling DB layer.
- API route `GET /api/items/[id]/download` correctly checks auth AND ownership via `getItemById(id, userId)`.
- `callbackUrl` in `SignInForm` is used directly in `router.push(callbackUrl)` — open redirect risk if not validated.
- Favorite/Pin actions are UI-only in ItemDrawer (buttons render but have no onClick handlers). Not a security issue but broken UX.
- Delete account route (`/api/profile/delete-account`) does NOT delete S3 files for items before deleting the user record.

## Performance

- `getCollectionsWithMeta` is wrapped in React `cache()` — good deduplication across the same request.
- `getItemsByType` has no pagination — loads all items for a type in one query.
- `getRecentItems` defaults to limit 10 — fine.
- Download route buffers entire file into memory before streaming — problem for large files.
- `ImageThumbnailCard` uses a plain `<img>` tag hitting the proxy download endpoint for every thumbnail on the images page — N requests with full file buffering per render.
- `auth.ts` JWT callback hits the DB on every request to keep name/image fresh — adds latency per request.

## Code Quality

- `src/lib/mock-data.ts` is still in the codebase but not imported anywhere — dead file.
- `ActionResult<T>` type is defined twice: once in `src/actions/items.ts` (line 106) and once implicitly expected in consumers. Should be extracted to `src/types/`.
- `ItemDrawer` fetches data via `fetch()` inside the render phase using a `prevItemId` state comparison pattern — this is a non-idiomatic React pattern (side effects in render body). Should use `useEffect`.
- Favorite and Pin buttons in ItemDrawer have no `onClick` handlers — they are purely decorative/broken.
- Duplicate layout code: `dashboard/layout.tsx`, `items/[type]/layout.tsx`, and `profile/layout.tsx` are near-identical.

## Schema / DB

- Tags are global (no `userId`) — tags created by one user are visible/connectable by all users. Acceptable for now but worth noting before launch.
- No index on `Tag.name` beyond the unique constraint — adequate.
- `Item` has `@@index([userId])`, `@@index([itemTypeId])`, `@@index([createdAt])`, `@@index([userId, updatedAt(sort: Desc)])` — well-indexed.
