import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/openai', () => ({
  getOpenAIClient: vi.fn(),
  AI_MODEL: 'gpt-5-nano',
}))

vi.mock('@/lib/rate-limit', () => ({
  checkAiRateLimit: vi.fn(),
}))

import { auth } from '@/auth'
import { getOpenAIClient } from '@/lib/openai'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { generateAutoTags, generateDescription } from '@/actions/ai'

function makeSession(isPro = true) {
  return { user: { id: 'user-1', email: 'test@example.com', isPro } }
}

function makeOpenAIClient(outputText: string) {
  return {
    responses: {
      create: vi.fn().mockResolvedValue({ output_text: outputText }),
    },
  }
}

const mockAuth = vi.mocked(auth)
const mockGetOpenAIClient = vi.mocked(getOpenAIClient)
const mockCheckAiRateLimit = vi.mocked(checkAiRateLimit)

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(makeSession() as never)
  mockCheckAiRateLimit.mockResolvedValue({ limited: false })
})

describe('generateAutoTags', () => {
  it('returns error when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('returns error for free users', async () => {
    mockAuth.mockResolvedValue(makeSession(false) as never)
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Pro subscription')
  })

  it('returns error when rate limited', async () => {
    mockCheckAiRateLimit.mockResolvedValue({ limited: true, error: 'AI rate limit reached.' })
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('rate limit')
  })

  it('returns validation error for empty title', async () => {
    const result = await generateAutoTags({ title: '', itemType: 'snippet' })
    expect(result.success).toBe(false)
  })

  it('parses {"tags": [...]} format correctly', async () => {
    mockGetOpenAIClient.mockReturnValue(
      makeOpenAIClient(JSON.stringify({ tags: ['react', 'hooks', 'typescript'] })) as never,
    )
    const result = await generateAutoTags({ title: 'useAuth hook', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(['react', 'hooks', 'typescript'])
    }
  })

  it('parses array format correctly', async () => {
    mockGetOpenAIClient.mockReturnValue(
      makeOpenAIClient(JSON.stringify(['react', 'state', 'hooks'])) as never,
    )
    const result = await generateAutoTags({ title: 'useState example', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(['react', 'state', 'hooks'])
    }
  })

  it('normalizes tags to lowercase', async () => {
    mockGetOpenAIClient.mockReturnValue(
      makeOpenAIClient(JSON.stringify({ tags: ['React', 'HOOKS', 'TypeScript'] })) as never,
    )
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(['react', 'hooks', 'typescript'])
    }
  })

  it('limits output to 5 tags', async () => {
    mockGetOpenAIClient.mockReturnValue(
      makeOpenAIClient(JSON.stringify({ tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] })) as never,
    )
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBeLessThanOrEqual(5)
    }
  })

  it('returns error when AI response is not valid JSON', async () => {
    mockGetOpenAIClient.mockReturnValue(
      makeOpenAIClient('not valid json') as never,
    )
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('parse')
  })

  it('truncates content to 2000 chars before calling AI', async () => {
    const client = makeOpenAIClient(JSON.stringify({ tags: ['test'] }))
    mockGetOpenAIClient.mockReturnValue(client as never)

    const longContent = 'x'.repeat(3000)
    await generateAutoTags({ title: 'test', content: longContent, itemType: 'snippet' })

    const callArgs = client.responses.create.mock.calls[0][0]
    expect(callArgs.input).toContain('x'.repeat(2000))
    expect(callArgs.input).not.toContain('x'.repeat(2001))
  })

  it('returns error on AI service failure', async () => {
    mockGetOpenAIClient.mockReturnValue({
      responses: {
        create: vi.fn().mockRejectedValue(new Error('Service unavailable')),
      },
    } as never)
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('AI service error')
  })

  it('uses the Responses API (not Chat Completions)', async () => {
    const client = makeOpenAIClient(JSON.stringify({ tags: ['test'] }))
    mockGetOpenAIClient.mockReturnValue(client as never)

    await generateAutoTags({ title: 'test', itemType: 'snippet' })

    expect(client.responses.create).toHaveBeenCalledTimes(1)
    const callArgs = client.responses.create.mock.calls[0][0]
    expect(callArgs.model).toBe('gpt-5-nano')
    expect(callArgs.text?.format?.type).toBe('json_object')
  })
})

describe('generateDescription', () => {
  it('returns error when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const result = await generateDescription({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('returns error for free users', async () => {
    mockAuth.mockResolvedValue(makeSession(false) as never)
    const result = await generateDescription({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Pro subscription')
  })

  it('returns error when rate limited', async () => {
    mockCheckAiRateLimit.mockResolvedValue({ limited: true, error: 'AI rate limit reached.' })
    const result = await generateDescription({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('rate limit')
  })

  it('returns validation error for empty title', async () => {
    const result = await generateDescription({ title: '', itemType: 'snippet' })
    expect(result.success).toBe(false)
  })

  it('returns description on success', async () => {
    mockGetOpenAIClient.mockReturnValue(
      makeOpenAIClient('A reusable React hook for managing authentication state.') as never,
    )
    const result = await generateDescription({ title: 'useAuth hook', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('A reusable React hook for managing authentication state.')
    }
  })

  it('trims whitespace from AI response', async () => {
    mockGetOpenAIClient.mockReturnValue(
      makeOpenAIClient('  A concise description.  \n') as never,
    )
    const result = await generateDescription({ title: 'test', itemType: 'note' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('A concise description.')
    }
  })

  it('returns error when AI returns empty string', async () => {
    mockGetOpenAIClient.mockReturnValue(makeOpenAIClient('') as never)
    const result = await generateDescription({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('empty')
  })

  it('returns error on AI service failure', async () => {
    mockGetOpenAIClient.mockReturnValue({
      responses: {
        create: vi.fn().mockRejectedValue(new Error('Service unavailable')),
      },
    } as never)
    const result = await generateDescription({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('AI service error')
  })

  it('includes url in prompt for link type', async () => {
    const client = makeOpenAIClient('A useful developer resource link.')
    mockGetOpenAIClient.mockReturnValue(client as never)

    await generateDescription({ title: 'React docs', itemType: 'link', url: 'https://react.dev' })

    const callArgs = client.responses.create.mock.calls[0][0]
    expect(callArgs.input).toContain('https://react.dev')
  })

  it('includes fileName in prompt for file type', async () => {
    const client = makeOpenAIClient('An uploaded project file.')
    mockGetOpenAIClient.mockReturnValue(client as never)

    await generateDescription({ title: 'Project config', itemType: 'file', fileName: 'tsconfig.json' })

    const callArgs = client.responses.create.mock.calls[0][0]
    expect(callArgs.input).toContain('tsconfig.json')
  })

  it('truncates content to 1500 chars before calling AI', async () => {
    const client = makeOpenAIClient('A snippet description.')
    mockGetOpenAIClient.mockReturnValue(client as never)

    const longContent = 'a'.repeat(2000)
    await generateDescription({ title: 'test', itemType: 'snippet', content: longContent })

    const callArgs = client.responses.create.mock.calls[0][0]
    expect(callArgs.input).toContain('a'.repeat(1500))
    expect(callArgs.input).not.toContain('a'.repeat(1501))
  })
})
