import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { checkResetPasswordRateLimit } from '@/lib/rate-limit'
import { apiError, apiSuccess } from '@/lib/api/responses'

export async function POST(request: NextRequest) {
  const rl = await checkResetPasswordRateLimit(request)
  if (rl.limited) return rl.response

  try {
    const { token, password, confirmPassword } = await request.json()

    if (!token || !password || !confirmPassword) return apiError('All fields are required', 400)
    if (password !== confirmPassword) return apiError('Passwords do not match', 400)
    if (password.length < 8) return apiError('Password must be at least 8 characters', 400)

    const record = await prisma.verificationToken.findUnique({ where: { token } })

    if (!record || !record.identifier.startsWith('password-reset:')) {
      return apiError('Invalid or expired reset link', 400)
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } })
      return apiError('Reset link has expired', 400)
    }

    const email = record.identifier.replace('password-reset:', '')
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({ where: { email }, data: { password: hashedPassword } })
    await prisma.verificationToken.delete({ where: { token } })

    return apiSuccess({ success: true })
  } catch {
    return apiError('Internal server error')
  }
}
