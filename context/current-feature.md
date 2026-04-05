# Current Feature

<!-- Feature Name -->

## Dashboard Items — Real Data

## Status

In Progress

## Goals

Replace mock item data on the dashboard with real data from Neon/Prisma.

- Create `src/lib/db/items.ts` with fetching functions for pinned and recent items
- Fetch items directly in the dashboard server component
- Item card border/icon color derived from item type
- Show type badge, tags, timestamp — matching current design
- Hide pinned section entirely if no pinned items exist
- Update stats (totalItems, favoriteItems) from real data

## Notes

- No auth yet — use hardcoded demo user ID
- Tags not in schema — omit tag display for now

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1: ShadCN init, /dashboard route, dark mode theme, TopBar with search and new item button, sidebar/main placeholders
- Dashboard UI Phase 2: Collapsible sidebar with types list, favorite/recent collections, user avatar, ShadCN Sheet for mobile drawer, /items/[type] route
- Dashboard UI Phase 3: Stats cards, recent collections row, pinned items grid, 10 most recent items grid
- Database Phase 1: Prisma 7 ORM + Neon PostgreSQL setup, full schema with all models, initial migration, system item types seeded
- Database Phase 2: Seed script with demo user (bcryptjs), 5 collections, and 18 items across all system types
- Dashboard Collections: Real data from Neon/Prisma replacing mock collections; dominant-color border, type dots, live item counts
