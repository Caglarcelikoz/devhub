import { cache } from 'react'
import { prisma } from '@/lib/prisma'

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
