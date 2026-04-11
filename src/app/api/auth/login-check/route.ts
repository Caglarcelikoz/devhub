import { NextRequest, NextResponse } from 'next/server'
import { checkLoginRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ ok: true })

  const rl = await checkLoginRateLimit(request, email)
  if (rl.limited) return rl.response

  return NextResponse.json({ ok: true })
}
