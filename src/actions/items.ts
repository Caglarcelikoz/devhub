'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { updateItem as dbUpdateItem } from '@/lib/db/items'
import type { ItemDetail } from '@/lib/db/items'

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().nullable().optional().transform((v) => v ?? null),
  content: z.string().nullable().optional().transform((v) => v ?? null),
  url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => v ?? null)
    .refine((v) => !v || z.string().url().safeParse(v).success, {
      message: 'Must be a valid URL',
    }),
  language: z.string().trim().nullable().optional().transform((v) => v ?? null),
  tags: z
    .array(z.string().trim().min(1))
    .default([]),
})

type UpdateItemInput = z.input<typeof updateItemSchema>

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<ActionResult<ItemDetail>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = updateItemSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ')
    return { success: false, error: message }
  }

  const data = parsed.data

  try {
    const updated = await dbUpdateItem(itemId, session.user.id, {
      title: data.title,
      description: data.description ?? null,
      content: data.content ?? null,
      url: data.url ?? null,
      language: data.language ?? null,
      tags: data.tags,
    })

    if (!updated) {
      return { success: false, error: 'Item not found' }
    }

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Failed to update item' }
  }
}
