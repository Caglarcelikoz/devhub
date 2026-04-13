import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function Pagination({ currentPage, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 pt-4"
    >
      {/* Prev */}
      {hasPrev ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center justify-center w-8 h-8 rounded-md text-foreground/20 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex items-center justify-center w-8 h-8 text-sm text-muted-foreground select-none"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors",
              item === currentPage
                ? "bg-foreground text-background font-medium pointer-events-none"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/8"
            )}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </Link>
        )
      )}

      {/* Next */}
      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center justify-center w-8 h-8 rounded-md text-foreground/20 cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}

/** Produces a compact list of page numbers + "ellipsis" sentinels. */
function buildPageList(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const result: Array<number | "ellipsis"> = [];

  result.push(1);

  if (current > 3) result.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) result.push(i);

  if (current < total - 2) result.push("ellipsis");

  result.push(total);

  return result;
}
