'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, FolderOpen } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { CollectionOption } from '@/lib/db/collections'

interface CollectionSelectorProps {
  collections: CollectionOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export function CollectionSelector({ collections, selected, onChange }: CollectionSelectorProps) {
  const [open, setOpen] = useState(false)

  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id],
    )
  }

  const label =
    selected.length === 0
      ? 'No collections'
      : selected.length === 1
        ? (collections.find((c) => c.id === selected[0])?.name ?? '1 collection')
        : `${selected.length} collections`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        role="combobox"
        aria-expanded={open}
        className="w-full flex items-center justify-between rounded-md border border-input bg-transparent px-3 h-9 text-sm font-normal hover:bg-accent transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={selected.length === 0 ? 'text-muted-foreground' : ''}>{label}</span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        {collections.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">No collections yet</p>
        ) : (
          <ul className="space-y-0.5">
            {collections.map((col) => {
              const checked = selected.includes(col.id)
              return (
                <li key={col.id}>
                  <button
                    type="button"
                    onClick={() => toggle(col.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-left hover:bg-accent transition-colors"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-transparent'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate">{col.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
