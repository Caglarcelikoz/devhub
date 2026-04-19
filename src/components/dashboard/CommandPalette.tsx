'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Folder, File } from 'lucide-react'
import { ITEM_TYPE_ICONS } from '@/lib/constants/item-types'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import type { SearchItem } from '@/lib/db/items'
import type { SearchCollection } from '@/lib/db/collections'


interface CommandPaletteProps {
  items: SearchItem[]
  collections: SearchCollection[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemSelect: (id: string) => void
}

export function CommandPalette({
  items,
  collections,
  open,
  onOpenChange,
  onItemSelect,
}: CommandPaletteProps) {
  const router = useRouter()

  const handleItemSelect = useCallback(
    (id: string) => {
      onOpenChange(false)
      onItemSelect(id)
    },
    [onOpenChange, onItemSelect],
  )

  const handleCollectionSelect = useCallback(
    (id: string) => {
      onOpenChange(false)
      router.push(`/collections/${id}`)
    },
    [onOpenChange, router],
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search" description="Search items and collections">
      <Command>
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {items.length > 0 && (
          <CommandGroup heading="Items">
            {items.map((item) => {
              const Icon = ITEM_TYPE_ICONS[item.itemType.name as keyof typeof ITEM_TYPE_ICONS] ?? File
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.description ?? ''} ${item.itemType.name}`}
                  onSelect={() => handleItemSelect(item.id)}
                  className="gap-2.5"
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{ color: item.itemType.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="truncate">{item.title}</span>
                  {item.description && (
                    <span className="ml-auto truncate max-w-[200px] text-xs text-muted-foreground hidden sm:block">
                      {item.description}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {items.length > 0 && collections.length > 0 && <CommandSeparator />}

        {collections.length > 0 && (
          <CommandGroup heading="Collections">
            {collections.map((col) => (
              <CommandItem
                key={col.id}
                value={col.name}
                onSelect={() => handleCollectionSelect(col.id)}
                className="gap-2.5"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground">
                  <Folder className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{col.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {col.itemCount} {col.itemCount === 1 ? 'item' : 'items'}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
