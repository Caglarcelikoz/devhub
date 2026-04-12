'use client'

import { useState } from 'react'
import { ItemsGrid } from '@/components/dashboard/ItemsGrid'
import { FileListView } from '@/components/dashboard/FileListView'
import { ItemDrawer } from '@/components/dashboard/ItemDrawer'
import type { ItemWithMeta } from '@/lib/db/items'
import type { CollectionOption } from '@/lib/db/collections'

interface ItemsGridClientProps {
  items: ItemWithMeta[]
  columns?: 'auto' | 'two' | 'three'
  layout?: 'grid' | 'list'
  thumbnailUrls?: Record<string, string>
  collections?: CollectionOption[]
}

export function ItemsGridClient({ items, columns, layout = 'grid', thumbnailUrls, collections = [] }: ItemsGridClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      {layout === 'list' ? (
        <FileListView items={items} onItemClick={(id) => setSelectedId(id)} />
      ) : (
        <ItemsGrid
          items={items}
          columns={columns}
          onItemClick={(id) => setSelectedId(id)}
          thumbnailUrls={thumbnailUrls}
        />
      )}
      <ItemDrawer
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
        collections={collections}
      />
    </>
  )
}
