# Current Feature: Auth Setup - NextAuth + GitHub Provider

## Status

In Progress

## Goals

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- Set up split auth config pattern for edge compatibility
- Add GitHub OAuth provider
- Protect `/dashboard/*` routes using Next.js middleware (proxy)
- Redirect unauthenticated users to sign-in
- Use NextAuth's default sign-in page (no custom pages)

## Notes

- Use `next-auth@beta` (not `@latest` which installs v4)
- Split config pattern: `src/auth.config.ts` (edge-safe, providers only) + `src/auth.ts` (full config with Prisma adapter)
- Proxy file must be at `src/proxy.ts` (same level as `app/`)
- Use named export: `export const proxy = auth(...)` — not default export
- Use `session: { strategy: 'jwt' }` with split config pattern
- Extend Session type with `user.id` via `src/types/next-auth.d.ts`
- Use Context7 to verify the newest NextAuth v5 config and conventions

### Files to Create

1. `src/auth.config.ts` — Edge-compatible config (providers only, no adapter)
2. `src/auth.ts` — Full config with Prisma adapter and JWT strategy
3. `src/app/api/auth/[...nextauth]/route.ts` — Export handlers from auth.ts
4. `src/proxy.ts` — Route protection with redirect logic
5. `src/types/next-auth.d.ts` — Extend Session type with user.id

### Environment Variables Needed

```
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

### Testing

1. Go to `/dashboard` — should redirect to sign-in
2. Click "Sign in with GitHub"
3. Verify redirect back to `/dashboard` after auth

## History

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1: ShadCN init, /dashboard route, dark mode theme, TopBar with search and new item button, sidebar/main placeholders
- Dashboard UI Phase 2: Collapsible sidebar with types list, favorite/recent collections, user avatar, ShadCN Sheet for mobile drawer, /items/[type] route
- Dashboard UI Phase 3: Stats cards, recent collections row, pinned items grid, 10 most recent items grid
- Database Phase 1: Prisma 7 ORM + Neon PostgreSQL setup, full schema with all models, initial migration, system item types seeded
- Database Phase 2: Seed script with demo user (bcryptjs), 5 collections, and 18 items across all system types
- Dashboard Collections: Real data from Neon/Prisma replacing mock collections; dominant-color border, type dots, live item counts
- Dashboard Items: Real pinned and recent items from database; type-colored borders, tags, timestamps; all stats live; mock-data.ts fully removed from dashboard
- Stats & Sidebar: Real item types with counts in sidebar; favorite collections keep star icons; recent collections show dominant-color dot; "View all collections" link added; getItemTypesWithCount() added to items.ts; all mock-data removed from Sidebar
- Pro Badge Sidebar: Subtle ShadCN PRO badge added to "file" and "image" item types in the sidebar; hidden when collapsed
- Code Scanner Quick Wins: React cache() deduplication for getCollectionsWithMeta, slim collections query (select only itemType fields), composite (userId, updatedAt DESC) index migration on items table, item content capped at 500 chars in mapItem
