# Auth Security Review

**Last audited:** 2026-04-11

---

## Critical

_No issues found._

---

## High

### [HIGH-1] No rate limiting on login, registration, or password reset endpoints

- **Files:** `src/auth.ts` (credentials authorize), `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`
- **Issue:** None of these endpoints implement rate limiting. An attacker can:
  - Brute-force passwords on the credentials `authorize` callback with no throttling
  - Enumerate registered emails via repeated registration attempts (despite the "user already exists" check, the response timing will differ after a DB hit)
  - Spam the forgot-password endpoint to flood a victim's inbox or exhaust email quota
- **Fix:** Add rate limiting keyed by IP (and by email for forgot-password). The lightest-weight option for Next.js + Neon is [`@upstash/ratelimit`](https://github.com/upstash/ratelimit) with a free Upstash Redis instance, or the edge-compatible [`next-rate-limit`](https://github.com/nicholasgasior/next-rate-limit). Example pattern:
  ```ts
  import { Ratelimit } from '@upstash/ratelimit'
  import { Redis } from '@upstash/redis'

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  })

  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  ```

---

## Medium

### [MED-1] Token namespace collision in verify-email — password-reset tokens can verify an email

- **File:** `src/app/api/auth/verify-email/route.ts:12-27`
- **Issue:** The verify-email route does a `findUnique({ where: { token } })` with no check that `identifier` does **not** start with `password-reset:`. A valid (unexpired) password-reset token can therefore be submitted to `/api/auth/verify-email` and will successfully call `prisma.user.update({ data: { emailVerified: new Date() } })` for the email extracted from `record.identifier` — but `record.identifier` is `password-reset:user@example.com`, so the `update({ where: { email: 'password-reset:user@example.com' } })` will silently fail to find a user and Prisma will throw a "Record not found" error that is uncaught (no try/catch in this route), resulting in a 500. In its current form this does not cause account takeover, but it is a logic defect that wastes a legitimate reset token and exposes an error to the caller. The symmetric risk — using a verification token to complete a password reset — is already blocked by the `startsWith('password-reset:')` check in `reset-password/route.ts`.
- **Fix:** Add the namespace check and a try/catch:
  ```ts
  if (!record || record.identifier.startsWith('password-reset:')) {
    return NextResponse.redirect(new URL('/sign-in?error=invalid-token', request.url))
  }
  ```

### [MED-2] No password complexity requirement beyond minimum length

- **Files:** `src/app/api/auth/register/route.ts:25`, `src/app/api/auth/reset-password/route.ts:17`, `src/app/api/profile/change-password/route.ts:24`
- **Issue:** The only server-side password validation is `length >= 8`. There is no check against common passwords or complexity requirements. While NIST SP 800-63B no longer mandates complexity rules, it does recommend checking against known-compromised password lists. An 8-character all-lowercase password is highly susceptible to offline cracking if the DB is ever compromised.
- **Fix (minimum):** Increase the minimum length to 12, which NIST recommends as a reasonable floor. Optionally integrate [`zxcvbn`](https://github.com/dropbox/zxcvbn) for client-side strength feedback (the server-side check of length is sufficient for the API).

---

## Low / Informational

### [LOW-1] Profile page under /profile is not protected by the edge middleware

- **File:** `src/proxy.ts:12`
- **Issue:** The middleware matcher is `['/dashboard/:path*']`. The `/profile` route is outside `/dashboard`, so it is not covered by the edge auth check. The page itself does `const session = await auth(); if (!session?.user?.id) redirect('/sign-in')` — so unauthenticated users are correctly redirected — but this relies solely on the server component check rather than the edge middleware. This is not a vulnerability, but it means an unauthenticated request will reach the Next.js runtime and render the page partially before redirecting, which is slightly less efficient and less consistent with the rest of the auth protection strategy.
- **Fix:** Add `/profile` to the middleware matcher:
  ```ts
  matcher: ['/dashboard/:path*', '/profile/:path*'],
  ```

### [LOW-2] bcrypt cost factor of 10 is at the low end for 2026

- **Files:** `src/app/api/auth/register/route.ts:25`, `src/app/api/auth/reset-password/route.ts:33`, `src/app/api/profile/change-password/route.ts:42`
- **Issue:** All three use `bcrypt.hash(password, 10)`. Cost factor 10 was the recommended default circa 2012. Modern guidance (OWASP 2024) suggests 12 as the minimum for bcrypt. At factor 10, a modern GPU can test ~100k hashes/s; at 12, that drops to ~25k. The difference is meaningful if the database is ever exfiltrated.
- **Fix:** Change to `bcrypt.hash(password, 12)` in all three files. The performance impact on a serverless function is negligible (~200ms vs ~50ms per hash).

---

## Passed Checks

- ✅ **Token entropy** — Email verification and password reset tokens use `randomBytes(32).toString('hex')`, producing 256 bits of entropy. This is cryptographically secure and far above the OWASP minimum.
- ✅ **Token expiration is enforced server-side** — Both verify-email (`route.ts:18`) and reset-password (`route.ts:27`) compare `record.expires < new Date()` before acting. Expired tokens are deleted.
- ✅ **Password reset tokens are single-use** — `reset-password/route.ts:40` deletes the token immediately after a successful password update. Replay is not possible.
- ✅ **Email verification tokens are single-use** — `verify-email/route.ts:28` deletes the token after marking the user as verified.
- ✅ **Old reset tokens are invalidated on new request** — `forgot-password/route.ts:22-24` calls `deleteMany` before creating a new token, preventing parallel valid reset links.
- ✅ **User enumeration avoided in forgot-password** — The endpoint returns `{ success: true }` regardless of whether the email exists (`route.ts:17-18`).
- ✅ **Session-scoped profile mutations** — Both `change-password` and `delete-account` routes call `auth()` and use `session.user.id` as the WHERE clause. Users cannot target other accounts.
- ✅ **Timing-safe password comparison** — `bcrypt.compare` is used (not string equality), which is inherently timing-safe.
- ✅ **Passwords not returned to client** — The profile page selects `password: true` only to derive `hasPassword: boolean` and does not send the hash to the browser.
- ✅ **Token namespace separation for password reset** — reset-password tokens use the `password-reset:` identifier prefix, and `reset-password/route.ts:23` validates this prefix, preventing email-verification tokens from completing a password reset.
