import { z } from 'zod'

export const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(8).max(32),
  tabSize: z.number().int().min(2).max(8),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(['vs-dark', 'monokai', 'github-dark']),
})
