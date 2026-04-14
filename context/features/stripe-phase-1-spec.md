# Stripe Integration - Phase 1: Core Infrastructure

## Overview

Install the Stripe SDK and build the billing foundation: SDK singleton, usage limit utilities, `isPro` in the NextAuth session, and the checkout + customer portal API routes.

## Requirements

- Install `stripe` npm package (`npm install stripe`)
- Create Stripe SDK singleton at `src/lib/stripe.ts`
- Create usage limit utilities at `src/lib/usage.ts` with unit tests
- Add `isPro: boolean` to NextAuth Session and JWT types
- Update JWT callback in `src/auth.ts` to always sync `isPro` from DB
- Create `POST /api/stripe/checkout` — creates a Stripe Checkout session
- Create `POST /api/stripe/portal` — creates a Stripe Customer Portal session

## Stripe Dashboard Setup (before writing code)

1. Create product: **DevStash Pro** with description
2. Create two prices:
   - Monthly: $8.00 USD recurring → copy Price ID to `STRIPE_PRICE_ID_MONTHLY`
   - Yearly: $72.00 USD recurring → copy Price ID to `STRIPE_PRICE_ID_YEARLY`
3. Configure Customer Portal (Settings → Billing → Customer Portal): enable invoice history, cancellation, plan switching, payment method management
4. Create webhook endpoint: `https://your-domain.com/api/webhooks/stripe`, listen for `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` → copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Environment Variables

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe SDK singleton |
| `src/lib/usage.ts` | Free tier usage limit checks |
| `src/app/api/stripe/checkout/route.ts` | Create Stripe Checkout sessions |
| `src/app/api/stripe/portal/route.ts` | Create Stripe Customer Portal sessions |

## Files to Modify

| File | Changes |
|------|---------|
| `src/auth.ts` | Make JWT callback `async`; always sync `isPro` from DB |
| `src/types/next-auth.d.ts` | Add `isPro: boolean` to Session user and JWT interfaces |

## Implementation Notes

### `src/lib/stripe.ts`

```typescript
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });
```

### `src/lib/usage.ts`

Free tier limits:

```typescript
export const FREE_TIER_LIMITS = {
  MAX_ITEMS: 50,
  MAX_COLLECTIONS: 3,
} as const;
```

Three exports:
- `getUserUsage(userId, isPro)` → `{ itemCount, collectionCount, canCreateItem, canCreateCollection }`
- `canCreateItem(userId, isPro)` → boolean (quick check, no full fetch)
- `canCreateCollection(userId, isPro)` → boolean (quick check)

Pro users skip the DB count query entirely and return `true` immediately.

### Auth Changes (`src/auth.ts`)

Make the JWT callback `async` and sync `isPro` on every token refresh so Stripe webhook-triggered DB changes are picked up on the next page load without needing `trigger === "update"`:

```typescript
async jwt({ token, user }) {
  if (user?.id) token.id = user.id;
  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { isPro: true },
    });
    token.isPro = dbUser?.isPro ?? false;
  }
  return token;
},
session({ session, token }) {
  if (token?.id && session.user) {
    session.user.id = token.id as string;
    session.user.isPro = token.isPro ?? false;
  }
  return session;
},
```

> Trade-off: one indexed PK lookup per session validation. Acceptable — the query returns a single boolean on the primary key.

### Checkout Route (`POST /api/stripe/checkout`)

- Require auth; 401 if missing
- Body: `{ plan: 'monthly' | 'yearly' }` — server maps to price ID (price IDs stay server-side only, never `NEXT_PUBLIC_`)
- Get or create Stripe customer; persist `stripeCustomerId` on user
- Create Checkout Session with `mode: 'subscription'`
- `success_url`: `${NEXT_PUBLIC_APP_URL}/settings?upgraded=true`
- `cancel_url`: `${NEXT_PUBLIC_APP_URL}/settings`
- Return `{ url }` to client

### Portal Route (`POST /api/stripe/portal`)

- Require auth; 401 if missing
- Look up `stripeCustomerId`; return 400 if none found
- Create Billing Portal session with `return_url: ${NEXT_PUBLIC_APP_URL}/settings`
- Return `{ url }` to client

## Unit Tests

File: `src/lib/__tests__/usage.test.ts` — mock Prisma with `vi.mock()`.

| Test | Expected |
|------|----------|
| `getUserUsage` — free user, both counts under limits | `canCreateItem: true`, `canCreateCollection: true` |
| `getUserUsage` — free user, items at 50 | `canCreateItem: false` |
| `getUserUsage` — free user, collections at 3 | `canCreateCollection: false` |
| `getUserUsage` — Pro user, items at 50 | `canCreateItem: true` (Pro bypasses) |
| `getUserUsage` — Pro user, collections at 3 | `canCreateCollection: true` (Pro bypasses) |
| `canCreateItem` — free, under limit | `true` |
| `canCreateItem` — free, at limit | `false` |
| `canCreateItem` — Pro, at limit | `true` (no DB query called) |
| `canCreateCollection` — free, under limit | `true` |
| `canCreateCollection` — free, at limit | `false` |
| `canCreateCollection` — Pro, at limit | `true` (no DB query called) |

## Manual Testing

- Sign in and check `session.user.isPro` is `false` for a free user
- `POST /api/stripe/checkout` with `{ plan: 'monthly' }` → returns a Stripe Checkout URL
- `POST /api/stripe/portal` → returns 400 for a user without `stripeCustomerId`
- `POST /api/stripe/portal` → returns portal URL for a user with `stripeCustomerId`
- Run `npm run build` — no type errors
