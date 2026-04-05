# Current Feature

<!-- Feature Name -->

## Dashboard Collections — Real Data

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

Replace mock collection data on the dashboard with real data from Neon/Prisma.

- Create `src/lib/db/collections.ts` with data fetching functions
- Fetch collections directly in the dashboard server component
- Collection card border color derived from the most-used item type in that collection
- Show small color dots for all types present in the collection
- Keep existing design intact; no items underneath yet

## Notes

- No auth yet — hardcode demo user ID for now
- Use existing `prisma` singleton from `src/lib/prisma.ts`

## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1: ShadCN init, /dashboard route, dark mode theme, TopBar with search and new item button, sidebar/main placeholders
- Dashboard UI Phase 2: Collapsible sidebar with types list, favorite/recent collections, user avatar, ShadCN Sheet for mobile drawer, /items/[type] route
- Dashboard UI Phase 3: Stats cards, recent collections row, pinned items grid, 10 most recent items grid
- Database Phase 1: Prisma 7 ORM + Neon PostgreSQL setup, full schema with all models, initial migration, system item types seeded
- Database Phase 2: Seed script with demo user (bcryptjs), 5 collections, and 18 items across all system types
