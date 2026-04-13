import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export interface CollectionOption {
  id: string
  name: string
}

export async function getCollections(userId: string): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

export interface CreatedCollection {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
}

export async function createCollection(
  userId: string,
  data: { name: string; description: string | null },
): Promise<CreatedCollection> {
  return prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
    },
  })
}

export interface CollectionWithMeta {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  /** All distinct item types present, ordered by count descending */
  typeBreakdown: Array<{
    id: string
    name: string
    color: string
    count: number
  }>
  /** Color of the most-used item type, or undefined if empty */
  dominantColor: string | undefined
}

export interface CollectionById {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
}

export async function getCollectionById(
  userId: string,
  collectionId: string,
): Promise<CollectionById | null> {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true, name: true, description: true, isFavorite: true, createdAt: true },
  })
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  data: { name: string; description: string | null },
): Promise<CollectionById | null> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  })
  if (!existing) return null

  return prisma.collection.update({
    where: { id: collectionId },
    data: { name: data.name, description: data.description },
    select: { id: true, name: true, description: true, isFavorite: true, createdAt: true },
  })
}

export async function deleteCollection(
  userId: string,
  collectionId: string,
): Promise<boolean> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  })
  if (!existing) return false

  await prisma.collection.delete({ where: { id: collectionId } })
  return true
}

export interface SearchCollection {
  id: string
  name: string
  itemCount: number
}

export async function getSearchCollections(userId: string): Promise<SearchCollection[]> {
  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { items: true } },
    },
  })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    itemCount: row._count.items,
  }))
}

export interface PaginatedCollections {
  collections: CollectionWithMeta[]
  totalCount: number
}

export async function getCollectionsWithMetaPaginated(
  userId: string,
  page = 1,
  pageSize = 21,
): Promise<PaginatedCollections> {
  const [collections, totalCount] = await Promise.all([
    prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { items: true } },
        items: {
          select: {
            item: {
              select: {
                itemType: { select: { id: true, name: true, color: true } },
              },
            },
          },
        },
      },
    }),
    prisma.collection.count({ where: { userId } }),
  ])

  return {
    collections: collections.map((col) => {
      const typeCounts = new Map<string, { id: string; name: string; color: string; count: number }>()
      for (const ic of col.items) {
        const t = ic.item.itemType
        const existing = typeCounts.get(t.id)
        if (existing) existing.count++
        else typeCounts.set(t.id, { id: t.id, name: t.name, color: t.color, count: 1 })
      }
      const typeBreakdown = Array.from(typeCounts.values()).sort((a, b) => b.count - a.count)
      return {
        id: col.id,
        name: col.name,
        description: col.description,
        isFavorite: col.isFavorite,
        itemCount: col._count.items,
        typeBreakdown,
        dominantColor: typeBreakdown[0]?.color,
      }
    }),
    totalCount,
  }
}

export const getCollectionsWithMeta = cache(async function getCollectionsWithMeta(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
      items: {
        select: {
          item: {
            select: {
              itemType: { select: { id: true, name: true, color: true } },
            },
          },
        },
      },
    },
  })

  return collections.map((col) => {
    const typeCounts = new Map<string, { id: string; name: string; color: string; count: number }>()

    for (const ic of col.items) {
      const t = ic.item.itemType
      const existing = typeCounts.get(t.id)
      if (existing) {
        existing.count++
      } else {
        typeCounts.set(t.id, { id: t.id, name: t.name, color: t.color, count: 1 })
      }
    }

    const typeBreakdown = Array.from(typeCounts.values()).sort((a, b) => b.count - a.count)

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col._count.items,
      typeBreakdown,
      dominantColor: typeBreakdown[0]?.color,
    }
  })
})
