"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  tags: string[];
  activeTag: string | null;
}

export function TagFilter({ tags, activeTag }: TagFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (tags.length === 0) return null;

  function buildHref(tag: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, tag: string | null) {
    e.preventDefault();
    router.push(buildHref(tag), { scroll: false });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <Tag className="w-3 h-3" />
        Filter by tag
      </span>
      <div className="w-px h-3.5 bg-border shrink-0" />
      {activeTag && (
        <a
          href={buildHref(null)}
          onClick={(e) => handleClick(e, null)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-foreground/10 text-foreground hover:bg-foreground/15 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </a>
      )}
      {tags.map((tag) => {
        const isActive = tag === activeTag;
        return (
          <a
            key={tag}
            href={buildHref(tag)}
            onClick={(e) => handleClick(e, isActive ? null : tag)}
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "bg-foreground/6 text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
            )}
          >
            {tag}
          </a>
        );
      })}
    </div>
  );

}
