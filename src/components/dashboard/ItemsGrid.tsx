import { Star, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ItemWithMeta } from "@/lib/db/items";

interface ItemsGridProps {
  items: ItemWithMeta[];
}

export function ItemsGrid({ items }: ItemsGridProps) {
  if (items.length === 0) {
    return <p className="text-sm text-foreground/40">No items yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ItemCard({ item }: { item: ItemWithMeta }) {
  const { itemType } = item;
  const timeAgo = formatTimeAgo(item.updatedAt);
  const preview = item.contentType === "URL" ? item.url : item.content;

  return (
    <div
      className="group rounded-lg border bg-card p-4 flex flex-col gap-3 hover:opacity-90 transition-opacity cursor-pointer"
      style={{ borderColor: `${itemType.color}55` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
          style={{ backgroundColor: `${itemType.color}22`, color: itemType.color }}
        >
          {itemType.name}
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground/60 shrink-0">
          {item.isFavorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
          {item.isPinned && <Pin className="h-4 w-4" />}
        </div>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-1">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-foreground/60 mt-1 line-clamp-2 leading-snug">
            {item.description}
          </p>
        )}
      </div>

      {/* Content preview */}
      {preview && (
        <pre className="text-sm text-foreground/55 bg-muted rounded px-3 py-2 overflow-hidden line-clamp-3 font-mono leading-relaxed whitespace-pre-wrap">
          {preview}
        </pre>
      )}

      {/* Tags + timestamp */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs px-2 py-1 h-auto font-normal rounded-md"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <span className="text-xs text-foreground/40 shrink-0 tabular-nums">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}
