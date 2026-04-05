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

export async function getItemStats(userId: string) {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ])
  return { totalItems, favoriteItems }
}
