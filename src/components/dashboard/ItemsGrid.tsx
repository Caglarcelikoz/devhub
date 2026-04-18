"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Pin, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageThumbnailCard } from "@/components/dashboard/ImageThumbnailCard";
import { toggleFavorite, togglePin } from "@/actions/items";
import type { ItemWithMeta } from "@/lib/db/items";

interface ItemsGridProps {
  items: ItemWithMeta[];
  columns?: "auto" | "two" | "three";
  onItemClick?: (id: string) => void;
  thumbnailUrls?: Record<string, string>;
  emptyMessage?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
}

export function ItemsGrid({ items, columns = "auto", onItemClick, thumbnailUrls, emptyMessage = "No items yet.", onEmptyAction, emptyActionLabel }: ItemsGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <p className="text-base text-foreground/40">{emptyMessage}</p>
        {onEmptyAction && emptyActionLabel && (
          <button
            type="button"
            onClick={onEmptyAction}
            className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  const gridClass =
    columns === "two"
      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
      : columns === "three"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div className={gridClass}>
      {items.map((item) =>
        item.itemType.name === "image" ? (
          <ImageThumbnailCard key={item.id} item={item} onItemClick={onItemClick} thumbnailUrl={thumbnailUrls?.[item.id]} />
        ) : (
          <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
        )
      )}
    </div>
  );
}

function ItemCard({ item, onItemClick }: { item: ItemWithMeta; onItemClick?: (id: string) => void }) {
  const router = useRouter();
  const { itemType } = item;
  const timeAgo = formatTimeAgo(item.updatedAt);
  const preview = item.contentType === "URL" ? item.url : item.content;
  const copyText = item.contentType === "URL" ? item.url : item.content;
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(item.isPinned);
  const [togglingPin, setTogglingPin] = useState(false);

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (togglingFavorite) return;
    setTogglingFavorite(true);
    setIsFavorite((prev) => !prev);
    const result = await toggleFavorite(item.id);
    setTogglingFavorite(false);
    if (!result.success) {
      setIsFavorite((prev) => !prev); // revert
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleTogglePin(e: React.MouseEvent) {
    e.stopPropagation();
    if (togglingPin) return;
    setTogglingPin(true);
    setIsPinned((prev) => !prev);
    const result = await togglePin(item.id);
    setTogglingPin(false);
    if (!result.success) {
      setIsPinned((prev) => !prev); // revert
      toast.error(result.error);
    }
  }

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!copyText) return;
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      onClick={() => onItemClick?.(item.id)}
      className="group relative rounded-lg border bg-card p-5 flex flex-col gap-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: `${itemType.color}40` }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-5 right-5 h-0.5 rounded-b-full opacity-60"
        style={{ backgroundColor: itemType.color }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 pt-1">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium"
          style={{
            backgroundColor: `${itemType.color}18`,
            color: itemType.color,
          }}
        >
          {itemType.name}
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground/60 shrink-0">
          <button
            onClick={handleToggleFavorite}
            disabled={togglingFavorite}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={`p-0.5 rounded transition-opacity cursor-pointer ${
              isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${isFavorite ? "fill-amber-400 text-amber-400" : "hover:text-amber-400"}`}
            />
          </button>
          <button
            onClick={handleTogglePin}
            disabled={togglingPin}
            title={isPinned ? "Unpin" : "Pin"}
            className={`p-0.5 rounded transition-opacity cursor-pointer ${
              isPinned
                ? "opacity-100 text-foreground"
                : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <Pin
              className={`h-3.5 w-3.5 ${isPinned ? "fill-foreground" : "hover:text-foreground"}`}
            />
          </button>
          {copyText && (
            <button
              onClick={handleCopy}
              className="p-0.5 rounded hover:text-foreground cursor-pointer"
              title="Copy"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Title + description */}
      <div>
        <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-1">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-[15px] text-foreground/55 mt-1 line-clamp-2 leading-snug">
            {item.description}
          </p>
        )}
      </div>

      {/* Content preview */}
      {preview && (
        <div
          className="flex min-w-0"
          style={{ borderLeft: `2px solid ${itemType.color}50` }}
        >
          <pre className="text-sm text-foreground/50 overflow-hidden line-clamp-3 font-mono leading-relaxed whitespace-pre-wrap pl-2.5">
            {preview}
          </pre>
        </div>
      )}

      {/* Tags + timestamp */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {item.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-sm px-2 py-0.5 h-auto font-normal rounded-md"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <span className="text-sm text-foreground/35 shrink-0 tabular-nums">
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
