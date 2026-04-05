import Link from "next/link";
import { Star } from "lucide-react";
import type { CollectionWithMeta } from "@/lib/db/collections";

interface CollectionsRowProps {
  collections: CollectionWithMeta[];
}

export function CollectionsRow({ collections }: CollectionsRowProps) {
  if (collections.length === 0) {
    return (
      <p className="text-sm text-foreground/40">No collections yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {collections.map((col) => (
        <Link
          key={col.id}
          href={`/dashboard/collections/${col.id}`}
          className="group rounded-lg border bg-card p-4 hover:opacity-90 transition-opacity"
          style={{
            borderColor: col.dominantColor ?? "hsl(var(--border))",
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-[15px] font-medium text-foreground group-hover:text-primary transition-colors">
              {col.name}
            </h3>
            {col.isFavorite && (
              <Star className="h-4 w-4 text-amber-400 shrink-0 fill-amber-400" />
            )}
          </div>

          <p className="text-sm text-foreground/55 line-clamp-1 mb-3">
            {col.description ?? "No description"}
          </p>

          <div className="flex items-center justify-between">
            {/* Type color dots */}
            <div className="flex gap-1.5">
              {col.typeBreakdown.map((t) => (
                <span
                  key={t.id}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                  title={`${t.count} ${t.name}`}
                />
              ))}
            </div>

            <span className="text-sm text-foreground/50 tabular-nums">
              {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
