'use client'

import { useState } from 'react'
import { ItemsGrid } from '@/components/dashboard/ItemsGrid'
import { ItemDrawer } from '@/components/dashboard/ItemDrawer'
import type { ItemWithMeta } from '@/lib/db/items'

interface ItemsGridClientProps {
  items: ItemWithMeta[]
  columns?: 'auto' | 'two'
}

export function ItemsGridClient({ items, columns }: ItemsGridClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <ItemsGrid
        items={items}
        columns={columns}
        onItemClick={(id) => setSelectedId(id)}
      />
      <ItemDrawer
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
