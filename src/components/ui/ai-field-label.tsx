'use client'

import { Sparkles, Loader2 } from 'lucide-react'

interface AiFieldLabelProps {
  label: string
  isPro: boolean
  loading: boolean
  onAction: () => void
  actionLabel: string
  loadingLabel: string
}

export function AiFieldLabel({
  label,
  isPro,
  loading,
  onAction,
  actionLabel,
  loadingLabel,
}: AiFieldLabelProps) {
  return (
    <div className="flex items-center justify-between min-h-[1.25rem]">
      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
        {label}
      </span>
      {isPro && (
        <button
          type="button"
          onClick={onAction}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {loading ? loadingLabel : actionLabel}
        </button>
      )}
    </div>
  )
}
