import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/resend'
import { ENABLE_EMAIL_VERIFICATION } from '@/lib/flags'
import { checkRegisterRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rl = await checkRegisterRateLimit(request)
  if (rl.limited) return rl.response

  try {
    const { name, email, password, confirmPassword } = await request.json()

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

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
      const token = randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await prisma.verificationToken.create({
        data: { identifier: email, token, expires },
      })

      await sendVerificationEmail(email, token)

      return NextResponse.json({ success: true, requiresVerification: true })
    }

    return NextResponse.json({ success: true, requiresVerification: false })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
