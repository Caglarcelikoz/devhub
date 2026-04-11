# Current Feature

## Status

Not Started

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

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
- Code Scanner Quick Wins: React cache() deduplication for getCollectionsWithMeta, slim collections query (select only itemType fields), composite (userId, updatedAt DESC) index migration on items table, item content capped at 500 chars in mapItem
- Auth Setup Phase 1: NextAuth v5 with GitHub OAuth; split config pattern for edge compatibility; Prisma adapter with JWT strategy; proxy.ts protecting /dashboard/*; Session extended with user.id
- Auth Credentials Phase 2: Credentials provider with bcrypt validation; edge-safe placeholder in auth.config.ts; POST /api/auth/register endpoint with validation, duplicate check, and password hashing
- Auth UI Phase 3: Custom /sign-in page (email/password + GitHub OAuth); custom /register page (auto sign-in after registration); reusable UserAvatar component (GitHub image or initials); sidebar bottom with real session user, avatar dropdown with Profile link and Sign out; dashboard layout uses real session user ID; proxy redirects to /sign-in; NextAuth pages config updated
- Email Verification: Resend integration; verification email sent on register; /verify-email holding page; GET /api/auth/verify-email validates token and sets emailVerified; credentials sign-in blocked for unverified users; /sign-in shows success banner after verification; dashboard/page.tsx uses real session userId (DEMO_USER_ID removed)
- Email Verification Flag: ENABLE_EMAIL_VERIFICATION env var (false by default); src/lib/flags.ts as single source of truth; register route sets emailVerified immediately when disabled and skips email; RegisterForm auto-signs in when disabled; auth.ts only blocks unverified users when flag is on
- Forgot Password: "Forgot password?" link on sign-in page; /forgot-password page sends reset email via Resend; /reset-password?token= page validates token, updates hashed password, clears token; uses VerificationToken model with password-reset: prefix; 1-hour expiry; success banner on /sign-in after reset; credentials-only users (GitHub OAuth users without a password are skipped silently)
- Profile Page: /profile route with dashboard shell layout; account card (avatar, name, email, join date, sign-in method); usage card (total items, collections, per-type breakdown with colored dots); change password card (email users only, hidden for GitHub OAuth); danger zone with delete account confirmation dialog (Base UI AlertDialog); 2-column grid layout on desktop; API routes for change-password and delete-account
- Rate Limiting for Auth: Upstash Redis + @upstash/ratelimit sliding window; reusable src/lib/rate-limit.ts; register (3/h IP), forgot-password (3/h IP), reset-password (5/15m IP), resend-verification (3/15m IP+email) protected via route-level checks; login protected via /api/auth/login-check pre-flight (IP+email, 5/15m) called before signIn(); new /api/auth/resend-verification route; verify-email page upgraded with ResendVerificationButton client component; fail-open if Upstash unavailable; 429 + Retry-After header; UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars
- Items List View: /items/[type] route fully implemented; getItemsByType() added to items.ts; layout updated to use real session auth; page shows typed header with icon + count, 2-column grid on md+, empty state with icon; ItemsGrid updated with top accent bar, lift+shadow hover, left-bar content preview; same card used on dashboard and items list
