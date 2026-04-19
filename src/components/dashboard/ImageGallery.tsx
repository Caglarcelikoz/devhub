'use client'

import { useState } from 'react'
import { Star, Pin, Download } from 'lucide-react'
import { ItemDrawer } from '@/components/dashboard/ItemDrawer'
import { EmptyState } from '@/components/ui/empty-state'
import type { ItemWithMeta } from '@/lib/db/items'
import type { CollectionOption } from '@/lib/db/collections'

interface ImageGalleryProps {
  items: ItemWithMeta[]
  thumbnailUrls: Record<string, string>
  collections: CollectionOption[]
  isPro: boolean
}

export function ImageGallery({ items, thumbnailUrls, collections, isPro }: ImageGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (items.length === 0) {
    return <EmptyState title="No images yet." />
  }

  return (
    <>
      {/* Responsive CSS grid — let the browser lay out columns, images fill naturally */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
      >
        {items.map((item) => (
          <GalleryTile
            key={item.id}
            item={item}
            thumbnailUrl={thumbnailUrls[item.id]}
            onOpen={() => setSelectedId(item.id)}
          />
        ))}
      </div>

      <ItemDrawer
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
        collections={collections}
        isPro={isPro}
      />
    </>
  )
}

function GalleryTile({
  item,
  thumbnailUrl,
  onOpen,
}: {
  item: ItemWithMeta
  thumbnailUrl?: string
  onOpen: () => void
}) {
  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = `/api/items/${item.id}/download`
    link.download = item.fileName ?? item.title
    link.click()
  }

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className="group relative overflow-hidden rounded-md bg-muted aspect-square cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl ?? `/api/items/${item.id}/download`}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors duration-200" />

      {/* Top badges — always visible if active */}
      <div className="absolute top-2 left-2 flex items-center gap-1">
        {item.isFavorite && (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </span>
        )}
        {item.isPinned && (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm">
            <Pin className="h-3 w-3 fill-white text-white" />
          </span>
        )}
      </div>

      {/* Download button top-right, hover only */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
          aria-label="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title + meta — slides up on hover */}
      <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
        <p className="text-sm font-semibold text-white leading-snug line-clamp-1 drop-shadow">
          {item.title}
        </p>
        {item.fileName && (
          <p className="text-xs text-white/70 truncate mt-0.5 drop-shadow">
            {item.fileName}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/20 text-white backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
