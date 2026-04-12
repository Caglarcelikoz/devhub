import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { deleteFromS3 } from '@/lib/s3'

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileItems = await prisma.item.findMany({
      where: { userId: session.user.id, fileUrl: { not: null } },
      select: { fileUrl: true },
    })

    await Promise.all(fileItems.map((item) => deleteFromS3(item.fileUrl!)))

    await prisma.user.delete({ where: { id: session.user.id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
