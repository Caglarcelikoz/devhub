"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CollectionWithMeta } from "@/lib/db/collections";
import { CollectionActionsDropdown } from "./CollectionActions";
import { toggleFavoriteCollection } from "@/actions/collections";

interface CollectionsRowProps {
  collections: CollectionWithMeta[];
}

function FavoriteButton({ collection }: { collection: CollectionWithMeta }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const result = await toggleFavoriteCollection(collection.id);
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title={collection.isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={`flex items-center justify-center h-6 w-6 rounded transition-colors ${
        collection.isFavorite
          ? "text-amber-400 hover:text-amber-500"
          : "text-foreground/20 hover:text-amber-400"
      }`}
    >
      <Star
        className={`h-3.5 w-3.5 ${collection.isFavorite ? "fill-amber-400" : ""}`}
      />
    </button>
  );
}

export function CollectionsRow({ collections }: CollectionsRowProps) {
  if (collections.length === 0) {
    return <EmptyState title="No collections yet." />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {collections.map((col) => (
        <div
          key={col.id}
          className="group relative rounded-lg border bg-card"
          style={{
            borderColor: col.dominantColor ?? "hsl(var(--border))",
          }}
        >
          {/* Clickable card body → navigates to collection */}
          <Link
            href={`/collections/${col.id}`}
            className="block p-5 hover:opacity-90 transition-opacity"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors pr-14">
                {col.name}
              </h3>
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

          {/* Actions: favorite + 3-dot menu — positioned top-right, outside the Link */}
          <div className="absolute top-3 right-3 flex items-center gap-0.5">
            <FavoriteButton collection={col} />
            <CollectionActionsDropdown collection={col} />
          </div>
        </div>
      ))}
    </div>
  );
}
