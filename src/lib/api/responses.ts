import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export function apiError(message: string, status = 500, cause?: unknown) {
  if (cause) console.error(message, cause)
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function zodErrorResponse(error: ZodError) {
  const message = error.issues[0]?.message ?? 'Invalid input'
  return apiError(message, 400)
}
