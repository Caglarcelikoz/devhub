"use client";

import { useState, useEffect } from "react";
import { ItemsGrid } from "@/components/dashboard/ItemsGrid";
import { ItemDrawer } from "@/components/dashboard/ItemDrawer";
import { fetchRecentlyViewedItems } from "@/actions/items";
import { getRecentlyViewedIds } from "@/lib/utils/recently-viewed";
import { Eye } from "lucide-react";
import type { ItemWithMeta } from "@/lib/db/items";
import type { CollectionOption } from "@/lib/db/collections";

interface RecentlyViewedSectionProps {
  collections: CollectionOption[];
  isPro: boolean;
}

export function RecentlyViewedSection({ collections, isPro }: RecentlyViewedSectionProps) {
  const [items, setItems] = useState<ItemWithMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ids = getRecentlyViewedIds().slice(0, 3);
    if (ids.length === 0) {
      setReady(true);
      return;
    }
    fetchRecentlyViewedItems(ids).then((result) => {
      if (result.success) {
        setItems(result.data.filter((i) => i.itemType.name !== 'file' && i.itemType.name !== 'image'));
      }
      setReady(true);
    });
  }, []);

  if (!ready || items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-foreground/40">
          <Eye className="h-4 w-4" />
        </span>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
          Recently Viewed
        </h2>
      </div>
      <ItemsGrid
        items={items}
        columns="three"
        onItemClick={(id) => setSelectedId(id)}
      />
      <ItemDrawer
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
        collections={collections}
        isPro={isPro}
      />
    </section>
  );
}
