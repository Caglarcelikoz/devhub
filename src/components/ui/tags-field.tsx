'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { AiFieldLabel } from '@/components/ui/ai-field-label'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { generateAutoTags } from '@/actions/ai'

interface TagsFieldProps {
  value: string
  onChange: (v: string) => void
  isPro?: boolean
  title: string
  content?: string
  itemType: string
  label?: boolean
}

export function TagsField({
  value,
  onChange,
  isPro = false,
  title,
  content,
  itemType,
  label = true,
}: TagsFieldProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [decided, setDecided] = useState<Set<string>>(new Set())

  const currentTags = value.split(',').map((t) => t.trim()).filter(Boolean)
  const visible = suggestions.filter((t) => !decided.has(t))

  async function handleSuggest() {
    if (!title.trim()) {
      toast.error('Add a title before requesting tag suggestions.')
      return
    }
    setLoading(true)
    setSuggestions([])
    setDecided(new Set())

    const result = await generateAutoTags({ title, content, itemType })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    const newTags = result.data.filter((t) => !currentTags.includes(t))
    if (newTags.length === 0) {
      toast.info('No new suggestions — all tags are already added.')
      return
    }
    setSuggestions(newTags)
  }

  function acceptTag(tag: string) {
    setDecided((prev) => new Set([...prev, tag]))
    const merged = [...new Set([...currentTags, tag])]
    onChange(merged.join(', '))
  }

  function acceptAll() {
    const toAdd = visible.filter((t) => !currentTags.includes(t))
    setDecided(new Set(suggestions))
    if (toAdd.length > 0) {
      const merged = [...new Set([...currentTags, ...toAdd])]
      onChange(merged.join(', '))
    }
  }

  function dismissAll() {
    setDecided(new Set(suggestions))
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <AiFieldLabel
          label="Tags"
          isPro={isPro}
          loading={loading}
          onAction={handleSuggest}
          actionLabel="Suggest"
          loadingLabel="Suggesting…"
        />
      )}

      {/* Suggestion pills */}
      {visible.length > 0 && (
        <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2.5 space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {visible.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 leading-none"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => acceptTag(tag)}
                  title={`Add "${tag}"`}
                  className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-primary/25 transition-colors ml-0.5 shrink-0"
                >
                  <Check className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDecided((prev) => new Set([...prev, tag]))}
                  title={`Dismiss "${tag}"`}
                  className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-muted-foreground/20 transition-colors shrink-0"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 border-t border-border/30 pt-2">
            <button
              type="button"
              onClick={acceptAll}
              className="text-xs text-primary/80 hover:text-primary transition-colors font-medium"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={dismissAll}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Dismiss all
            </button>
          </div>
        </div>
      )}

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="react, hooks, auth (comma-separated)"
      />
    </div>
  )
}
