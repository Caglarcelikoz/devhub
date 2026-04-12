import { prisma } from '@/lib/prisma'

export interface ItemWithMeta {
  id: string
  title: string
  description: string | null
  content: string | null
  contentType: 'TEXT' | 'FILE' | 'URL'
  url: string | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  updatedAt: Date
  tags: string[]
  itemType: {
    id: string
    name: string
    color: string
    icon: string
  }
}

export interface ItemDetail extends Omit<ItemWithMeta, 'content'> {
  content: string | null // full content, not truncated
  createdAt: Date
  collections: { id: string; name: string }[]
}

const itemSelect = {
  id: true,
  title: true,
  description: true,
  content: true,
  contentType: true,
  url: true,
  language: true,
  isFavorite: true,
  isPinned: true,
  updatedAt: true,
  tags: { select: { name: true } },
  itemType: { select: { id: true, name: true, color: true, icon: true } },
} as const

function mapItem(raw: {
  id: string
  title: string
  description: string | null
  content: string | null
  contentType: string
  url: string | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  updatedAt: Date
  tags: { name: string }[]
  itemType: { id: string; name: string; color: string; icon: string }
}): ItemWithMeta {
  return {
    ...raw,
    contentType: raw.contentType as 'TEXT' | 'FILE' | 'URL',
    content: raw.content?.slice(0, 500) ?? null,
    tags: raw.tags.map((t) => t.name),
  }
}

export async function getPinnedItems(userId: string): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: 'desc' },
    select: itemSelect,
  })
  return rows.map(mapItem)
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: itemSelect,
  })
  return rows.map(mapItem)
}

export async function getItemsByType(
  userId: string,
  typeName: string,
): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId, itemType: { name: typeName } },
    orderBy: { updatedAt: 'desc' },
    select: itemSelect,
  })
  return rows.map(mapItem)
}

export async function getItemById(
  id: string,
  userId: string,
): Promise<ItemDetail | null> {
  const row = await prisma.item.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      contentType: true,
      url: true,
      language: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      tags: { select: { name: true } },
      itemType: { select: { id: true, name: true, color: true, icon: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })
  if (!row) return null
  return {
    ...row,
    contentType: row.contentType as 'TEXT' | 'FILE' | 'URL',
    tags: row.tags.map((t) => t.name),
    collections: row.collections.map((c) => c.collection),
  }
}

export interface CreateItemData {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
  itemTypeName: string
}

export async function createItem(
  userId: string,
  data: CreateItemData,
): Promise<ItemDetail | null> {
  // Look up the item type
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.itemTypeName, isSystem: true },
    select: { id: true, name: true },
  })
  if (!itemType) return null

  // Determine content type
  const contentType = data.itemTypeName === 'link' ? 'URL' : 'TEXT'

  const row = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      contentType,
      userId,
      itemTypeId: itemType.id,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      contentType: true,
      url: true,
      language: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      tags: { select: { name: true } },
      itemType: { select: { id: true, name: true, color: true, icon: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })

  return {
    ...row,
    contentType: row.contentType as 'TEXT' | 'FILE' | 'URL',
    tags: row.tags.map((t) => t.name),
    collections: [],
  }
}

export interface UpdateItemData {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
}

export async function updateItem(
  id: string,
  userId: string,
  data: UpdateItemData,
): Promise<ItemDetail | null> {
  // Verify ownership
  const existing = await prisma.item.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return null

  const row = await prisma.item.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      contentType: true,
      url: true,
      language: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      tags: { select: { name: true } },
      itemType: { select: { id: true, name: true, color: true, icon: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })

  return {
    ...row,
    contentType: row.contentType as 'TEXT' | 'FILE' | 'URL',
    tags: row.tags.map((t) => t.name),
    collections: row.collections.map((c) => c.collection),
  }
}

export async function deleteItem(
  id: string,
  userId: string,
): Promise<boolean> {
  const existing = await prisma.item.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return false
  await prisma.item.delete({ where: { id } })
  return true
}

export async function getItemStats(userId: string) {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ])
  return { totalItems, favoriteItems }
}

export interface ItemTypeWithCount {
  id: string
  name: string
  icon: string
  color: string
  itemCount: number
}

export async function getItemTypesWithCount(userId: string): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: {
      _count: {
        select: { items: { where: { userId } } },
      },
    },
    orderBy: { name: 'asc' },
  })

  return types.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    itemCount: t._count.items,
  }))
}
