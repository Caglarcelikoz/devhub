"use client";

import { useState } from "react";
import { Search, Plus, FolderPlus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateItemDialog } from "@/components/dashboard/CreateItemDialog";
import { CreateCollectionDialog } from "@/components/dashboard/CreateCollectionDialog";

export function TopBar() {
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);

  return (
    <>
      <header className="h-14 shrink-0 flex items-center gap-3 px-5 border-b border-border bg-background">
        <span className="text-base font-semibold text-foreground mr-2">DevHub</span>

        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            className="pl-9 h-9 text-sm bg-muted border-transparent focus-visible:border-border"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-4 gap-2 text-sm"
            onClick={() => setCollectionDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            New Collection
          </Button>
          <Button
            size="sm"
            className="h-9 px-4 gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setItemDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Item
          </Button>
        </div>
      </header>

      <CreateItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen} />
      <CreateCollectionDialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen} />
    </>
  );
}
