'use server'

import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import { formatZodError, optionalString } from '@/lib/zod-helpers'
import { canCreateItem } from "@/lib/usage";
import {
  createItem as dbCreateItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
  toggleFavoriteItem as dbToggleFavoriteItem,
  togglePinnedItem as dbTogglePinnedItem,
} from "@/lib/db/items";
import type { ItemDetail } from '@/lib/db/items'
import type { ActionResult } from '@/types/actions'

const CREATABLE_TYPES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'] as const

const createItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  itemTypeName: z.enum(CREATABLE_TYPES, { error: 'Invalid item type' }),
  description: optionalString,
  content: optionalString,
  fileUrl: optionalString,
  fileName: optionalString,
  fileSize: z.number().nullable().optional().transform((v) => v ?? null),
  url: optionalString.refine((v) => !v || z.string().url().safeParse(v).success, {
    message: 'Must be a valid URL',
  }),
  language: optionalString,
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string()).default([]),
})

type CreateItemInput = z.input<typeof createItemSchema>

export async function createItem(
  input: CreateItemInput,
): Promise<ActionResult<ItemDetail>> {
  const session = await requireAuth()
  if (!session) return { success: false, error: 'Unauthorized' }

  // Feature gating for free users
  if (["file", "image"].includes(input.itemTypeName) && !session.user.isPro) {
    return {
      success: false,
      error: "File and image uploads require a Pro subscription.",
    };
  }

  const allowed = await canCreateItem(
    session.user.id,
    session.user.isPro ?? false,
  );
  if (!allowed) {
    return {
      success: false,
      error:
        "You have reached the free tier limit of 50 items. Upgrade to Pro for unlimited items.",
    };
  }

  const parsed = createItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: formatZodError(parsed.error) }

  const data = parsed.data;

  if (data.itemTypeName === "link" && !data.url) {
    return { success: false, error: "URL is required for link items" };
  }

  if (
    (data.itemTypeName === "file" || data.itemTypeName === "image") &&
    !data.fileUrl
  ) {
    return { success: false, error: "A file must be uploaded first" };
  }

  try {
    const created = await dbCreateItem(session.user.id, {
      title: data.title,
      description: data.description ?? null,
      content: data.content ?? null,
      fileUrl: data.fileUrl ?? null,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
      url: data.url ?? null,
      language: data.language ?? null,
      tags: data.tags,
      itemTypeName: data.itemTypeName,
      collectionIds: data.collectionIds,
    });

    if (!created) {
      return { success: false, error: "Item type not found" };
    }

    return { success: true, data: created };
  } catch {
    return { success: false, error: "Failed to create item" };
  }
}

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: optionalString,
  content: optionalString,
  url: optionalString.refine((v) => !v || z.string().url().safeParse(v).success, {
    message: 'Must be a valid URL',
  }),
  language: optionalString,
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string()).default([]),
})

type UpdateItemInput = z.input<typeof updateItemSchema>

export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<ActionResult<ItemDetail>> {
  const session = await requireAuth()
  if (!session) return { success: false, error: 'Unauthorized' }

  const parsed = updateItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: formatZodError(parsed.error) }

  const data = parsed.data

  try {
    const updated = await dbUpdateItem(itemId, session.user.id, {
      title: data.title,
      description: data.description ?? null,
      content: data.content ?? null,
      url: data.url ?? null,
      language: data.language ?? null,
      tags: data.tags,
      collectionIds: data.collectionIds,
    })

    if (!updated) {
      return { success: false, error: 'Item not found' }
    }

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'Failed to update item' }
  }
}

export async function deleteItem(
  itemId: string,
): Promise<ActionResult<null>> {
  const session = await requireAuth()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const deleted = await dbDeleteItem(itemId, session.user.id)
    if (!deleted) {
      return { success: false, error: 'Item not found' }
    }
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Failed to delete item' }
  }
}

export async function toggleFavorite(
  itemId: string,
): Promise<ActionResult<null>> {
  const session = await requireAuth()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const toggled = await dbToggleFavoriteItem(itemId, session.user.id)
    if (!toggled) {
      return { success: false, error: 'Item not found' }
    }
    return { success: true, data: null }
  } catch {
    return { success: false, error: 'Failed to toggle favorite' }
  }
}

export async function togglePin(itemId: string): Promise<ActionResult<null>> {
  const session = await requireAuth()
  if (!session) return { success: false, error: 'Unauthorized' }

  try {
    const toggled = await dbTogglePinnedItem(itemId, session.user.id);
    if (!toggled) {
      return { success: false, error: "Item not found" };
    }
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Failed to toggle pin" };
  }
}
