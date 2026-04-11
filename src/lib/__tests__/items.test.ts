import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getItemById, updateItem, deleteItem } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

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
    mockFindFirst.mockResolvedValue(makeRow())
    const result = await getItemById('item-1', 'user-1')
    expect(result?.tags).toEqual(['react', 'hooks'])
  })

  it('maps collections from join table to flat array', async () => {
    mockFindFirst.mockResolvedValue(makeRow())
    const result = await getItemById('item-1', 'user-1')
    expect(result?.collections).toEqual([{ id: 'col-1', name: 'React Patterns' }])
  })

  it('casts contentType string to union type', async () => {
    mockFindFirst.mockResolvedValue(makeRow({ contentType: 'URL' }))
    const result = await getItemById('item-1', 'user-1')
    expect(result?.contentType).toBe('URL')
  })

  it('returns full content without truncation', async () => {
    const longContent = 'x'.repeat(1000)
    mockFindFirst.mockResolvedValue(makeRow({ content: longContent }))
    const result = await getItemById('item-1', 'user-1')
    expect(result?.content).toHaveLength(1000)
  })

  it('includes createdAt in the returned item', async () => {
    mockFindFirst.mockResolvedValue(makeRow())
    const result = await getItemById('item-1', 'user-1')
    expect(result?.createdAt).toEqual(new Date('2024-01-15'))
  })

  it('handles item with no tags and no collections', async () => {
    mockFindFirst.mockResolvedValue(makeRow({ tags: [], collections: [] }))
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
    mockFindFirst.mockResolvedValue({ id: 'item-1' })
    mockUpdate.mockResolvedValue(makeRow({ title: 'Updated Title', tags: [{ name: 'ts' }], collections: [] }))

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
    mockFindFirst.mockResolvedValue({ id: 'item-1' })
    mockUpdate.mockResolvedValue(
      makeRow({
        tags: [{ name: 'react' }],
        collections: [{ collection: { id: 'col-2', name: 'My Collection' } }],
      }),
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
    mockFindFirst.mockResolvedValue({ id: 'item-1' })
    mockUpdate.mockResolvedValue(makeRow({ tags: [], collections: [] }))

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
