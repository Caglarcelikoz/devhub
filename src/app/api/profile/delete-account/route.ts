import { requireSession } from '@/lib/api/require-session'
import { prisma } from '@/lib/prisma'
import { deleteFromS3 } from '@/lib/s3'
import { apiError, apiSuccess } from '@/lib/api/responses'

export async function DELETE() {
  const { session, error } = await requireSession()
  if (error) return error

  try {

    const fileItems = await prisma.item.findMany({
      where: { userId: session.user.id, fileUrl: { not: null } },
      select: { fileUrl: true },
    })

    await Promise.all(fileItems.map((item) => deleteFromS3(item.fileUrl!)))

    await prisma.user.delete({ where: { id: session.user.id } })

    return apiSuccess({ success: true })
  } catch {
    return apiError('Internal server error')
  }
}
