import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/items', () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}))

import { auth } from '@/auth'
import { createItem as dbCreateItem, updateItem as dbUpdateItem, deleteItem as dbDeleteItem } from '@/lib/db/items'
import { createItem, updateItem, deleteItem } from '@/actions/items'
import type { ItemDetail } from '@/lib/db/items'

const mockAuth = vi.mocked(auth)
const mockDbCreateItem = vi.mocked(dbCreateItem)
const mockDbUpdateItem = vi.mocked(dbUpdateItem)
const mockDbDeleteItem = vi.mocked(dbDeleteItem)

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

const validCreateInput = {
  itemTypeName: 'snippet' as const,
  title: 'New Snippet',
  description: null,
  content: 'const x = 1',
  url: null,
  language: 'typescript',
  tags: ['react'],
}

describe('createItem action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await createItem(validCreateInput)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Unauthorized')
    expect(mockDbCreateItem).not.toHaveBeenCalled()
  })

  it('returns error when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)
    const result = await createItem(validCreateInput)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Unauthorized')
  })

  it('returns error when title is empty', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createItem({ ...validCreateInput, title: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('Title is required')
  })

  it('returns error when itemTypeName is invalid', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createItem({ ...validCreateInput, itemTypeName: 'file' as never })
    expect(result.success).toBe(false)
  })

  it('returns error when link is missing a URL', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createItem({ ...validCreateInput, itemTypeName: 'link', url: null })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('URL is required')
  })

  it('returns error when url is malformed', async () => {
    mockAuth.mockResolvedValue(makeSession())
    const result = await createItem({ ...validCreateInput, itemTypeName: 'link', url: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('valid URL')
  })

  it('returns error when item type not found in db', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbCreateItem.mockResolvedValue(null)
    const result = await createItem(validCreateInput)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Item type not found')
  })

  it('returns created item on success', async () => {
    const created = makeItemDetail({ title: 'New Snippet' })
    mockAuth.mockResolvedValue(makeSession())
    mockDbCreateItem.mockResolvedValue(created)

    const result = await createItem(validCreateInput)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.title).toBe('New Snippet')
  })

  it('calls db createItem with correct userId from session', async () => {
    mockAuth.mockResolvedValue(makeSession('user-42'))
    mockDbCreateItem.mockResolvedValue(makeItemDetail())

    await createItem(validCreateInput)

    expect(mockDbCreateItem).toHaveBeenCalledWith(
      'user-42',
      expect.objectContaining({ title: 'New Snippet', itemTypeName: 'snippet' }),
    )
  })

  it('returns error on unexpected db failure', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbCreateItem.mockRejectedValue(new Error('DB error'))

    const result = await createItem(validCreateInput)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Failed to create item')
  })
})

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

describe('deleteItem action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await deleteItem('item-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Unauthorized')
    expect(mockDbDeleteItem).not.toHaveBeenCalled()
  })

  it('returns error when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)
    const result = await deleteItem('item-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Unauthorized')
  })

  it('returns error when item not found or not owned', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbDeleteItem.mockResolvedValue(false)
    const result = await deleteItem('item-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Item not found')
  })

  it('returns success when item is deleted', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbDeleteItem.mockResolvedValue(true)
    const result = await deleteItem('item-1')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBeNull()
  })

  it('calls db deleteItem with correct itemId and userId', async () => {
    mockAuth.mockResolvedValue(makeSession('user-42'))
    mockDbDeleteItem.mockResolvedValue(true)
    await deleteItem('item-99')
    expect(mockDbDeleteItem).toHaveBeenCalledWith('item-99', 'user-42')
  })

  it('returns error on unexpected db failure', async () => {
    mockAuth.mockResolvedValue(makeSession())
    mockDbDeleteItem.mockRejectedValue(new Error('DB error'))
    const result = await deleteItem('item-1')
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Failed to delete item')
  })
})
