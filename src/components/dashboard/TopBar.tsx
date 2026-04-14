"use client";

import { useState, useEffect } from "react";
import { Search, Plus, FolderPlus, LayoutGrid, List, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateItemDialog } from "@/components/dashboard/CreateItemDialog";
import { CreateCollectionDialog } from "@/components/dashboard/CreateCollectionDialog";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { ItemDrawer } from "@/components/dashboard/ItemDrawer";
import type { CollectionOption } from "@/lib/db/collections";
import type { SearchItem } from "@/lib/db/items";
import type { SearchCollection } from "@/lib/db/collections";

interface TopBarProps {
  collections?: CollectionOption[];
  searchItems?: SearchItem[];
  searchCollections?: SearchCollection[];
}

export function TopBar({
  collections = [],
  searchItems = [],
  searchCollections = [],
}: TopBarProps) {
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-14 shrink-0 flex items-center gap-3 px-5 border-b border-border bg-background">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-foreground mr-2 hover:text-primary transition-colors"
        >
          DevHub
        </Link>

        <div className="flex-1 sm:max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="w-full h-9 pl-9 pr-3 text-sm text-left text-muted-foreground bg-muted rounded-md border border-transparent hover:border-border transition-colors flex items-center justify-between"
          >
            <span>Search items...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-xs text-muted-foreground/60 font-mono">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Favorites — hidden on mobile (accessible via sidebar drawer) */}
          <Link
            href="/favorites"
            aria-label="Favorites"
            className="hidden sm:inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Star className="h-4 w-4" />
          </Link>

          {/* View toggles — not meaningful on single-column mobile layout */}
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8">
            <List className="h-4 w-4" />
          </Button>

          {/* Full CTA buttons on sm+ */}
          <Button
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex h-9 px-4 gap-2 text-sm"
            onClick={() => setCollectionDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4" />
            New Collection
          </Button>
          <Button
            size="sm"
            className="hidden sm:inline-flex h-9 px-4 gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setItemDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Item
          </Button>

          {/* Collapsed + dropdown on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="sm:hidden inline-flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" aria-label="Create new">
              <Plus className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setItemDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCollectionDialogOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CreateItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        collections={collections}
      />
      <CreateCollectionDialog
        open={collectionDialogOpen}
        onOpenChange={setCollectionDialogOpen}
      />

      <CommandPalette
        items={searchItems}
        collections={searchCollections}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onItemSelect={(id) => setDrawerItemId(id)}
      />

      <ItemDrawer
        itemId={drawerItemId}
        onClose={() => setDrawerItemId(null)}
        collections={collections}
      />
    </>
  );
}
