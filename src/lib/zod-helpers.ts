import { z } from 'zod'

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => e.message).join(', ')
}

export const optionalString = z.string().trim().nullable().optional().transform((v) => v ?? null)
