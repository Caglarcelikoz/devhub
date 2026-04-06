# Current Feature

## Status

In Progress

## Goals

Fix quick-win issues identified by code scanner (low risk, no UI changes):

1. **Fix double DB fetch** — `getCollectionsWithMeta()` is called in both `dashboard/layout.tsx` and `dashboard/page.tsx` on every page load. Move the call to the page only and pass data via props, or deduplicate with `unstable_cache`.
2. **Slim down `getCollectionsWithMeta`** — Currently fetches full `Item` rows (including content) just to compute a count and color list. Replace with a selective `include` that only fetches `itemType.id/name/color` fields.
3. **Add missing DB index** — `items` table is missing a composite `(userId, updatedAt DESC)` index. `getRecentItems` sorts by `updatedAt` on every dashboard load. Add via Prisma migration.
4. **Cap item content in `mapItem`** — Full `item.content` is serialized into SSR HTML even though only 3 lines are visible. Truncate to 500 chars in `mapItem` to reduce payload size.

## Notes

- No UI changes required for any of these
- #3 requires a new Prisma migration (`npx prisma migrate dev`)
- All other fixes are code-only

## History

<!-- Keep this updated. Earliest to latest -->

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
