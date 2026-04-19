import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/resend'
import { ENABLE_EMAIL_VERIFICATION } from '@/lib/flags'
import { checkResendVerificationRateLimit } from '@/lib/rate-limit'
import { apiError, apiSuccess } from '@/lib/api/responses'
import { rotateVerificationToken } from '@/lib/db/verification-tokens'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) return apiError('Email is required', 400)
    if (!ENABLE_EMAIL_VERIFICATION) return apiError('Email verification is not enabled', 400)

    const rl = await checkResendVerificationRateLimit(request, email)
    if (rl.limited) return rl.response

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid user enumeration
    if (!user || user.emailVerified) return apiSuccess({ success: true })

    const token = await rotateVerificationToken(email, 24 * 60 * 60 * 1000)
    await sendVerificationEmail(email, token)

    return apiSuccess({ success: true })
  } catch {
    return apiError('Internal server error')
  }
}
