'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateDescription } from '@/actions/ai'

interface DescriptionFieldProps {
  value: string
  onChange: (v: string) => void
  isPro?: boolean
  title: string
  itemType: string
  content?: string
  url?: string
  fileName?: string
  language?: string
  rows?: number
  className?: string
}

export function DescriptionField({
  value,
  onChange,
  isPro = false,
  title,
  itemType,
  content,
  url,
  fileName,
  language,
  rows = 3,
  className,
}: DescriptionFieldProps) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!title.trim()) {
      toast.error('Add a title before generating a description.')
      return
    }
    setLoading(true)
    const result = await generateDescription({ title, itemType, content, url, fileName, language })
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    onChange(result.data)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between min-h-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
          Description
        </span>
        {isPro && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {loading ? 'Generating…' : 'Generate'}
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional description…"
        rows={rows}
        className={
          className ??
          'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none placeholder:text-muted-foreground'
        }
      />
    </div>
  )
}
