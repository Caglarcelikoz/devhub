'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { getOpenAIClient, AI_MODEL } from '@/lib/openai'
import { checkAiRateLimit } from '@/lib/rate-limit'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

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
