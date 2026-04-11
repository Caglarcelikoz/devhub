import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getItemById } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindFirst = vi.mocked(prisma.item.findFirst)

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
