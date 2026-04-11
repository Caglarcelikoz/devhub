import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/items', () => ({
  updateItem: vi.fn(),
}))

import { auth } from '@/auth'
import { updateItem as dbUpdateItem } from '@/lib/db/items'
import { updateItem } from '@/actions/items'
import type { ItemDetail } from '@/lib/db/items'

const mockAuth = vi.mocked(auth)
const mockDbUpdateItem = vi.mocked(dbUpdateItem)

function makeSession(userId = 'user-1') {
  return { user: { id: userId, email: 'test@example.com' } }
}

function makeItemDetail(overrides: Partial<ItemDetail> = {}): ItemDetail {
  return {
    id: 'item-1',
    title: 'My Snippet',
    description: null,
    content: 'const x = 1',
    contentType: 'TEXT',
    url: null,
    language: 'typescript',
    isFavorite: false,
    isPinned: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    tags: [],
    collections: [],
    itemType: { id: 'type-1', name: 'snippet', color: '#3b82f6', icon: 'Code' },
    ...overrides,
  }
}

const validInput = {
  title: 'Updated Title',
  description: null,
  content: 'const y = 2',
  url: null,
  language: 'typescript',
  tags: ['react', 'hooks'],
}

describe('updateItem action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await updateItem('item-1', validInput)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
    expect(mockDbUpdateItem).not.toHaveBeenCalled()
  })

  it('returns error when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)
    const result = await updateItem('item-1', validInput)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('returns error when title is empty', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await updateItem('item-1', { ...validInput, title: '   ' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Title is required')
  })

  it('returns error when url is invalid', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await updateItem('item-1', { ...validInput, url: 'not-a-url' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('valid URL')
  })

  it('accepts null url', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbUpdateItem.mockResolvedValue(makeItemDetail())
    const result = await updateItem('item-1', { ...validInput, url: null })
    expect(result.success).toBe(true)
  })

  it('returns error when item not found or not owned', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbUpdateItem.mockResolvedValue(null)
    const result = await updateItem('item-1', validInput)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Item not found')
  })

  it('returns updated item on success', async () => {
    const updated = makeItemDetail({ title: 'Updated Title', tags: ['react', 'hooks'] })
    mockAuth.mockResolvedValue(makeSession())
    mockDbUpdateItem.mockResolvedValue(updated)

    const result = await updateItem('item-1', validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Updated Title')
      expect(result.data.tags).toEqual(['react', 'hooks'])
    }
  })

  it('calls db updateItem with correct userId from session', async () => {
    mockAuth.mockResolvedValue(makeSession('user-42'))
    mockDbUpdateItem.mockResolvedValue(makeItemDetail())

    await updateItem('item-1', validInput)

    expect(mockDbUpdateItem).toHaveBeenCalledWith(
      'item-1',
      'user-42',
      expect.objectContaining({ title: 'Updated Title' }),
    )
  })

  it('trims whitespace from tags', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbUpdateItem.mockResolvedValue(makeItemDetail())

    await updateItem('item-1', { ...validInput, tags: ['  react  ', ' hooks'] })

    expect(mockDbUpdateItem).toHaveBeenCalledWith(
      'item-1',
      expect.any(String),
      expect.objectContaining({ tags: ['react', 'hooks'] }),
    )
  })

  it('returns error on unexpected db failure', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbUpdateItem.mockRejectedValue(new Error('DB connection failed'))

    const result = await updateItem('item-1', validInput)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to update item')
  })
})
