import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/openai', () => ({
  callAI: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkAiRateLimit: vi.fn(),
}))

import { auth } from '@/auth'
import { callAI } from '@/lib/openai'
import { checkAiRateLimit } from '@/lib/rate-limit'
import { generateAutoTags, generateDescription, explainCode, optimizePrompt } from '@/actions/ai'

function makeSession(isPro = true) {
  return { user: { id: 'user-1', email: 'test@example.com', isPro } }
}

const mockAuth = vi.mocked(auth)
const mockCallAI = vi.mocked(callAI)
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
    mockCallAI.mockResolvedValue(JSON.stringify({ tags: ['react', 'hooks', 'typescript'] }))
    const result = await generateAutoTags({ title: 'useAuth hook', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(['react', 'hooks', 'typescript'])
    }
  })

  it('parses array format correctly', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify(['react', 'state', 'hooks']))
    const result = await generateAutoTags({ title: 'useState example', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(['react', 'state', 'hooks'])
    }
  })

  it('normalizes tags to lowercase', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ tags: ['React', 'HOOKS', 'TypeScript'] }))
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(['react', 'hooks', 'typescript'])
    }
  })

  it('limits output to 5 tags', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }))
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBeLessThanOrEqual(5)
    }
  })

  it('returns error when AI response is not valid JSON', async () => {
    mockCallAI.mockResolvedValue('not valid json')
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('parse')
  })

  it('truncates content to 2000 chars before calling AI', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ tags: ['test'] }))
    const longContent = 'x'.repeat(3000)
    await generateAutoTags({ title: 'test', content: longContent, itemType: 'snippet' })

    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.input).toContain('x'.repeat(2000))
    expect(callArgs.input).not.toContain('x'.repeat(2001))
  })

  it('returns error on AI service failure', async () => {
    mockCallAI.mockRejectedValue(new Error('Service unavailable'))
    const result = await generateAutoTags({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('AI service error')
  })

  it('uses json mode', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ tags: ['test'] }))
    await generateAutoTags({ title: 'test', itemType: 'snippet' })

    expect(mockCallAI).toHaveBeenCalledTimes(1)
    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.jsonMode).toBe(true)
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
    mockCallAI.mockResolvedValue('A reusable React hook for managing authentication state.')
    const result = await generateDescription({ title: 'useAuth hook', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('A reusable React hook for managing authentication state.')
    }
  })

  it('trims whitespace from AI response', async () => {
    mockCallAI.mockResolvedValue('  A concise description.  \n')
    const result = await generateDescription({ title: 'test', itemType: 'note' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('A concise description.')
    }
  })

  it('returns error when AI returns empty string', async () => {
    mockCallAI.mockResolvedValue('')
    const result = await generateDescription({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('empty')
  })

  it('returns error on AI service failure', async () => {
    mockCallAI.mockRejectedValue(new Error('Service unavailable'))
    const result = await generateDescription({ title: 'test', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('AI service error')
  })

  it('includes url in prompt for link type', async () => {
    mockCallAI.mockResolvedValue('A useful developer resource link.')
    await generateDescription({ title: 'React docs', itemType: 'link', url: 'https://react.dev' })

    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.input).toContain('https://react.dev')
  })

  it('includes fileName in prompt for file type', async () => {
    mockCallAI.mockResolvedValue('An uploaded project file.')
    await generateDescription({ title: 'Project config', itemType: 'file', fileName: 'tsconfig.json' })

    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.input).toContain('tsconfig.json')
  })

  it('truncates content to 1500 chars before calling AI', async () => {
    mockCallAI.mockResolvedValue('A snippet description.')
    const longContent = 'a'.repeat(2000)
    await generateDescription({ title: 'test', itemType: 'snippet', content: longContent })

    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.input).toContain('a'.repeat(1500))
    expect(callArgs.input).not.toContain('a'.repeat(1501))
  })
})

describe('explainCode', () => {
  it('returns error when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const result = await explainCode({ title: 'test', content: 'console.log(1)', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('returns error for free users', async () => {
    mockAuth.mockResolvedValue(makeSession(false) as never)
    const result = await explainCode({ title: 'test', content: 'console.log(1)', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Pro subscription')
  })

  it('returns error when rate limited', async () => {
    mockCheckAiRateLimit.mockResolvedValue({ limited: true, error: 'AI rate limit reached.' })
    const result = await explainCode({ title: 'test', content: 'console.log(1)', itemType: 'snippet' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('rate limit')
  })

  it('returns validation error for empty title', async () => {
    const result = await explainCode({ title: '', content: 'console.log(1)', itemType: 'snippet' })
    expect(result.success).toBe(false)
  })

  it('returns validation error for empty content', async () => {
    const result = await explainCode({ title: 'test', content: '', itemType: 'snippet' })
    expect(result.success).toBe(false)
  })

  it('returns validation error for invalid itemType', async () => {
    // @ts-expect-error testing invalid input
    const result = await explainCode({ title: 'test', content: 'code', itemType: 'note' })
    expect(result.success).toBe(false)
  })

  it('returns explanation on success', async () => {
    mockCallAI.mockResolvedValue('This snippet uses console.log to output the number 1.')
    const result = await explainCode({ title: 'log snippet', content: 'console.log(1)', itemType: 'snippet' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('This snippet uses console.log to output the number 1.')
    }
  })

  it('trims whitespace from AI response', async () => {
    mockCallAI.mockResolvedValue('  An explanation.  \n')
    const result = await explainCode({ title: 'test', content: 'ls -la', itemType: 'command' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('An explanation.')
    }
  })

  it('returns error when AI returns empty string', async () => {
    mockCallAI.mockResolvedValue('')
    const result = await explainCode({ title: 'test', content: 'ls -la', itemType: 'command' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('empty')
  })

  it('returns error on AI service failure', async () => {
    mockCallAI.mockRejectedValue(new Error('Service unavailable'))
    const result = await explainCode({ title: 'test', content: 'ls -la', itemType: 'command' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('AI service error')
  })

  it('includes language in prompt when provided', async () => {
    mockCallAI.mockResolvedValue('Explanation here.')
    await explainCode({ title: 'hook', content: 'const x = 1', language: 'typescript', itemType: 'snippet' })

    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.input).toContain('typescript')
  })

  it('truncates content to 3000 chars before calling AI', async () => {
    mockCallAI.mockResolvedValue('Explanation.')
    const longContent = 'x'.repeat(4000)
    await explainCode({ title: 'test', content: longContent, itemType: 'snippet' })

    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.input).toContain('x'.repeat(3000))
    expect(callArgs.input).not.toContain('x'.repeat(3001))
  })
})

describe('optimizePrompt', () => {
  const validOutput = JSON.stringify({
    optimized: 'You are an expert assistant. Do X clearly and concisely.',
    note: 'Added explicit role and clarified the instruction.',
  })

  it('returns error when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null as never)
    const result = await optimizePrompt({ title: 'My prompt', content: 'Do X.' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Unauthorized')
  })

  it('returns error for free users', async () => {
    mockAuth.mockResolvedValue(makeSession(false) as never)
    const result = await optimizePrompt({ title: 'My prompt', content: 'Do X.' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('Pro subscription')
  })

  it('returns error when rate limited', async () => {
    mockCheckAiRateLimit.mockResolvedValue({ limited: true, error: 'AI rate limit reached.' })
    const result = await optimizePrompt({ title: 'My prompt', content: 'Do X.' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('rate limit')
  })

  it('returns validation error for empty title', async () => {
    const result = await optimizePrompt({ title: '', content: 'Do X.' })
    expect(result.success).toBe(false)
  })

  it('returns validation error for empty content', async () => {
    const result = await optimizePrompt({ title: 'My prompt', content: '' })
    expect(result.success).toBe(false)
  })

  it('returns optimized prompt and note on success', async () => {
    mockCallAI.mockResolvedValue(validOutput)
    const result = await optimizePrompt({ title: 'My prompt', content: 'Do X.' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.optimized).toBe('You are an expert assistant. Do X clearly and concisely.')
      expect(result.data.note).toBe('Added explicit role and clarified the instruction.')
    }
  })

  it('trims whitespace from optimized and note fields', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ optimized: '  Refined prompt.  ', note: '  Some note.  ' }))
    const result = await optimizePrompt({ title: 'test', content: 'Do X.' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.optimized).toBe('Refined prompt.')
      expect(result.data.note).toBe('Some note.')
    }
  })

  it('returns error when AI returns invalid JSON', async () => {
    mockCallAI.mockResolvedValue('not json')
    const result = await optimizePrompt({ title: 'test', content: 'Do X.' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('parse')
  })

  it('returns error when optimized field is missing', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ note: 'A note.' }))
    const result = await optimizePrompt({ title: 'test', content: 'Do X.' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('invalid')
  })

  it('returns empty string for note when note field is missing', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ optimized: 'Better prompt.' }))
    const result = await optimizePrompt({ title: 'test', content: 'Do X.' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.note).toBe('')
    }
  })

  it('returns error on AI service failure', async () => {
    mockCallAI.mockRejectedValue(new Error('Service unavailable'))
    const result = await optimizePrompt({ title: 'test', content: 'Do X.' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toContain('AI service error')
  })

  it('truncates content to 3000 chars before calling AI', async () => {
    mockCallAI.mockResolvedValue(validOutput)
    const longContent = 'p'.repeat(4000)
    await optimizePrompt({ title: 'test', content: longContent })

    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.input).toContain('p'.repeat(3000))
    expect(callArgs.input).not.toContain('p'.repeat(3001))
  })

  it('includes title and json keyword in the AI prompt input', async () => {
    mockCallAI.mockResolvedValue(validOutput)
    await optimizePrompt({ title: 'My special prompt', content: 'Do X.' })

    const callArgs = mockCallAI.mock.calls[0][0]
    expect(callArgs.input).toContain('My special prompt')
    expect(callArgs.input.toLowerCase()).toContain('json')
  })
})
