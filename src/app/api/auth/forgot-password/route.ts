import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/resend'
import { checkForgotPasswordRateLimit } from '@/lib/rate-limit'
import { apiError, apiSuccess } from '@/lib/api/responses'
import { rotateVerificationToken } from '@/lib/db/verification-tokens'

export async function POST(request: NextRequest) {
  const rl = await checkForgotPasswordRateLimit(request)
  if (rl.limited) return rl.response

  try {
    const { email } = await request.json()

    if (!email) return apiError('Email is required', 400)

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid user enumeration
    if (!user || !user.password) return apiSuccess({ success: true })

    const token = await rotateVerificationToken(`password-reset:${email}`, 60 * 60 * 1000)
    await sendPasswordResetEmail(email, token)

    return apiSuccess({ success: true })
  } catch {
    return apiError('Internal server error')
  }
}
