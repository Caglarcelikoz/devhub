import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserUsage, canCreateItem, canCreateCollection, FREE_TIER_LIMITS } from '@/lib/usage'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      count: vi.fn(),
    },
    collection: {
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockItemCount = vi.mocked(prisma.item.count)
const mockCollectionCount = vi.mocked(prisma.collection.count)

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getUserUsage ─────────────────────────────────────────────────────────────

describe('getUserUsage', () => {
  it('free user under both limits can create items and collections', async () => {
    mockItemCount.mockResolvedValue(10)
    mockCollectionCount.mockResolvedValue(1)

    const result = await getUserUsage('user-1', false)

    expect(result.itemCount).toBe(10)
    expect(result.collectionCount).toBe(1)
    expect(result.canCreateItem).toBe(true)
    expect(result.canCreateCollection).toBe(true)
  })

  it('free user at item limit cannot create items', async () => {
    mockItemCount.mockResolvedValue(FREE_TIER_LIMITS.MAX_ITEMS)
    mockCollectionCount.mockResolvedValue(1)

    const result = await getUserUsage('user-1', false)

    expect(result.canCreateItem).toBe(false)
    expect(result.canCreateCollection).toBe(true)
  })

  it('free user at collection limit cannot create collections', async () => {
    mockItemCount.mockResolvedValue(5)
    mockCollectionCount.mockResolvedValue(FREE_TIER_LIMITS.MAX_COLLECTIONS)

    const result = await getUserUsage('user-1', false)

    expect(result.canCreateItem).toBe(true)
    expect(result.canCreateCollection).toBe(false)
  })

  it('Pro user at item limit can still create items', async () => {
    mockItemCount.mockResolvedValue(FREE_TIER_LIMITS.MAX_ITEMS)
    mockCollectionCount.mockResolvedValue(1)

    const result = await getUserUsage('user-1', true)

    expect(result.canCreateItem).toBe(true)
  })

  it('Pro user at collection limit can still create collections', async () => {
    mockItemCount.mockResolvedValue(5)
    mockCollectionCount.mockResolvedValue(FREE_TIER_LIMITS.MAX_COLLECTIONS)

    const result = await getUserUsage('user-1', true)

    expect(result.canCreateCollection).toBe(true)
  })
})

// ─── canCreateItem ────────────────────────────────────────────────────────────

describe('canCreateItem', () => {
  it('returns true for free user under the item limit', async () => {
    mockItemCount.mockResolvedValue(0)

    const result = await canCreateItem('user-1', false)

    expect(result).toBe(true)
    expect(mockItemCount).toHaveBeenCalledOnce()
  })

  it('returns false for free user at the item limit', async () => {
    mockItemCount.mockResolvedValue(FREE_TIER_LIMITS.MAX_ITEMS)

    const result = await canCreateItem('user-1', false)

    expect(result).toBe(false)
  })

  it('returns true for Pro user at the item limit without querying the DB', async () => {
    const result = await canCreateItem('user-1', true)

    expect(result).toBe(true)
    expect(mockItemCount).not.toHaveBeenCalled()
  })
})

// ─── canCreateCollection ──────────────────────────────────────────────────────

describe('canCreateCollection', () => {
  it('returns true for free user under the collection limit', async () => {
    mockCollectionCount.mockResolvedValue(0)

    const result = await canCreateCollection('user-1', false)

    expect(result).toBe(true)
    expect(mockCollectionCount).toHaveBeenCalledOnce()
  })

  it('returns false for free user at the collection limit', async () => {
    mockCollectionCount.mockResolvedValue(FREE_TIER_LIMITS.MAX_COLLECTIONS)

    const result = await canCreateCollection('user-1', false)

    expect(result).toBe(false)
  })

  it('returns true for Pro user at the collection limit without querying the DB', async () => {
    const result = await canCreateCollection('user-1', true)

    expect(result).toBe(true)
    expect(mockCollectionCount).not.toHaveBeenCalled()
  })
})
