import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { deleteFromS3 } from '@/lib/s3'

export interface ItemWithMeta {
  id: string
  title: string
  description: string | null
  content: string | null
  contentType: 'TEXT' | 'FILE' | 'URL'
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
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
  fileUrl: true,
  fileName: true,
  fileSize: true,
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
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
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

const itemDetailSelect = {
  id: true,
  title: true,
  description: true,
  content: true,
  contentType: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
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
} as const

export async function getPinnedItems(userId: string): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: 'desc' },
    select: itemSelect,
  })
  return rows.map(mapItem)
}

export async function getFavoriteItems(
  userId: string,
): Promise<ItemWithMeta[]> {
  const rows = await prisma.item.findMany({
    where: { userId, isFavorite: true },
    orderBy: { updatedAt: "desc" },
    select: itemSelect,
  });
  return rows.map(mapItem);
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

export async function getAllItemsPaginated(
  userId: string,
  page = 1,
  pageSize = 12,
): Promise<PaginatedItems> {
  const where = { userId };
  const [rows, totalCount] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: itemSelect,
    }),
    prisma.item.count({ where }),
  ]);
  return { items: rows.map(mapItem), totalCount };
}

export interface PaginatedItems {
  items: ItemWithMeta[];
  totalCount: number;
}

export async function getItemsByType(
  userId: string,
  typeName: string,
  page = 1,
  pageSize = 21,
): Promise<PaginatedItems> {
  const where = { userId, itemType: { name: typeName } };
  const [rows, totalCount] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: itemSelect,
    }),
    prisma.item.count({ where }),
  ]);
  return { items: rows.map(mapItem), totalCount };
}

export async function getItemsByCollection(
  userId: string,
  collectionId: string,
  page = 1,
  pageSize = 21,
): Promise<PaginatedItems> {
  const where = { userId, collections: { some: { collectionId } } };
  const [rows, totalCount] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: itemSelect,
    }),
    prisma.item.count({ where }),
  ]);
  return { items: rows.map(mapItem), totalCount };
}

export async function getItemById(
  id: string,
  userId: string,
): Promise<ItemDetail | null> {
  const row = await prisma.item.findFirst({
    where: { id, userId },
    select: itemDetailSelect,
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
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  url: string | null
  language: string | null
  tags: string[]
  itemTypeName: string
  collectionIds: string[]
}

export async function createItem(
  userId: string,
  data: CreateItemData,
): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.itemTypeName, isSystem: true },
    select: { id: true, name: true },
  })
  if (!itemType) return null

  const isFileType = data.itemTypeName === 'file' || data.itemTypeName === 'image'
  const contentType = data.itemTypeName === 'link' ? 'URL' : isFileType ? 'FILE' : 'TEXT'

  const row = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
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
      collections: {
        create: data.collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    select: itemDetailSelect,
  })

  return {
    ...row,
    contentType: row.contentType as 'TEXT' | 'FILE' | 'URL',
    tags: row.tags.map((t) => t.name),
    collections: row.collections.map((c) => c.collection),
  }
}

export interface UpdateItemData {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
  collectionIds: string[]
}

export async function updateItem(
  id: string,
  userId: string,
  data: UpdateItemData,
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return null

  // Sync collections: delete all existing, then recreate
  await prisma.itemCollection.deleteMany({ where: { itemId: id } })

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
      collections: {
        create: data.collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    select: itemDetailSelect,
  })

  return {
    ...row,
    contentType: row.contentType as 'TEXT' | 'FILE' | 'URL',
    tags: row.tags.map((t) => t.name),
    collections: row.collections.map((c) => c.collection),
  }
}

export async function toggleFavoriteItem(
  id: string,
  userId: string,
): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true, isFavorite: true },
  });
  if (!existing) return false;

  await prisma.item.update({
    where: { id },
    data: { isFavorite: !existing.isFavorite },
  });
  return true;
}

export async function togglePinnedItem(
  id: string,
  userId: string,
): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true, isPinned: true },
  });
  if (!existing) return false;

  await prisma.item.update({
    where: { id },
    data: { isPinned: !existing.isPinned },
  });
  return true;
}

export async function deleteItem(
  id: string,
  userId: string,
): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id, userId },
    select: { id: true, fileUrl: true },
  })
  if (!existing) return false

  // Delete S3 file if present
  if (existing.fileUrl) {
    await deleteFromS3(existing.fileUrl)
  }

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

export interface SearchItem {
  id: string
  title: string
  description: string | null
  contentPreview: string | null
  itemType: {
    name: string
    color: string
    icon: string
  }
}

export async function getSearchItems(userId: string): Promise<SearchItem[]> {
  const rows = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      itemType: { select: { name: true, color: true, icon: true } },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    contentPreview: row.content?.slice(0, 100) ?? null,
    itemType: row.itemType,
  }))
}

export const getItemTypesWithCount = cache(async function getItemTypesWithCount(userId: string): Promise<ItemTypeWithCount[]> {
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
})
