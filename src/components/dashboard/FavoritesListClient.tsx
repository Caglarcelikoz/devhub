"use client";

import { useState, useMemo } from "react";
import { Star, FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";
import { ItemDrawer } from "@/components/dashboard/ItemDrawer";
import type { ItemWithMeta } from "@/lib/db/items";
import type {
  FavoriteCollection,
  CollectionOption,
} from "@/lib/db/collections";
import { formatTimeAgo } from "@/lib/utils/time";

type SortKey = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "type-asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-desc", label: "Newest" },
  { value: "date-asc", label: "Oldest" },
  { value: "name-asc", label: "Name A→Z" },
  { value: "name-desc", label: "Name Z→A" },
  { value: "type-asc", label: "Type A→Z" },
];

interface FavoritesListClientProps {
  items: ItemWithMeta[];
  collections: FavoriteCollection[];
  collectionOptions: CollectionOption[];
}

export function FavoritesListClient({
  items,
  collections,
  collectionOptions,
}: FavoritesListClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("date-desc");
  const router = useRouter();

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        case "date-desc":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        case "type-asc":
          return (
            a.itemType.name.localeCompare(b.itemType.name) ||
            a.title.localeCompare(b.title)
          );
      }
    });
  }, [items, sort]);

  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        case "date-desc":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "name-asc":
        case "type-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
      }
    });
  }, [collections, sort]);

  const hasItems = items.length > 0;
  const hasCollections = collections.length > 0;

  if (!hasItems && !hasCollections) {
    return (
      <EmptyState
        icon={<Star className="w-5 h-5 text-foreground/40" />}
        title="No favorites yet."
        description="Star items or collections to find them here quickly."
      />
    )
  }

  return (
    <>
      <div className="space-y-8">
        {/* Sort control */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-foreground/40">sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-sm font-mono bg-transparent border border-border/50 rounded px-2 py-1 text-foreground/70 hover:border-border transition-colors outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Items section */}
        {hasItems && (
          <section>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-border/50">
              <span className="text-[11px] font-mono text-foreground/50 uppercase tracking-widest">
                Items
              </span>
              <span className="text-[11px] font-mono text-foreground/30">
                ({items.length})
              </span>
            </div>
            <ul className="divide-y divide-border/30">
              {sortedItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="w-full flex items-center gap-3 px-1.5 py-2 text-left hover:bg-foreground/4 rounded transition-colors group"
                  >
                    {/* Color dot */}
                    <span
                      className="shrink-0 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.itemType.color }}
                    />
                    {/* Title */}
                    <span className="flex-1 text-[15px] font-mono text-foreground truncate">
                      {item.title}
                    </span>
                    {/* Type badge */}
                    <span
                      className="shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${item.itemType.color}22`,
                        color: item.itemType.color,
                      }}
                    >
                      {item.itemType.name}
                    </span>
                    {/* Date */}
                    <span className="shrink-0 text-[11px] font-mono text-foreground/35 w-16 text-right">
                      {formatTimeAgo(item.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Collections section */}
        {hasCollections && (
          <section>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-border/50">
              <span className="text-[11px] font-mono text-foreground/50 uppercase tracking-widest">
                Collections
              </span>
              <span className="text-[11px] font-mono text-foreground/30">
                ({collections.length})
              </span>
            </div>
            <ul className="divide-y divide-border/30">
              {sortedCollections.map((col) => (
                <li key={col.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/collections/${col.id}`)}
                    className="w-full flex items-center gap-3 px-1.5 py-2 text-left hover:bg-foreground/4 rounded transition-colors group"
                  >
                    {/* Folder icon */}
                    <FolderOpen className="shrink-0 w-3 h-3 text-foreground/40" />
                    {/* Name */}
                    <span className="flex-1 text-[15px] font-mono text-foreground truncate">
                      {col.name}
                    </span>
                    {/* Type badge */}
                    <span className="shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded bg-foreground/8 text-foreground/50">
                      collection
                    </span>
                    {/* Date */}
                    <span className="shrink-0 text-[11px] font-mono text-foreground/35 w-16 text-right">
                      {formatTimeAgo(col.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ItemDrawer
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
        collections={collectionOptions}
      />
    </>
  );
}
