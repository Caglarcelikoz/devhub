import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/resend'
import { ENABLE_EMAIL_VERIFICATION } from '@/lib/flags'
import { checkRegisterRateLimit } from '@/lib/rate-limit'
import { apiError, apiSuccess, zodErrorResponse } from '@/lib/api/responses'
import { rotateVerificationToken } from '@/lib/db/verification-tokens'

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(72),
  confirmPassword: z.string(),
})

export async function POST(request: NextRequest) {
  const rl = await checkRegisterRateLimit(request)
  if (rl.limited) return rl.response

  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) return zodErrorResponse(parsed.error)

    const { name, email, password, confirmPassword } = parsed.data

    if (password !== confirmPassword) return apiError('Passwords do not match', 400)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return apiError('User already exists', 400)

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Mark as verified immediately when verification is disabled
        emailVerified: ENABLE_EMAIL_VERIFICATION ? null : new Date(),
      },
    })

    if (ENABLE_EMAIL_VERIFICATION) {
      const token = await rotateVerificationToken(email, 24 * 60 * 60 * 1000)
      await sendVerificationEmail(email, token)
      return apiSuccess({ success: true, requiresVerification: true })
    }

    return apiSuccess({ success: true, requiresVerification: false })
  } catch {
    return apiError('Internal server error')
  }
}
