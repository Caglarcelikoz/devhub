import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/api/require-session'
import { getItemById } from '@/lib/db/items'

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

  return NextResponse.json(item)
}
