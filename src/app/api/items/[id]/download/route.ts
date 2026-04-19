import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { requireSession } from '@/lib/api/require-session'
import { getItemById } from '@/lib/db/items'
import { s3, S3_BUCKET } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireSession()
  if (error) return error

  const { id } = await params
  const item = await getItemById(id, session.user.id)

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (item.contentType !== 'FILE' || !item.fileUrl) {
    return NextResponse.json({ error: 'Item has no file' }, { status: 400 })
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: item.fileUrl,
  })

  const s3Response = await s3.send(command)
  const nodeStream = s3Response.Body as Readable
  const webStream = Readable.toWeb(nodeStream) as ReadableStream

  const contentType = s3Response.ContentType ?? 'application/octet-stream'
  const fileName = item.fileName ?? 'download'

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      ...(s3Response.ContentLength != null && {
        'Content-Length': s3Response.ContentLength.toString(),
      }),
    },
  })
}
