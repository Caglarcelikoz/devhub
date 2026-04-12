import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCollectionById, getSearchCollections } from '@/lib/db/collections'
import { getItemsByCollection } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    item: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/s3', () => ({
  deleteFromS3: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'

const mockCollectionFindFirst = vi.mocked(prisma.collection.findFirst)
const mockCollectionFindMany = vi.mocked(prisma.collection.findMany)
const mockItemFindMany = vi.mocked(prisma.item.findMany)

function makeCollectionRow(overrides = {}) {
  return {
    id: 'col-1',
    name: 'React Patterns',
    description: 'Useful React patterns',
    isFavorite: false,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

function makeItemRow(overrides = {}) {
  return {
    id: 'item-1',
    title: 'useAuth hook',
    description: null,
    content: 'const x = 1',
    contentType: 'TEXT',
    fileUrl: null,
    fileName: null,
    fileSize: null,
    url: null,
    language: 'typescript',
    isFavorite: false,
    isPinned: false,
    updatedAt: new Date('2024-01-15'),
    tags: [],
    itemType: { id: 'type-1', name: 'snippet', color: '#3b82f6', icon: 'Code' },
    ...overrides,
  }
}

describe('getCollectionById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the collection when found', async () => {
    const row = makeCollectionRow()
    mockCollectionFindFirst.mockResolvedValue(row as never)

    const result = await getCollectionById('user-1', 'col-1')

    expect(mockCollectionFindFirst).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
      select: { id: true, name: true, description: true, isFavorite: true, createdAt: true },
    })
    expect(result).toEqual(row)
  })

  it('returns null when collection is not found', async () => {
    mockCollectionFindFirst.mockResolvedValue(null)

    const result = await getCollectionById('user-1', 'nonexistent')

    expect(result).toBeNull()
  })

  it('returns null when collection belongs to a different user', async () => {
    mockCollectionFindFirst.mockResolvedValue(null)

    const result = await getCollectionById('other-user', 'col-1')

    expect(mockCollectionFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'col-1', userId: 'other-user' } }),
    )
    expect(result).toBeNull()
  })
})

describe('getSearchCollections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mapped collections with itemCount', async () => {
    mockCollectionFindMany.mockResolvedValue([
      { id: 'col-1', name: 'React Patterns', _count: { items: 5 } },
      { id: 'col-2', name: 'Python Snippets', _count: { items: 0 } },
    ] as never)

    const result = await getSearchCollections('user-1')

    expect(mockCollectionFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
    })
    expect(result).toEqual([
      { id: 'col-1', name: 'React Patterns', itemCount: 5 },
      { id: 'col-2', name: 'Python Snippets', itemCount: 0 },
    ])
  })

  it('returns an empty array when user has no collections', async () => {
    mockCollectionFindMany.mockResolvedValue([])

    const result = await getSearchCollections('user-1')

    expect(result).toEqual([])
  })
})

describe('getItemsByCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mapped items for the collection', async () => {
    const row = makeItemRow()
    mockItemFindMany.mockResolvedValue([row] as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(mockItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', collections: { some: { collectionId: 'col-1' } } },
        orderBy: { updatedAt: 'desc' },
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('item-1')
    expect(result[0].tags).toEqual([])
  })

  it('returns an empty array when collection has no items', async () => {
    mockItemFindMany.mockResolvedValue([])

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(result).toEqual([])
  })

  it('truncates content to 500 characters', async () => {
    const longContent = 'x'.repeat(600)
    mockItemFindMany.mockResolvedValue([makeItemRow({ content: longContent })] as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(result[0].content).toHaveLength(500)
  })

  it('maps tag objects to tag name strings', async () => {
    mockItemFindMany.mockResolvedValue([
      makeItemRow({ tags: [{ name: 'react' }, { name: 'hooks' }] }),
    ] as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(result[0].tags).toEqual(['react', 'hooks'])
  })
})
