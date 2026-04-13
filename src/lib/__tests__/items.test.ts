import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createItem,
  getItemById,
  updateItem,
  deleteItem,
  getSearchItems,
  getItemsByType,
  getFavoriteItems,
} from "@/lib/db/items";

vi.mock('@/lib/prisma', () => ({
  prisma: {
    itemType: {
      findFirst: vi.fn(),
    },
    item: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemCollection: {
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/s3', () => ({
  deleteFromS3: vi.fn().mockResolvedValue(undefined),
}))

import { deleteFromS3 } from '@/lib/s3'
const mockDeleteFromS3 = vi.mocked(deleteFromS3)

import { prisma } from '@/lib/prisma'

const mockItemTypeFindFirst = vi.mocked(prisma.itemType.findFirst)
const mockCreate = vi.mocked(prisma.item.create)
const mockFindFirst = vi.mocked(prisma.item.findFirst)
const mockFindMany = vi.mocked(prisma.item.findMany)
const mockCount = vi.mocked(prisma.item.count)
const mockUpdate = vi.mocked(prisma.item.update)
const mockDelete = vi.mocked(prisma.item.delete)

// Minimal raw row shape returned by Prisma
function makeRow(overrides: Partial<ReturnType<typeof baseRow>> = {}) {
  return { ...baseRow(), ...overrides }
}

function baseRow() {
  return {
    id: 'item-1',
    title: 'My Snippet',
    description: 'A useful snippet',
    content: 'const x = 1',
    contentType: 'TEXT',
    fileUrl: null,
    fileName: null,
    fileSize: null,
    url: null,
    language: 'typescript',
    isFavorite: false,
    isPinned: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    tags: [{ name: 'react' }, { name: 'hooks' }],
    itemType: { id: 'type-1', name: 'snippet', color: '#3b82f6', icon: 'Code' },
    collections: [
      { collection: { id: 'col-1', name: 'React Patterns' } },
    ],
  }
}

describe('createItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseCreateInput = {
    title: 'New Snippet',
    description: null,
    content: 'const x = 1',
    fileUrl: null,
    fileName: null,
    fileSize: null,
    url: null,
    language: 'typescript',
    tags: [] as string[],
    itemTypeName: 'snippet',
    collectionIds: [] as string[],
  }

  it('returns null when item type is not found', async () => {
    mockItemTypeFindFirst.mockResolvedValue(null)
    const result = await createItem('user-1', baseCreateInput)
    expect(result).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('calls prisma.item.create with correct data for a text type', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-1', name: 'snippet' } as never)
    mockCreate.mockResolvedValue({ ...baseRow(), collections: [] } as never)

    await createItem('user-1', { ...baseCreateInput, description: 'desc', tags: ['react'] })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'New Snippet',
          contentType: 'TEXT',
          userId: 'user-1',
          itemTypeId: 'type-1',
        }),
      }),
    )
  })

  it('sets contentType to URL for link items', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-link', name: 'link' } as never)
    mockCreate.mockResolvedValue({ ...baseRow(), contentType: 'URL', collections: [] } as never)

    await createItem('user-1', {
      ...baseCreateInput,
      content: null,
      url: 'https://example.com',
      itemTypeName: 'link',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: 'URL' }),
      }),
    )
  })

  it('sets contentType to FILE for file items', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-file', name: 'file' } as never)
    mockCreate.mockResolvedValue({ ...baseRow(), contentType: 'FILE', collections: [] } as never)

    await createItem('user-1', {
      ...baseCreateInput,
      content: null,
      fileUrl: 'user-1/files/uuid-report.pdf',
      fileName: 'report.pdf',
      fileSize: 204800,
      itemTypeName: 'file',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentType: 'FILE',
          fileUrl: 'user-1/files/uuid-report.pdf',
          fileName: 'report.pdf',
          fileSize: 204800,
        }),
      }),
    )
  })

  it('sets contentType to FILE for image items', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-image', name: 'image' } as never)
    mockCreate.mockResolvedValue({ ...baseRow(), contentType: 'FILE', collections: [] } as never)

    await createItem('user-1', {
      ...baseCreateInput,
      content: null,
      fileUrl: 'user-1/images/uuid-photo.png',
      fileName: 'photo.png',
      fileSize: 512000,
      itemTypeName: 'image',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: 'FILE' }),
      }),
    )
  })

  it('maps tags and returns empty collections array', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-1', name: 'snippet' } as never)
    mockCreate.mockResolvedValue({ ...baseRow(), tags: [{ name: 'react' }], collections: [] } as never)

    const result = await createItem('user-1', { ...baseCreateInput, tags: ['react'] })

    expect(result?.tags).toEqual(['react'])
    expect(result?.collections).toEqual([])
  })

  it('passes tags as connectOrCreate entries', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-1', name: 'snippet' } as never)
    mockCreate.mockResolvedValue({ ...baseRow(), collections: [] } as never)

    await createItem('user-1', { ...baseCreateInput, tags: ['ts', 'react'] })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: {
            connectOrCreate: [
              { where: { name: 'ts' }, create: { name: 'ts' } },
              { where: { name: 'react' }, create: { name: 'react' } },
            ],
          },
        }),
      }),
    )
  })
})

describe('getItemById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when item is not found', async () => {
    mockFindFirst.mockResolvedValue(null)
    const result = await getItemById('missing-id', 'user-1')
    expect(result).toBeNull()
  })

  it('queries by both id and userId (ownership check)', async () => {
    mockFindFirst.mockResolvedValue(null)
    await getItemById('item-1', 'user-42')
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1', userId: 'user-42' },
      }),
    )
  })

  it('maps tags from objects to string array', async () => {
    mockFindFirst.mockResolvedValue(makeRow() as never)
    const result = await getItemById('item-1', 'user-1')
    expect(result?.tags).toEqual(['react', 'hooks'])
  })

  it('maps collections from join table to flat array', async () => {
    mockFindFirst.mockResolvedValue(makeRow() as never)
    const result = await getItemById('item-1', 'user-1')
    expect(result?.collections).toEqual([{ id: 'col-1', name: 'React Patterns' }])
  })

  it('casts contentType string to union type', async () => {
    mockFindFirst.mockResolvedValue(makeRow({ contentType: 'URL' }) as never)
    const result = await getItemById('item-1', 'user-1')
    expect(result?.contentType).toBe('URL')
  })

  it('returns full content without truncation', async () => {
    const longContent = 'x'.repeat(1000)
    mockFindFirst.mockResolvedValue(makeRow({ content: longContent }) as never)
    const result = await getItemById('item-1', 'user-1')
    expect(result?.content).toHaveLength(1000)
  })

  it('includes createdAt in the returned item', async () => {
    mockFindFirst.mockResolvedValue(makeRow() as never)
    const result = await getItemById('item-1', 'user-1')
    expect(result?.createdAt).toEqual(new Date('2024-01-15'))
  })

  it('handles item with no tags and no collections', async () => {
    mockFindFirst.mockResolvedValue(makeRow({ tags: [], collections: [] }) as never)
    const result = await getItemById('item-1', 'user-1')
    expect(result?.tags).toEqual([])
    expect(result?.collections).toEqual([])
  })
})

describe('updateItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when item does not belong to user', async () => {
    mockFindFirst.mockResolvedValue(null)
    const result = await updateItem('item-1', 'user-1', {
      title: 'New Title',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: [],
    })
    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('calls prisma.item.update with correct data', async () => {
    mockFindFirst.mockResolvedValue({ id: 'item-1' } as never)
    mockUpdate.mockResolvedValue(makeRow({ title: 'Updated Title', tags: [{ name: 'ts' }], collections: [] }) as never)

    await updateItem('item-1', 'user-1', {
      title: 'Updated Title',
      description: 'desc',
      content: 'const y = 2',
      url: null,
      language: 'typescript',
      tags: ['ts'],
      collectionIds: [],
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: expect.objectContaining({
          title: 'Updated Title',
          description: 'desc',
          content: 'const y = 2',
          language: 'typescript',
          tags: expect.objectContaining({
            set: [],
            connectOrCreate: [
              { where: { name: 'ts' }, create: { name: 'ts' } },
            ],
          }),
        }),
      }),
    )
  })

  it('maps returned tags and collections correctly', async () => {
    mockFindFirst.mockResolvedValue({ id: 'item-1' } as never)
    mockUpdate.mockResolvedValue(
      makeRow({
        tags: [{ name: 'react' }],
        collections: [{ collection: { id: 'col-2', name: 'My Collection' } }],
      }) as never,
    )

    const result = await updateItem('item-1', 'user-1', {
      title: 'T',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: ['react'],
      collectionIds: [],
    })

    expect(result?.tags).toEqual(['react'])
    expect(result?.collections).toEqual([{ id: 'col-2', name: 'My Collection' }])
  })

  it('disconnects all tags when tags array is empty', async () => {
    mockFindFirst.mockResolvedValue({ id: 'item-1' } as never)
    mockUpdate.mockResolvedValue(makeRow({ tags: [], collections: [] }) as never)

    await updateItem('item-1', 'user-1', {
      title: 'T',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      collectionIds: [],
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: { set: [], connectOrCreate: [] },
        }),
      }),
    )
  })
})

describe('deleteItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when item does not belong to user', async () => {
    mockFindFirst.mockResolvedValue(null)
    const result = await deleteItem('item-1', 'user-1')
    expect(result).toBe(false)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes the item and returns true when ownership is confirmed', async () => {
    mockFindFirst.mockResolvedValue({ id: 'item-1', fileUrl: null } as never)
    mockDelete.mockResolvedValue({} as never)
    const result = await deleteItem('item-1', 'user-1')
    expect(result).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'item-1' } })
  })

  it('checks ownership with both id and userId', async () => {
    mockFindFirst.mockResolvedValue(null)
    await deleteItem('item-99', 'user-42')
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'item-99', userId: 'user-42' } }),
    )
  })

  it('calls deleteFromS3 when item has a fileUrl', async () => {
    mockFindFirst.mockResolvedValue({ id: 'item-1', fileUrl: 'user-1/files/uuid-report.pdf' } as never)
    mockDelete.mockResolvedValue({} as never)
    await deleteItem('item-1', 'user-1')
    expect(mockDeleteFromS3).toHaveBeenCalledWith('user-1/files/uuid-report.pdf')
  })

  it('does not call deleteFromS3 when item has no fileUrl', async () => {
    mockFindFirst.mockResolvedValue({ id: 'item-1', fileUrl: null } as never)
    mockDelete.mockResolvedValue({} as never)
    await deleteItem('item-1', 'user-1')
    expect(mockDeleteFromS3).not.toHaveBeenCalled()
  })
})

describe('getSearchItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mapped search items with description and content preview', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'item-1',
        title: 'useAuth hook',
        description: 'Auth helper hook',
        content: 'const useAuth = () => {}',
        itemType: { name: 'snippet', color: '#3b82f6', icon: 'Code' },
      },
    ] as never)

    const result = await getSearchItems('user-1')

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        itemType: { select: { name: true, color: true, icon: true } },
      },
    })
    expect(result).toEqual([
      {
        id: 'item-1',
        title: 'useAuth hook',
        description: 'Auth helper hook',
        contentPreview: 'const useAuth = () => {}',
        itemType: { name: 'snippet', color: '#3b82f6', icon: 'Code' },
      },
    ])
  })

  it('truncates content preview to 100 characters', async () => {
    const longContent = 'a'.repeat(150)
    mockFindMany.mockResolvedValue([
      {
        id: 'item-1',
        title: 'Long snippet',
        description: null,
        content: longContent,
        itemType: { name: 'snippet', color: '#3b82f6', icon: 'Code' },
      },
    ] as never)

    const result = await getSearchItems('user-1')

    expect(result[0].contentPreview).toHaveLength(100)
  })

  it('sets contentPreview to null when content is null', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'item-1',
        title: 'A link',
        description: null,
        content: null,
        itemType: { name: 'link', color: '#10b981', icon: 'Link' },
      },
    ] as never)

    const result = await getSearchItems('user-1')

    expect(result[0].contentPreview).toBeNull()
  })

  it('returns an empty array when user has no items', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getSearchItems('user-1')

    expect(result).toEqual([])
  })
})

describe('getItemsByType', () => {
  const itemRow = {
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
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns items and totalCount for the given type', async () => {
    mockFindMany.mockResolvedValue([itemRow] as never)
    mockCount.mockResolvedValue(1 as never)

    const result = await getItemsByType('user-1', 'snippet')

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('item-1')
    expect(result.totalCount).toBe(1)
  })

  it('passes correct where clause with userId and typeName', async () => {
    mockFindMany.mockResolvedValue([itemRow] as never)
    mockCount.mockResolvedValue(1 as never)

    await getItemsByType('user-1', 'snippet')

    const expectedWhere = { userId: 'user-1', itemType: { name: 'snippet' } }
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    )
    expect(mockCount).toHaveBeenCalledWith({ where: expectedWhere })
  })

  it('applies skip and take for the given page', async () => {
    mockFindMany.mockResolvedValue([] as never)
    mockCount.mockResolvedValue(50 as never)

    await getItemsByType('user-1', 'snippet', 3, 21)

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 42, take: 21 }),
    )
  })

  it('defaults to page 1 when no page argument is given', async () => {
    mockFindMany.mockResolvedValue([] as never)
    mockCount.mockResolvedValue(0 as never)

    await getItemsByType('user-1', 'snippet')

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 }),
    )
  })

  it('truncates item content to 500 characters', async () => {
    const longContent = 'x'.repeat(600)
    mockFindMany.mockResolvedValue([{ ...itemRow, content: longContent }] as never)
    mockCount.mockResolvedValue(1 as never)

    const result = await getItemsByType('user-1', 'snippet')

    expect(result.items[0].content).toHaveLength(500)
  })

  it('returns empty items and zero totalCount when no items exist', async () => {
    mockFindMany.mockResolvedValue([] as never)
    mockCount.mockResolvedValue(0 as never)

    const result = await getItemsByType('user-1', 'prompt')

    expect(result.items).toEqual([])
    expect(result.totalCount).toBe(0)
  })
})

describe("getFavoriteItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only isFavorite items sorted by updatedAt desc", async () => {
    const row = makeRow({ isFavorite: true });
    mockFindMany.mockResolvedValue([row] as never);

    await getFavoriteItems("user-1");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", isFavorite: true },
        orderBy: { updatedAt: "desc" },
      }),
    );
  });

  it("maps raw rows to ItemWithMeta correctly", async () => {
    const row = makeRow({ isFavorite: true, content: "const x = 1" });
    mockFindMany.mockResolvedValue([row] as never);

    const result = await getFavoriteItems("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].isFavorite).toBe(true);
    expect(result[0].tags).toEqual(["react", "hooks"]);
    expect(result[0].itemType.name).toBe("snippet");
  });

  it("returns empty array when user has no favorites", async () => {
    mockFindMany.mockResolvedValue([] as never);

    const result = await getFavoriteItems("user-1");

    expect(result).toEqual([]);
  });
});
