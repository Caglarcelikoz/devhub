import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireSession } from '@/lib/api/require-session'
import { prisma } from '@/lib/prisma'
import { apiError, apiSuccess, zodErrorResponse } from '@/lib/api/responses'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72),
  confirmPassword: z.string(),
})

export async function POST(request: Request) {
  const { session, error: authError } = await requireSession()
  if (authError) return authError

  try {

    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)

    if (!parsed.success) return zodErrorResponse(parsed.error)

    const { currentPassword, newPassword, confirmPassword } = parsed.data

    if (newPassword !== confirmPassword) return apiError('Passwords do not match', 400)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    })

    if (!user?.password) return apiError('No password set for this account', 400)

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return apiError('Current password is incorrect', 400)

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashedPassword } })

    return apiSuccess({ success: true })
  } catch {
    return apiError('Internal server error')
  }
}
