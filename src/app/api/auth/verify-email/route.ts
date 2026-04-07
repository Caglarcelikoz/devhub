import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in?error=missing-token', request.url))
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record) {
    return NextResponse.redirect(new URL('/sign-in?error=invalid-token', request.url))
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return NextResponse.redirect(new URL('/sign-in?error=expired-token', request.url))
  }

  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.delete({ where: { token } })

  return NextResponse.redirect(new URL('/sign-in?verified=1', request.url))
}
