'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { canCreateCollection } from "@/lib/usage";
import {
  createCollection as dbCreateCollection,
  updateCollection as dbUpdateCollection,
  deleteCollection as dbDeleteCollection,
  toggleFavoriteCollection as dbToggleFavoriteCollection,
} from '@/lib/db/collections'
import type { CreatedCollection, CollectionById } from '@/lib/db/collections'

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

  const allowed = await canCreateCollection(
    session.user.id,
    session.user.isPro ?? false,
  );
  if (!allowed) {
    return {
      success: false,
      error:
        "You have reached the free tier limit of 3 collections. Upgrade to Pro for unlimited collections.",
    };
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

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
})

type UpdateCollectionInput = z.input<typeof updateCollectionSchema>

export async function updateCollection(
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<ActionResult<CollectionById>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = updateCollectionSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ')
    return { success: false, error: message }
  }

  try {
    const updated = await dbUpdateCollection(session.user.id, collectionId, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    if (!updated) return { success: false, error: 'Collection not found' }
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Failed to update collection' }
  }
}

export async function deleteCollection(
  collectionId: string,
): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const deleted = await dbDeleteCollection(session.user.id, collectionId)
    if (!deleted) return { success: false, error: 'Collection not found' }
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Failed to delete collection' }
  }
}

export async function toggleFavoriteCollection(
  collectionId: string,
): Promise<ActionResult<null>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const toggled = await dbToggleFavoriteCollection(session.user.id, collectionId)
    if (!toggled) return { success: false, error: 'Collection not found' }
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Failed to toggle favorite' }
  }
}
