'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateItemDialog } from '@/components/dashboard/CreateItemDialog'
import type { CreatableType } from '@/components/dashboard/CreateItemDialog'

interface NewItemButtonProps {
  defaultType?: CreatableType
  label?: string
}

export function NewItemButton({ defaultType, label = 'New Item' }: NewItemButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        className="h-8 px-3 gap-1.5 text-sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        {label}
      </Button>
      <CreateItemDialog open={open} onOpenChange={setOpen} defaultType={defaultType} />
    </>
  )
}
