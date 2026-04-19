import OpenAI from 'openai'

export const AI_MODEL = 'gpt-5-nano'

let _client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

interface CallAIOptions {
  instructions: string
  input: string
  jsonMode?: boolean
}

export async function callAI({ instructions, input, jsonMode = false }: CallAIOptions): Promise<string> {
  const client = getOpenAIClient()
  const response = await client.responses.create({
    model: AI_MODEL,
    instructions,
    input,
    ...(jsonMode ? { text: { format: { type: 'json_object' } } } : {}),
  })
  return response.output_text
}
