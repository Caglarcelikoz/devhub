'use server'

import { auth } from '@/auth'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from '@/context/EditorPreferencesContext'
import { editorPreferencesSchema } from '@/lib/editor-preferences'
import type { ActionResult } from '@/types/actions'

export async function updateEditorPreferences(
  preferences: EditorPreferences
): Promise<ActionResult<null>> {
  const session = await requireAuth()
  if (!session) return { success: false, error: 'Unauthorized' }

  const parsed = editorPreferencesSchema.safeParse(preferences)
  if (!parsed.success) {
    return { success: false, error: 'Invalid preferences' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: parsed.data },
  })

  return { success: true, data: null }
}

export async function getEditorPreferences(): Promise<EditorPreferences> {
  const session = await auth()
  if (!session?.user?.id) {
    return DEFAULT_EDITOR_PREFERENCES
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { editorPreferences: true },
  })

  if (!user?.editorPreferences) {
    return DEFAULT_EDITOR_PREFERENCES
  }

  const parsed = editorPreferencesSchema.safeParse(user.editorPreferences)
  if (!parsed.success) {
    return DEFAULT_EDITOR_PREFERENCES
  }

  return parsed.data
}
