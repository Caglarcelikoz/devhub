import { prisma } from '@/lib/prisma'

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

export async function getCollectionsWithMeta(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  })

  return collections.map((col) => {
    // Count items per type
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
      itemCount: col.items.length,
      typeBreakdown,
      dominantColor: typeBreakdown[0]?.color,
    }
  })
}
