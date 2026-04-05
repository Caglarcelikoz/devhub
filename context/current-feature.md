# Current Feature

Stats & Sidebar: Real Data Integration

## Status

Completed

## Goals

- Display stats from database data (total items, collections, favorites), keeping current design/layout
- Display system item types in sidebar with their icons, linking to /items/[typename]
- Add "View all collections" link under the collections list pointing to /collections
- For favorite collections keep star icons; for recent collections show a colored circle based on the most-used item type
- Create `src/lib/db/items.ts` with database functions (already exists — verify/extend as needed)
- Remove remaining mock-data usage from Sidebar

## Notes

- Reference: `src/lib/db/collections.ts` for DB function patterns
- Sidebar is a client component — needs data passed via props from the server layout

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
