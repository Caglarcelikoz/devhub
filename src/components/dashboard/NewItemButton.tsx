'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateItemDialog } from '@/components/dashboard/CreateItemDialog'
import { useUsageLimits } from "@/context/UsageLimitsContext";
import { showItemLimitToast } from '@/lib/limits'
import type { CreatableType } from '@/components/dashboard/CreateItemDialog'
import type { CollectionOption } from '@/lib/db/collections'

interface NewItemButtonProps {
  defaultType?: CreatableType
  label?: string
  collections?: CollectionOption[]
}

export function NewItemButton({ defaultType, label = 'New Item', collections = [] }: NewItemButtonProps) {
  const { canCreateItem } = useUsageLimits();
  const [open, setOpen] = useState(false)

  function handleClick() {
    if (!canCreateItem) { showItemLimitToast(); return }
    setOpen(true)
  }

  return (
    <>
      <Button
        size="sm"
        className="h-8 px-3 gap-1.5 text-sm"
        onClick={handleClick}
      >
        <Plus className="h-3.5 w-3.5" />
        {label}
      </Button>
      <CreateItemDialog
        open={open}
        onOpenChange={setOpen}
        defaultType={defaultType}
        collections={collections}
      />
    </>
  );
}
