'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { createCollection as dbCreateCollection } from '@/lib/db/collections'
import type { CreatedCollection } from '@/lib/db/collections'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
})

type CreateCollectionInput = z.input<typeof createCollectionSchema>

export async function createCollection(
  input: CreateCollectionInput,
): Promise<ActionResult<CreatedCollection>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = createCollectionSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ')
    return { success: false, error: message }
  }

  try {
    const created = await dbCreateCollection(session.user.id, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'Failed to create collection' }
  }
}
