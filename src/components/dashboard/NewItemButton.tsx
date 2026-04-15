'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from "sonner";
import { Button } from '@/components/ui/button'
import { CreateItemDialog } from '@/components/dashboard/CreateItemDialog'
import { useUsageLimits } from "@/context/UsageLimitsContext";
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
    if (!canCreateItem) {
      toast.error(
        "You've reached the 50-item limit. Upgrade to Pro for unlimited items.",
        {
          action: {
            label: "Upgrade",
            onClick: () => {
              window.location.href = "/settings#billing";
            },
          },
        },
      );
      return;
    }
    setOpen(true);
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
