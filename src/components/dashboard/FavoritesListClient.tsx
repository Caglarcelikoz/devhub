"use client";

import { useState } from "react";
import { Star, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { ItemDrawer } from "@/components/dashboard/ItemDrawer";
import type { ItemWithMeta } from "@/lib/db/items";
import type {
  FavoriteCollection,
  CollectionOption,
} from "@/lib/db/collections";

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

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
  const router = useRouter();

  const hasItems = items.length > 0;
  const hasCollections = collections.length > 0;

  if (!hasItems && !hasCollections) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-foreground/8">
          <Star className="w-5 h-5 text-foreground/40" />
        </div>
        <p className="text-sm text-foreground/40 font-mono">
          No favorites yet.
        </p>
        <p className="text-xs text-foreground/30 font-mono">
          Star items or collections to find them here quickly.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Items section */}
        {hasItems && (
          <section>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-border/50">
              <span className="text-xs font-mono text-foreground/50 uppercase tracking-widest">
                Items
              </span>
              <span className="text-xs font-mono text-foreground/30">
                ({items.length})
              </span>
            </div>
            <ul className="divide-y divide-border/30">
              {items.map((item) => (
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
                    <span className="flex-1 text-sm font-mono text-foreground truncate">
                      {item.title}
                    </span>
                    {/* Type badge */}
                    <span
                      className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${item.itemType.color}22`,
                        color: item.itemType.color,
                      }}
                    >
                      {item.itemType.name}
                    </span>
                    {/* Date */}
                    <span className="shrink-0 text-xs font-mono text-foreground/35 w-16 text-right">
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
              <span className="text-xs font-mono text-foreground/50 uppercase tracking-widest">
                Collections
              </span>
              <span className="text-xs font-mono text-foreground/30">
                ({collections.length})
              </span>
            </div>
            <ul className="divide-y divide-border/30">
              {collections.map((col) => (
                <li key={col.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/collections/${col.id}`)}
                    className="w-full flex items-center gap-3 px-1.5 py-2 text-left hover:bg-foreground/4 rounded transition-colors group"
                  >
                    {/* Folder icon */}
                    <FolderOpen className="shrink-0 w-3 h-3 text-foreground/40" />
                    {/* Name */}
                    <span className="flex-1 text-sm font-mono text-foreground truncate">
                      {col.name}
                    </span>
                    {/* Type badge */}
                    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-foreground/8 text-foreground/50">
                      collection
                    </span>
                    {/* Date */}
                    <span className="shrink-0 text-xs font-mono text-foreground/35 w-16 text-right">
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
