"use client";

import { Star, Pin } from "lucide-react";
import type { ItemWithMeta } from "@/lib/db/items";

interface ImageThumbnailCardProps {
  item: ItemWithMeta;
  onItemClick?: (id: string) => void;
  thumbnailUrl?: string;
}

export function ImageThumbnailCard({ item, onItemClick, thumbnailUrl }: ImageThumbnailCardProps) {
  const imageColor = "#ec4899"; // image type pink

  return (
    <div
      onClick={() => onItemClick?.(item.id)}
      className="group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: `${imageColor}40` }}
    >
      {/* Thumbnail */}
      <div className="aspect-video overflow-hidden bg-muted relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl ?? `/api/items/${item.id}/download`}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Overlay badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {item.isFavorite && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/50">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </span>
          )}
          {item.isPinned && (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/50">
              <Pin className="h-3 w-3 text-white" />
            </span>
          )}
        </div>
      </div>

      {/* Info row */}
      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-1">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-xs text-foreground/50 mt-0.5 line-clamp-1">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
