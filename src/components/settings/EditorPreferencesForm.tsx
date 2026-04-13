'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { updateEditorPreferences } from '@/actions/settings'
import {
  useEditorPreferences,
  type EditorPreferences,
  type EditorTheme,
} from '@/context/EditorPreferencesContext'

const FONT_SIZE_OPTIONS = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24]
const TAB_SIZE_OPTIONS = [2, 4, 8]
const THEME_OPTIONS: { value: EditorTheme; label: string }[] = [
  { value: 'vs-dark', label: 'VS Dark' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'github-dark', label: 'GitHub Dark' },
]

export function EditorPreferencesForm() {
  const { preferences, updatePreference } = useEditorPreferences()

  const save = useCallback(
    async (updated: EditorPreferences) => {
      const result = await updateEditorPreferences(updated)
      if (result.success) {
        toast.success('Editor preferences saved')
      } else {
        toast.error(result.error ?? 'Failed to save preferences')
      }
    },
    []
  )

  function handleChange<K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) {
    updatePreference(key, value)
    save({ ...preferences, [key]: value })
  }

  return (
    <div className="space-y-5">
      {/* Font Size */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Font size</p>
          <p className="text-xs text-muted-foreground">Editor font size in pixels</p>
        </div>
        <Select
          value={String(preferences.fontSize)}
          onValueChange={(val) => handleChange('fontSize', Number(val))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tab Size */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Tab size</p>
          <p className="text-xs text-muted-foreground">Number of spaces per tab</p>
        </div>
        <Select
          value={String(preferences.tabSize)}
          onValueChange={(val) => handleChange('tabSize', Number(val))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAB_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} spaces
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Theme */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground">Color theme for the code editor</p>
        </div>
        <Select
          value={preferences.theme}
          onValueChange={(val) => handleChange('theme', val as EditorTheme)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEME_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Word Wrap */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Word wrap</p>
          <p className="text-xs text-muted-foreground">Wrap long lines in the editor</p>
        </div>
        <Switch
          checked={preferences.wordWrap}
          onCheckedChange={(val) => handleChange('wordWrap', val)}
        />
      </div>

      {/* Minimap */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Minimap</p>
          <p className="text-xs text-muted-foreground">Show code overview on the right side</p>
        </div>
        <Switch
          checked={preferences.minimap}
          onCheckedChange={(val) => handleChange('minimap', val)}
        />
      </div>
    </div>
  )
}
