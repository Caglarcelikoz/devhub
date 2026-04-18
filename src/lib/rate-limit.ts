import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function makeRatelimit(requests: number, window: string): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`),
    timeout: 3000,
  })
}

// Lazily created limiters
let loginLimiter: Ratelimit | null | undefined = undefined
let registerLimiter: Ratelimit | null | undefined = undefined
let forgotPasswordLimiter: Ratelimit | null | undefined = undefined
let resetPasswordLimiter: Ratelimit | null | undefined = undefined
let resendVerificationLimiter: Ratelimit | null | undefined = undefined
let aiLimiter: Ratelimit | null | undefined = undefined

function getLoginLimiter() {
  if (loginLimiter === undefined) loginLimiter = makeRatelimit(5, '15 m')
  return loginLimiter
}
function getRegisterLimiter() {
  if (registerLimiter === undefined) registerLimiter = makeRatelimit(3, '1 h')
  return registerLimiter
}
function getForgotPasswordLimiter() {
  if (forgotPasswordLimiter === undefined) forgotPasswordLimiter = makeRatelimit(3, '1 h')
  return forgotPasswordLimiter
}
function getResetPasswordLimiter() {
  if (resetPasswordLimiter === undefined) resetPasswordLimiter = makeRatelimit(5, '15 m')
  return resetPasswordLimiter
}
function getResendVerificationLimiter() {
  if (resendVerificationLimiter === undefined) resendVerificationLimiter = makeRatelimit(3, '15 m')
  return resendVerificationLimiter
}
function getAiLimiter() {
  if (aiLimiter === undefined) aiLimiter = makeRatelimit(20, '1 h')
  return aiLimiter
}

export function getIP(request: NextRequest | Request): string {
  const forwarded =
    request instanceof NextRequest
      ? request.headers.get('x-forwarded-for')
      : (request as Request).headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

export type RateLimitResult =
  | { limited: false }
  | { limited: true; response: NextResponse }

async function checkLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<RateLimitResult> {
  if (!limiter) return { limited: false }

  try {
    const { success, reset } = await limiter.limit(key)
    if (success) return { limited: false }

    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000)
    const minutes = Math.ceil(retryAfterSeconds / 60)
    const message =
      retryAfterSeconds <= 60
        ? `Too many attempts. Please try again in ${retryAfterSeconds} seconds.`
        : `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`

    const response = NextResponse.json({ error: message }, { status: 429 })
    response.headers.set('Retry-After', String(retryAfterSeconds))
    return { limited: true, response }
  } catch {
    // Fail open — allow the request if Upstash is unavailable
    return { limited: false }
  }
}

export async function checkLoginRateLimit(
  request: NextRequest | Request,
  email: string
): Promise<RateLimitResult> {
  const ip = getIP(request)
  return checkLimit(getLoginLimiter(), `login:${ip}:${email}`)
}

export async function checkRegisterRateLimit(
  request: NextRequest | Request
): Promise<RateLimitResult> {
  const ip = getIP(request)
  return checkLimit(getRegisterLimiter(), `register:${ip}`)
}

export async function checkForgotPasswordRateLimit(
  request: NextRequest | Request
): Promise<RateLimitResult> {
  const ip = getIP(request)
  return checkLimit(getForgotPasswordLimiter(), `forgot-password:${ip}`)
}

export async function checkResetPasswordRateLimit(
  request: NextRequest | Request
): Promise<RateLimitResult> {
  const ip = getIP(request)
  return checkLimit(getResetPasswordLimiter(), `reset-password:${ip}`)
}

export async function checkResendVerificationRateLimit(
  request: NextRequest | Request,
  email: string
): Promise<RateLimitResult> {
  const ip = getIP(request)
  return checkLimit(getResendVerificationLimiter(), `resend-verification:${ip}:${email}`)
}

export async function checkAiRateLimit(userId: string): Promise<{ limited: boolean; error?: string }> {
  const limiter = getAiLimiter()
  if (!limiter) return { limited: false }

  try {
    const { success, reset } = await limiter.limit(`ai:${userId}`)
    if (success) return { limited: false }

    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000)
    const minutes = Math.ceil(retryAfterSeconds / 60)
    const message =
      retryAfterSeconds <= 60
        ? `AI rate limit reached. Try again in ${retryAfterSeconds} seconds.`
        : `AI rate limit reached. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`

    return { limited: true, error: message }
  } catch {
    return { limited: false }
  }
}
