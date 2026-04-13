'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type EditorTheme = 'vs-dark' | 'monokai' | 'github-dark'

export interface EditorPreferences {
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  theme: EditorTheme
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark',
}

interface EditorPreferencesContextValue {
  preferences: EditorPreferences
  updatePreference: <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => void
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null)

interface EditorPreferencesProviderProps {
  children: ReactNode
  initialPreferences?: Partial<EditorPreferences>
}

export function EditorPreferencesProvider({ children, initialPreferences }: EditorPreferencesProviderProps) {
  const [preferences, setPreferences] = useState<EditorPreferences>({
    ...DEFAULT_EDITOR_PREFERENCES,
    ...initialPreferences,
  })

  const updatePreference = useCallback(
    <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </EditorPreferencesContext.Provider>
  )
}

export function useEditorPreferences(): EditorPreferencesContextValue {
  const ctx = useContext(EditorPreferencesContext)
  if (!ctx) {
    throw new Error('useEditorPreferences must be used within EditorPreferencesProvider')
  }
  return ctx
}
