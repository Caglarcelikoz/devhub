import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createItem, getItemById, updateItem, deleteItem } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    itemType: {
      findFirst: vi.fn(),
    },
    item: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockItemTypeFindFirst = vi.mocked(prisma.itemType.findFirst)
const mockCreate = vi.mocked(prisma.item.create)
const mockFindFirst = vi.mocked(prisma.item.findFirst)
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

  it('returns null when item type is not found', async () => {
    mockItemTypeFindFirst.mockResolvedValue(null)
    const result = await createItem('user-1', {
      title: 'New Snippet',
      description: null,
      content: 'const x = 1',
      url: null,
      language: 'typescript',
      tags: [],
      itemTypeName: 'snippet',
    })
    expect(result).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('calls prisma.item.create with correct data for a text type', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-1', name: 'snippet' } as never)
    mockCreate.mockResolvedValue({
      ...baseRow(),
      collections: [],
    } as never)

    await createItem('user-1', {
      title: 'New Snippet',
      description: 'desc',
      content: 'const x = 1',
      url: null,
      language: 'typescript',
      tags: ['react'],
      itemTypeName: 'snippet',
    })

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
    mockCreate.mockResolvedValue({
      ...baseRow(),
      contentType: 'URL',
      collections: [],
    } as never)

    await createItem('user-1', {
      title: 'My Link',
      description: null,
      content: null,
      url: 'https://example.com',
      language: null,
      tags: [],
      itemTypeName: 'link',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: 'URL' }),
      }),
    )
  })

  it('maps tags and returns empty collections array', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-1', name: 'snippet' } as never)
    mockCreate.mockResolvedValue({
      ...baseRow(),
      tags: [{ name: 'react' }],
      collections: [],
    } as never)

    const result = await createItem('user-1', {
      title: 'T',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: ['react'],
      itemTypeName: 'snippet',
    })

    expect(result?.tags).toEqual(['react'])
    expect(result?.collections).toEqual([])
  })

  it('passes tags as connectOrCreate entries', async () => {
    mockItemTypeFindFirst.mockResolvedValue({ id: 'type-1', name: 'snippet' } as never)
    mockCreate.mockResolvedValue({ ...baseRow(), collections: [] } as never)

    await createItem('user-1', {
      title: 'T',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: ['ts', 'react'],
      itemTypeName: 'snippet',
    })

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
    mockFindFirst.mockResolvedValue({ id: 'item-1' } as never)
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
})
