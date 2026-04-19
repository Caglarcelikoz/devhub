'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { generateDescription } from '@/actions/ai'
import { AiFieldLabel } from '@/components/ui/ai-field-label'

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
      <AiFieldLabel
        label="Description"
        isPro={isPro}
        loading={loading}
        onAction={handleGenerate}
        actionLabel="Generate"
        loadingLabel="Generating…"
      />
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
