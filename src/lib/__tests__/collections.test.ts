import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCollectionById,
  getSearchCollections,
  getCollectionsWithMetaPaginated,
  getFavoriteCollections,
} from "@/lib/db/collections";
import { getItemsByCollection } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    item: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/s3', () => ({
  deleteFromS3: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'

const mockCollectionFindFirst = vi.mocked(prisma.collection.findFirst)
const mockCollectionFindMany = vi.mocked(prisma.collection.findMany)
const mockCollectionCount = vi.mocked(prisma.collection.count)
const mockItemFindMany = vi.mocked(prisma.item.findMany)
const mockItemCount = vi.mocked(prisma.item.count)

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
    mockItemCount.mockResolvedValue(0 as never)
  })

  it('returns mapped items and totalCount for the collection', async () => {
    const row = makeItemRow()
    mockItemFindMany.mockResolvedValue([row] as never)
    mockItemCount.mockResolvedValue(1 as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(mockItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', collections: { some: { collectionId: 'col-1' } } },
        orderBy: { updatedAt: 'desc' },
      }),
    )
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('item-1')
    expect(result.items[0].tags).toEqual([])
    expect(result.totalCount).toBe(1)
  })

  it('returns empty items and zero totalCount when collection has no items', async () => {
    mockItemFindMany.mockResolvedValue([])
    mockItemCount.mockResolvedValue(0 as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(result.items).toEqual([])
    expect(result.totalCount).toBe(0)
  })

  it('truncates content to 500 characters', async () => {
    const longContent = 'x'.repeat(600)
    mockItemFindMany.mockResolvedValue([makeItemRow({ content: longContent })] as never)
    mockItemCount.mockResolvedValue(1 as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(result.items[0].content).toHaveLength(500)
  })

  it('maps tag objects to tag name strings', async () => {
    mockItemFindMany.mockResolvedValue([
      makeItemRow({ tags: [{ name: 'react' }, { name: 'hooks' }] }),
    ] as never)
    mockItemCount.mockResolvedValue(1 as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(result.items[0].tags).toEqual(['react', 'hooks'])
  })
})

describe('getCollectionsWithMetaPaginated', () => {
  const makeCollectionWithItems = (overrides = {}) => ({
    id: 'col-1',
    name: 'React Patterns',
    description: 'Useful patterns',
    isFavorite: false,
    _count: { items: 3 },
    items: [
      { item: { itemType: { id: 'type-1', name: 'snippet', color: '#3b82f6' } } },
      { item: { itemType: { id: 'type-1', name: 'snippet', color: '#3b82f6' } } },
      { item: { itemType: { id: 'type-2', name: 'note', color: '#fde047' } } },
    ],
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns collections and totalCount', async () => {
    mockCollectionFindMany.mockResolvedValue([makeCollectionWithItems()] as never)
    mockCollectionCount.mockResolvedValue(1 as never)

    const result = await getCollectionsWithMetaPaginated('user-1')

    expect(result.collections).toHaveLength(1)
    expect(result.totalCount).toBe(1)
  })

  it('maps itemCount and typeBreakdown correctly', async () => {
    mockCollectionFindMany.mockResolvedValue([makeCollectionWithItems()] as never)
    mockCollectionCount.mockResolvedValue(1 as never)

    const result = await getCollectionsWithMetaPaginated('user-1')
    const col = result.collections[0]

    expect(col.itemCount).toBe(3)
    expect(col.typeBreakdown).toHaveLength(2)
    // snippet appears twice so it should be first (sorted by count desc)
    expect(col.typeBreakdown[0].name).toBe('snippet')
    expect(col.typeBreakdown[0].count).toBe(2)
    expect(col.typeBreakdown[1].name).toBe('note')
    expect(col.typeBreakdown[1].count).toBe(1)
  })

  it('sets dominantColor to the most-used type color', async () => {
    mockCollectionFindMany.mockResolvedValue([makeCollectionWithItems()] as never)
    mockCollectionCount.mockResolvedValue(1 as never)

    const result = await getCollectionsWithMetaPaginated('user-1')

    expect(result.collections[0].dominantColor).toBe('#3b82f6')
  })

  it('sets dominantColor to undefined for empty collections', async () => {
    mockCollectionFindMany.mockResolvedValue([
      makeCollectionWithItems({ items: [], _count: { items: 0 } }),
    ] as never)
    mockCollectionCount.mockResolvedValue(1 as never)

    const result = await getCollectionsWithMetaPaginated('user-1')

    expect(result.collections[0].dominantColor).toBeUndefined()
  })

  it('applies skip and take for the given page', async () => {
    mockCollectionFindMany.mockResolvedValue([] as never)
    mockCollectionCount.mockResolvedValue(50 as never)

    await getCollectionsWithMetaPaginated('user-1', 3, 21)

    expect(mockCollectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 42, take: 21 }),
    )
  })

  it('returns empty collections and zero totalCount when user has none', async () => {
    mockCollectionFindMany.mockResolvedValue([] as never)
    mockCollectionCount.mockResolvedValue(0 as never)

    const result = await getCollectionsWithMetaPaginated('user-1')

    expect(result.collections).toEqual([])
    expect(result.totalCount).toBe(0)
  })
})

describe("getFavoriteCollections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only isFavorite collections sorted by updatedAt desc", async () => {
    mockCollectionFindMany.mockResolvedValue([] as never);

    await getFavoriteCollections("user-1");

    expect(mockCollectionFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1", isFavorite: true },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, description: true, updatedAt: true },
    });
  });

  it("returns mapped collection rows", async () => {
    const row = {
      id: "col-1",
      name: "React Patterns",
      description: "Useful patterns",
      updatedAt: new Date("2024-03-01"),
    };
    mockCollectionFindMany.mockResolvedValue([row] as never);

    const result = await getFavoriteCollections("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(row);
  });

  it("returns empty array when user has no favorite collections", async () => {
    mockCollectionFindMany.mockResolvedValue([] as never);

    const result = await getFavoriteCollections("user-1");

    expect(result).toEqual([]);
  });
});
