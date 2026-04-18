'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { getOpenAIClient, AI_MODEL } from '@/lib/openai'
import { checkAiRateLimit } from '@/lib/rate-limit'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const generateDescriptionSchema = z.object({
  title: z.string().trim().min(1),
  itemType: z.string().trim().min(1),
  content: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
})

export async function generateDescription(
  input: z.input<typeof generateDescriptionSchema>,
): Promise<ActionResult<string>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!session.user.isPro) {
    return { success: false, error: 'AI features require a Pro subscription.' }
  }

  const parsed = generateDescriptionSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ')
    return { success: false, error: message }
  }

  const rateCheck = await checkAiRateLimit(session.user.id)
  if (rateCheck.limited) {
    return { success: false, error: rateCheck.error ?? 'Rate limit exceeded.' }
  }

  const { title, itemType, content, url, fileName, language } = parsed.data

  const parts = [
    `Type: ${itemType}`,
    `Title: ${title}`,
    language ? `Language: ${language}` : '',
    url ? `URL: ${url}` : '',
    fileName ? `File: ${fileName}` : '',
    content ? `Content (excerpt): ${content.slice(0, 1500)}` : '',
  ].filter(Boolean)

  try {
    const client = getOpenAIClient()
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a developer tool assistant. Write a concise 1-2 sentence description for the given developer resource. The description should explain what it is and why it is useful. Return ONLY the description text, no quotes, no extra formatting.',
      input: parts.join('\n'),
    })

    const description = response.output_text.trim()
    if (!description) {
      return { success: false, error: 'AI returned an empty response.' }
    }

    return { success: true, data: description }
  } catch (err) {
    console.error('AI description generation error:', err)
    return { success: false, error: 'AI service error. Please try again.' }
  }
}

const explainCodeSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  language: z.string().nullable().optional(),
  itemType: z.enum(['snippet', 'command']),
})

export async function explainCode(
  input: z.input<typeof explainCodeSchema>,
): Promise<ActionResult<string>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!session.user.isPro) {
    return { success: false, error: 'AI features require a Pro subscription.' }
  }

  const parsed = explainCodeSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ')
    return { success: false, error: message }
  }

  const rateCheck = await checkAiRateLimit(session.user.id)
  if (rateCheck.limited) {
    return { success: false, error: rateCheck.error ?? 'Rate limit exceeded.' }
  }

  const { title, content, language, itemType } = parsed.data

  const parts = [
    `Type: ${itemType}`,
    `Title: ${title}`,
    language ? `Language: ${language}` : '',
    `Code:\n${content.slice(0, 3000)}`,
  ].filter(Boolean)

  try {
    const client = getOpenAIClient()
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a developer assistant. Explain what the given code or command does in 200-300 words. Cover what it does, how it works, and any key concepts or patterns used. Use plain markdown with no headers — just well-structured paragraphs and occasional inline code. Be concise and technical.',
      input: parts.join('\n'),
    })

    const explanation = response.output_text.trim()
    if (!explanation) {
      return { success: false, error: 'AI returned an empty response.' }
    }

    return { success: true, data: explanation }
  } catch (err) {
    console.error('AI explain code error:', err)
    return { success: false, error: 'AI service error. Please try again.' }
  }
}

const optimizePromptSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
})

export async function optimizePrompt(
  input: z.input<typeof optimizePromptSchema>,
): Promise<ActionResult<{ optimized: string; note: string }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!session.user.isPro) {
    return { success: false, error: 'AI features require a Pro subscription.' }
  }

  const parsed = optimizePromptSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ')
    return { success: false, error: message }
  }

  const rateCheck = await checkAiRateLimit(session.user.id)
  if (rateCheck.limited) {
    return { success: false, error: rateCheck.error ?? 'Rate limit exceeded.' }
  }

  const { title, content } = parsed.data

  try {
    const client = getOpenAIClient()
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        'You are an expert prompt engineer. Analyze the given AI prompt and return an improved version. Return ONLY a JSON object with two keys: "optimized" (the full improved prompt text) and "note" (a 1-2 sentence explanation of the key improvements made). Do not add any other text.',
      input: `Return JSON. Title: ${title}\n\nPrompt:\n${content.slice(0, 3000)}`,
      text: {
        format: { type: 'json_object' },
      },
    })

    let result: { optimized: string; note: string }
    try {
      result = JSON.parse(response.output_text)
    } catch {
      return { success: false, error: 'Failed to parse AI response.' }
    }

    if (!result?.optimized || typeof result.optimized !== 'string') {
      return { success: false, error: 'AI returned an invalid response.' }
    }

    return {
      success: true,
      data: {
        optimized: result.optimized.trim(),
        note: typeof result.note === 'string' ? result.note.trim() : '',
      },
    }
  } catch (err) {
    console.error('AI prompt optimization error:', err)
    return { success: false, error: 'AI service error. Please try again.' }
  }
}

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().nullable().optional(),
  itemType: z.string().trim().min(1),
})

export async function generateAutoTags(
  input: z.input<typeof generateAutoTagsSchema>,
): Promise<ActionResult<string[]>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!session.user.isPro) {
    return { success: false, error: 'AI features require a Pro subscription.' }
  }

  const parsed = generateAutoTagsSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => e.message).join(', ')
    return { success: false, error: message }
  }

  const rateCheck = await checkAiRateLimit(session.user.id)
  if (rateCheck.limited) {
    return { success: false, error: rateCheck.error ?? 'Rate limit exceeded.' }
  }

  const { title, content, itemType } = parsed.data
  const truncatedContent = content ? content.slice(0, 2000) : ''

  const userInput = [
    `Type: ${itemType}`,
    `Title: ${title}`,
    truncatedContent ? `Content: ${truncatedContent}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const client = getOpenAIClient()
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a developer tool assistant. Suggest 3-5 concise, relevant tags for the given developer resource. Return ONLY a JSON object with a "tags" key containing an array of lowercase strings. No explanation.',
      input: `Suggest tags for this ${itemType} and return JSON:\n\n${userInput}`,
      text: {
        format: { type: 'json_object' },
      },
    })

    const raw = response.output_text
    let tags: string[] = []

    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        tags = parsed
      } else if (Array.isArray(parsed?.tags)) {
        tags = parsed.tags
      }
    } catch {
      return { success: false, error: 'Failed to parse AI response.' }
    }

    const normalized = tags
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.toLowerCase().trim())
      .slice(0, 5)

    return { success: true, data: normalized }
  } catch (err) {
    console.error('AI tag generation error:', err)
    return { success: false, error: 'AI service error. Please try again.' }
  }
}
