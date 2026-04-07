/**
 * Feature flags read from environment variables.
 * Set ENABLE_EMAIL_VERIFICATION=true in .env to require email verification on register.
 * Leave unset or false during local dev (Resend only allows its own domain without a custom domain).
 */
export const ENABLE_EMAIL_VERIFICATION =
  process.env.ENABLE_EMAIL_VERIFICATION === 'true'
