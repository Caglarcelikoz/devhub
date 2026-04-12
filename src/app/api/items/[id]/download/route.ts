import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@/auth'
import { getItemById } from '@/lib/db/items'
import { s3, S3_BUCKET } from '@/lib/s3'
import type { Readable } from 'stream'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    Key: item.fileUrl, // stored as S3 key
  })

  const s3Response = await s3.send(command)
  const stream = s3Response.Body as Readable

  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk as Uint8Array)
  }
  const buffer = Buffer.concat(chunks)

  const contentType = s3Response.ContentType ?? 'application/octet-stream'
  const fileName = item.fileName ?? 'download'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
