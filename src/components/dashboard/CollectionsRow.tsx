import Link from "next/link";
import { Star } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
}

interface ItemType {
  id: string;
  name: string;
  color: string;
}

interface Item {
  id: string;
  typeId: string;
  collectionId: string | null;
}

interface CollectionsRowProps {
  collections: Collection[];
  itemTypes: ItemType[];
  allItems: Item[];
}

export function CollectionsRow({ collections, itemTypes, allItems }: CollectionsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {collections.map((col) => {
        const colItems = allItems.filter((i) => i.collectionId === col.id);
        const typeBreakdown = itemTypes
          .map((t) => ({
            ...t,
            count: colItems.filter((i) => i.typeId === t.id).length,
          }))
          .filter((t) => t.count > 0);

        return (
          <Link
            key={col.id}
            href={`/dashboard/collections/${col.id}`}
            className="group rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {col.name}
              </h3>
              {col.isFavorite && <Star className="h-3.5 w-3.5 text-amber-400 shrink-0 fill-amber-400" />}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
              {col.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {typeBreakdown.map((t) => (
                  <span
                    key={t.id}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                    title={`${t.count} ${t.name}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {col.itemCount} items
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
