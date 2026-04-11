'use client'

import { useState, useCallback } from 'react'
import {
  Star,
  Pin,
  Copy,
  Pencil,
  Trash2,
  Tag,
  FolderOpen,
  Calendar,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import type { ItemDetail } from '@/lib/db/items'

interface ItemDrawerProps {
  itemId: string | null
  onClose: () => void
}

export function ItemDrawer({ itemId, onClose }: ItemDrawerProps) {
  const [item, setItem] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prevItemId, setPrevItemId] = useState<string | null>(null)

  // Fetch when itemId changes
  if (itemId !== prevItemId) {
    setPrevItemId(itemId)
    if (itemId) {
      setItem(null)
      setError(null)
      setLoading(true)
      fetch(`/api/items/${itemId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load item')
          return res.json()
        })
        .then((data: ItemDetail) => {
          setItem(data)
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to load item')
          setLoading(false)
        })
    } else {
      setItem(null)
      setError(null)
      setLoading(false)
    }
  }

  return (
    <Sheet open={itemId !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" showCloseButton className="w-120! max-w-[90vw]! p-0 flex flex-col overflow-hidden gap-0">
        {loading && <DrawerSkeleton />}
        {error && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {error}
          </div>
        )}
        {!loading && !error && item && <DrawerBody item={item} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

// ─── Drawer body ────────────────────────────────────────────────────────────

function DrawerBody({ item, onClose }: { item: ItemDetail; onClose: () => void }) {
  const { itemType } = item
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const text = item.contentType === 'URL' ? (item.url ?? '') : (item.content ?? '')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [item])

  const createdDate = formatDate(new Date(item.createdAt))
  const updatedDate = formatDate(new Date(item.updatedAt))
  const preview = item.contentType === 'URL' ? item.url : item.content

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <SheetHeader className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-2 pr-8">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0"
            style={{ backgroundColor: `${itemType.color}18`, color: itemType.color }}
          >
            {itemType.name.charAt(0).toUpperCase() + itemType.name.slice(1)}
          </span>
          {item.language && (
            <span className="text-xs text-muted-foreground">{item.language}</span>
          )}
        </div>
        <h2 className="text-base font-semibold text-foreground leading-snug mt-1">
          {item.title}
        </h2>
      </SheetHeader>

      {/* ── Action bar ── */}
      <div
        className="flex items-center gap-0.5 px-4 py-2 border-y border-border/60 shrink-0 overflow-x-auto scrollbar-none"
      >
        <ActionButton
          icon={<Star className={`h-4 w-4 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />}
          label={item.isFavorite ? 'Unfavorite' : 'Favorite'}
        />
        <ActionButton
          icon={<Pin className={`h-4 w-4 ${item.isPinned ? 'text-foreground' : ''}`} />}
          label={item.isPinned ? 'Unpin' : 'Pin'}
        />
        <ActionButton
          icon={<Copy className="h-4 w-4" />}
          label={copied ? 'Copied!' : 'Copy'}
          onClick={handleCopy}
        />
        <ActionButton
          icon={<Pencil className="h-4 w-4" />}
          label="Edit"
        />
        <div className="ml-auto shrink-0">
          <ActionButton
            icon={<Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />}
            label="Delete"
            destructive
          />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Description */}
        {item.description && (
          <Section label="Description">
            <p className="text-sm text-foreground/70 leading-relaxed">{item.description}</p>
          </Section>
        )}

        {/* Content */}
        {preview && (
          <Section label="Content">
            <div
              className="rounded-md border p-3"
              style={{ borderColor: `${itemType.color}30`, backgroundColor: `${itemType.color}06` }}
            >
              <pre className="text-xs text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap wrap-break-word">
                {preview}
              </pre>
            </div>
          </Section>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <Section label="Tags" icon={<Tag className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 h-auto font-normal rounded-md"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Collections */}
        {item.collections.length > 0 && (
          <Section label="Collections" icon={<FolderOpen className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((col) => (
                <Badge
                  key={col.id}
                  variant="outline"
                  className="text-xs px-2 py-0.5 h-auto font-normal rounded-md"
                >
                  {col.name}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Details */}
        <Section label="Details" icon={<Calendar className="h-3.5 w-3.5" />}>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/45">Created</span>
              <span className="text-foreground/70 tabular-nums">{createdDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/45">Updated</span>
              <span className="text-foreground/70 tabular-nums">{updatedDate}</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-foreground/40">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
        destructive
          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DrawerSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="px-5 pt-5 pb-4 space-y-2.5">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
      </div>
      {/* Action bar skeleton */}
      <div className="flex items-center gap-2 px-4 py-2 border-y border-border/60">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-16 rounded-md bg-muted" />
        ))}
      </div>
      {/* Body skeleton */}
      <div className="flex-1 px-5 py-4 space-y-5">
        {[80, 140, 60, 60].map((h, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="rounded-md bg-muted" style={{ height: h }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
