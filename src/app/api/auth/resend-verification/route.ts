import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/resend'
import { ENABLE_EMAIL_VERIFICATION } from '@/lib/flags'
import { checkResendVerificationRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!ENABLE_EMAIL_VERIFICATION) {
      return NextResponse.json({ error: 'Email verification is not enabled' }, { status: 400 })
    }

    const rl = await checkResendVerificationRateLimit(request, email)
    if (rl.limited) return rl.response

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid user enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true })
    }

    // Delete any existing verification token
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    })

    await sendVerificationEmail(email, token)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
