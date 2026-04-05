import { Star, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Item {
  id: string;
  title: string;
  description: string;
  content: string;
  typeId: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  language: string | null;
  updatedAt: string;
}

interface ItemType {
  id: string;
  name: string;
  color: string;
}

interface ItemsGridProps {
  items: Item[];
  itemTypes: ItemType[];
}

export function ItemsGrid({ items, itemTypes }: ItemsGridProps) {
  const typeMap = Object.fromEntries(itemTypes.map((t) => [t.id, t]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((item) => {
        const type = typeMap[item.typeId];
        return <ItemCard key={item.id} item={item} type={type} />;
      })}
    </div>
  );
}

function ItemCard({ item, type }: { item: Item; type: ItemType }) {
  const updatedAt = new Date(item.updatedAt);
  const timeAgo = formatTimeAgo(updatedAt);

  return (
    <div className="group rounded-lg border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors cursor-pointer">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex items-center px-2 py-1 rounded text-sm font-medium"
          style={{ backgroundColor: `${type?.color}22`, color: type?.color }}
        >
          {type?.name ?? "Item"}
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground/60 shrink-0">
          {item.isFavorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
          {item.isPinned && <Pin className="h-4 w-4" />}
        </div>
      </div>

      {/* Title */}
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
      {item.content && (
        <pre className="text-sm text-foreground/55 bg-muted rounded px-3 py-2 overflow-hidden line-clamp-3 font-mono leading-relaxed whitespace-pre-wrap">
          {item.content}
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
