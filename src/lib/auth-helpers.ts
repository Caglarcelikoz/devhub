import { auth } from '@/auth'
import { checkAiRateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/types/actions'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session
}

export async function requireAiAccess(
  session: NonNullable<Awaited<ReturnType<typeof requireAuth>>>,
): Promise<ActionResult<never> | null> {
  if (!session.user.isPro) {
    return { success: false, error: 'AI features require a Pro subscription.' }
  }
  const rateCheck = await checkAiRateLimit(session.user.id)
  if (rateCheck.limited) {
    return { success: false, error: rateCheck.error ?? 'Rate limit exceeded.' }
  }
  return null
}
