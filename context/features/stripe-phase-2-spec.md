# Stripe Integration - Phase 2: Webhooks, Feature Gating & UI

## Overview

Wire up the Stripe webhook handler, enforce free tier limits and Pro-only gates in server actions and the upload route, and add the Billing section to the settings page.

## Requirements

- Create webhook handler at `POST /api/webhooks/stripe`
- Gate `createItem` — block file/image types for free users; block at 50-item limit
- Gate `createCollection` — block at 3-collection limit for free users
- Gate upload route — block file uploads for free users
- Add `BillingSettings` component to settings page showing current plan, usage, and upgrade/manage actions
- Show "Welcome to DevStash Pro!" toast after successful checkout redirect

## Prerequisites

- Phase 1 complete (`src/lib/stripe.ts`, `src/lib/usage.ts`, session `isPro`, checkout + portal routes)
- Stripe CLI installed locally for webhook testing

## Stripe CLI Setup (local webhook testing)

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the printed webhook signing secret → set as STRIPE_WEBHOOK_SECRET in .env.local
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/api/webhooks/stripe/route.ts` | Handle Stripe webhook events |
| `src/components/settings/billing-settings.tsx` | Billing UI on settings page |

## Files to Modify

| File | Changes |
|------|---------|
| `src/actions/items.ts` | Add Pro type check + item count limit in `createItem` |
| `src/actions/collections.ts` | Add collection count limit in `createCollection` |
| `src/app/api/upload/route.ts` | Add Pro check before allowing uploads |
| `src/app/settings/page.tsx` | Import and render `BillingSettings`; fetch usage data |

## Implementation Notes

### Webhook Route (`POST /api/webhooks/stripe`)

- Read raw body with `request.text()` — do NOT parse as JSON (signature verification requires raw bytes)
- Verify signature with `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)`
- Return 400 on missing or invalid signature
- Handle these events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `isPro: true`, store `stripeCustomerId` + `stripeSubscriptionId` |
| `invoice.paid` | Set `isPro: true` (ensures renewal keeps Pro active) |
| `invoice.payment_failed` | Log warning only — Stripe retries; do not downgrade yet |
| `customer.subscription.updated` | Set `isPro` based on status: `active`/`trialing` → `true`, otherwise `false` |
| `customer.subscription.deleted` | Set `isPro: false`, clear `stripeSubscriptionId` |

- Look up user by `stripeCustomerId` with `updateMany` (idempotent, safe for duplicate events)
- `checkout.session.completed` uses `session.metadata.userId` to update the specific user

### Feature Gating — `src/actions/items.ts`

Add two checks at the top of `createItem` after the auth check:

```typescript
// Block file/image types for free users
if (['file', 'image'].includes(input.typeName) && !session.user.isPro) {
  return { success: false, error: 'File and image uploads require a Pro subscription.' };
}

// Block at item limit for free users
const allowed = await canCreateItem(session.user.id, session.user.isPro);
if (!allowed) {
  return { success: false, error: 'You have reached the free tier limit of 50 items. Upgrade to Pro for unlimited items.' };
}
```

### Feature Gating — `src/actions/collections.ts`

Add one check at the top of `createCollection` after the auth check:

```typescript
const allowed = await canCreateCollection(session.user.id, session.user.isPro);
if (!allowed) {
  return { success: false, error: 'You have reached the free tier limit of 3 collections. Upgrade to Pro for unlimited collections.' };
}
```

### Feature Gating — `src/app/api/upload/route.ts`

After the existing auth check, query `isPro` directly from the DB (the upload route may not have the enriched JWT session):

```typescript
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
});
if (!user?.isPro) {
  return NextResponse.json({ error: 'File uploads require a Pro subscription.' }, { status: 403 });
}
```

### `BillingSettings` Component

Client component at `src/components/settings/billing-settings.tsx`.

Props:
```typescript
interface BillingSettingsProps {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}
```

Behaviour:
- Free user: shows `{itemCount}/50 items · {collectionCount}/3 collections`, two upgrade buttons ("Upgrade $8/mo", "Upgrade $72/yr (save 25%)")
- Pro user: shows Pro badge and a "Manage Billing" button
- Upgrade buttons POST `{ plan: 'monthly' | 'yearly' }` to `/api/stripe/checkout`, then redirect to returned URL
- Manage Billing button POSTs to `/api/stripe/portal`, then redirects to returned URL
- Loading spinners on buttons while requests are in-flight
- Sonner toast on any fetch error

### Settings Page (`src/app/settings/page.tsx`)

```typescript
import BillingSettings from '@/components/settings/billing-settings';
import { getUserUsage } from '@/lib/usage';

const usage = await getUserUsage(user.id, session.user.isPro ?? false);

// Render between EditorSettings and AccountSettings:
<BillingSettings
  isPro={session.user.isPro ?? false}
  itemCount={usage.itemCount}
  collectionCount={usage.collectionCount}
/>
```

### Upgraded Toast (`?upgraded=true`)

In `BillingSettings` (or a sibling client component on the settings page):

```typescript
const searchParams = useSearchParams();
useEffect(() => {
  if (searchParams.get('upgraded') === 'true') {
    toast.success('Welcome to DevStash Pro!');
    window.history.replaceState({}, '', '/settings');
  }
}, [searchParams]);
```

## Manual Testing (requires Stripe CLI)

### Checkout Flow
- [ ] Click "Upgrade $8/mo" → redirects to Stripe Checkout
- [ ] Click "Upgrade $72/yr" → redirects to Stripe Checkout
- [ ] Complete payment with test card `4242 4242 4242 4242`
- [ ] Redirected to `/settings?upgraded=true`
- [ ] "Welcome to DevStash Pro!" toast appears
- [ ] Plan badge shows "Pro"
- [ ] After page reload, `session.user.isPro` is `true`

### Webhook Events
- [ ] `checkout.session.completed` → sets `isPro: true`, stores `stripeCustomerId` + `stripeSubscriptionId`
- [ ] `invoice.paid` → keeps `isPro: true`
- [ ] `invoice.payment_failed` → logs warning, no downgrade
- [ ] `customer.subscription.deleted` → sets `isPro: false`, clears `stripeSubscriptionId`
- [ ] `customer.subscription.updated` with `status: active` → keeps `isPro: true`
- [ ] `customer.subscription.updated` with `status: canceled` → sets `isPro: false`
- [ ] Invalid webhook signature → returns 400, no DB changes

### Customer Portal
- [ ] Pro user clicks "Manage Billing" → redirects to Stripe portal
- [ ] Can view invoices, cancel subscription, switch plan
- [ ] Returns to `/settings` after portal

### Feature Gating
- [ ] Free user cannot create a File or Image item (error toast)
- [ ] Free user blocked at 50 items (error toast)
- [ ] Free user blocked at 3 collections (error toast)
- [ ] Free user upload route returns 403
- [ ] Pro user has no limits — can create items, collections, and upload files

### Stripe Test Cards

| Card | Scenario |
|------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 3220` | 3D Secure required |
