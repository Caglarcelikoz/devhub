# Homepage Spec

## Overview

Convert the marketing prototype at `prototypes/homepage/` into the actual Next.js app homepage at `/` (i.e. `src/app/page.tsx`). Replace the current root page (which redirects to `/dashboard`) — authenticated users will still be sent to `/dashboard` via middleware, so unauthenticated users land here.

## Route & File Structure

```
src/app/
  page.tsx                          # Server component — root layout for homepage
  (home)/
    _components/
      Navbar.tsx                    # Server component (links only, no state)
      NavbarClient.tsx              # 'use client' — scroll opacity class toggle
      HeroSection.tsx               # Server component wrapper
      ChaosStage.tsx                # 'use client' — rAF physics animation
      DashboardMockup.tsx           # Server component — static HTML mockup
      FeaturesSection.tsx           # Server component
      AiSection.tsx                 # Server component
      PricingSection.tsx            # Server component wrapper
      PricingToggle.tsx             # 'use client' — monthly/yearly toggle state
      CtaSection.tsx                # Server component
      Footer.tsx                    # Server component
```

## Sections

### 1. Navbar

**Component:** `Navbar.tsx` (server) + `NavbarClient.tsx` (client)

- Logo (SVG + "devhub" text) — links to `/`
- Nav links: "Features" (`#features`), "Pricing" (`#pricing`)
- CTA: "Sign In" ghost button → `/sign-in`, "Get Started" primary button → `/register`
- Fixed position, full-width
- `NavbarClient` adds/removes a `scrolled` class on `window.scroll > 24` for background opacity transition
- Use Tailwind for all styling; no separate CSS file

### 2. Hero Section

**Component:** `HeroSection.tsx` (server) — contains `ChaosStage` (client) and `DashboardMockup` (server)

Layout: two columns on `lg+`, stacked on mobile.

**Left column — headline:**
- Eyebrow: "For developers who ship a lot of code"
- H1: "Stop Losing Your **Developer Knowledge**" (gradient text on the second line)
- Subtext from prototype
- Buttons: "Start for Free →" → `/register`, "See how it works" → `#features`

**Right column — visual:**
- Left panel: "Your knowledge today…" label + `ChaosStage`
- Arrow (SVG with gradient, rotates 90° on mobile)
- Right panel: "…with Devhub" label + `DashboardMockup`

**ChaosStage** (`'use client'`):
- Port the `initChaos` + `chaosTick` rAF physics from `prototypes/homepage/script.js` exactly
- Icons: Notion, GitHub, Slack, VS Code, Browser, Terminal, Text file, Bookmark (same labels/colors as prototype)
- Mouse repulsion on `mousemove` within the stage container
- Use `useEffect` for initialization and `useRef` for the stage div and animation frame ID
- Cancel `requestAnimationFrame` on unmount

**DashboardMockup** (server):
- Static HTML mockup (sidebar + item cards) matching the prototype

### 3. Features Section

**Component:** `FeaturesSection.tsx` (server)

- Section id: `features`
- Heading: "A home for everything you build"
- Subtext: "Seven knowledge types — one place to search them all."
- 6-card grid (2 columns on `md`, 3 on `lg`), each card has:
  - Icon (use Lucide React icons matching the type: `Code`, `MessageSquare`, `Terminal`, `FileText`, `Search`, `Folder`)
  - Title, description (from prototype)
  - Accent color border/icon tint per type (match prototype colors)
- Use shadcn `Card` component for each feature card

### 4. AI Section

**Component:** `AiSection.tsx` (server)

- Two-column layout (`lg+`): text left, code editor mockup right
- Left: Pro badge, heading, description, bullet list with check icons (Lucide `Check`)
- Right: Static code editor mockup (macOS window dots, filename `useDebounce.ts`, syntax-highlighted code block, AI tags bar at bottom)
  - Replicate the prototype's editor UI using Tailwind — no Monaco here, just styled `<pre>`
  - Tags: `typescript`, `react`, `hooks`, `debounce`, `performance`

### 5. Pricing Section

**Component:** `PricingSection.tsx` (server) + `PricingToggle.tsx` (client)

- Section id: `pricing`
- Heading: "Simple, honest pricing"
- `PricingToggle` manages `isYearly` state and renders the billing toggle switch + both plan cards
- Free plan: $0 forever, features list with check/x icons
- Pro plan: $8/month or $72/year (toggle switches), "Most Popular" badge, blue accent
- Buttons:
  - Free: "Get Started Free" → `/register`
  - Pro: "Start Pro Trial" → `/register`

### 6. CTA Section

**Component:** `CtaSection.tsx` (server)

- Heading: "Ready to Organize Your Knowledge?"
- Subtext from prototype
- Button: "Get Started Free →" → `/register`
- Dark card with subtle border, centered layout

### 7. Footer

**Component:** `Footer.tsx` (server)

- Logo + tagline
- Four columns: Product, Account, Legal (+ one for brand)
- Product links: Features (`#features`), Pricing (`#pricing`) — Changelog/Roadmap links are `#` placeholders
- Account links: Sign In → `/sign-in`, Register → `/register`, Dashboard → `/dashboard`, Profile → `/profile`
- Legal: Privacy Policy, Terms of Service — `#` placeholders
- Bottom bar: "© {year} Devhub. All rights reserved." — use `new Date().getFullYear()` in a server component

## Scroll Reveal

Port the `IntersectionObserver` reveal pattern from the prototype as a lightweight client component `RevealWrapper.tsx` (`'use client'`). Wraps children and adds a `visible` CSS class when scrolled into view. Use it around section content that needs the fade-up animation.

## Styles

- Dark background (`#09090b` / zinc-950) matching the rest of the app
- All styling via Tailwind CSS v4 — no separate `.css` file
- Gradient text on hero H1: `bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent`
- Type accent colors from `ITEM_TYPE_COLORS` in `src/lib/constants/item-types.ts`
- Fonts: Inter (already loaded) for body; JetBrains Mono for code blocks (add to `layout.tsx` if not already present)

## Auth-aware Navbar (optional enhancement)

If a session is available server-side, swap the "Sign In / Get Started" CTA for a "Go to Dashboard →" button. Fetch session in the server `Navbar.tsx` using `auth()`.

## Links Summary

| Label | Destination |
|---|---|
| Sign In | `/sign-in` |
| Get Started / Register | `/register` |
| Go to Dashboard | `/dashboard` |
| Profile | `/profile` |
| Features anchor | `#features` |
| Pricing anchor | `#pricing` |
| Everything else (Changelog, Roadmap, Legal) | `#` placeholder |

## Notes

- Keep each component under ~100 lines where possible
- No mock data files — all content is hardcoded in the components (it's marketing copy)
- The existing root `src/app/page.tsx` likely redirects to `/dashboard`; replace it entirely
- Middleware already redirects authenticated users to `/dashboard`, so no auth check needed in the page itself (except the optional navbar enhancement)
