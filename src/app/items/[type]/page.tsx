import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getItemsByType, getTagsByType } from "@/lib/db/items";
import { getCollections } from "@/lib/db/collections";
import { getSignedDownloadUrl } from "@/lib/s3";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { ItemsGridClient } from "@/components/dashboard/ItemsGridClient";
import { NewItemButton } from "@/components/dashboard/NewItemButton";
import { SortControls } from "@/components/dashboard/SortControls";
import { TagFilter } from "@/components/dashboard/TagFilter";
import { Pagination } from "@/components/ui/Pagination";
import type { CreatableType } from "@/components/dashboard/CreateItemDialog";
import type { ItemSortOption } from "@/lib/db/items";

const VALID_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

const CREATABLE_TYPES: readonly string[] = ["snippet", "prompt", "command", "note", "link", "file", "image"];

type ValidType = (typeof VALID_TYPES)[number];

const TYPE_ICONS: Record<ValidType, LucideIcon> = {
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: Image,
  link: LinkIcon,
};

const TYPE_COLORS: Record<ValidType, string> = {
  snippet: "#3b82f6",
  prompt: "#8b5cf6",
  command: "#f97316",
  note: "#fde047",
  file: "#6b7280",
  image: "#ec4899",
  link: "#10b981",
};

const SLUG_TO_TYPE: Record<string, ValidType> = {
  snippets: "snippet",
  prompts: "prompt",
  commands: "command",
  notes: "note",
  files: "file",
  images: "image",
  links: "link",
};

function typeSlugToName(slug: string): ValidType | undefined {
  return SLUG_TO_TYPE[slug];
}

const VALID_SORTS: ItemSortOption[] = [
  "pinned",
  "newest",
  "oldest",
  "updated",
  "title_asc",
  "title_desc",
];

interface ItemsPageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string; sort?: string; tag?: string }>;
}

export default async function ItemsPage({
  params,
  searchParams,
}: ItemsPageProps) {
  const { type: slug } = await params;
  const typeName = typeSlugToName(slug);

  if (!typeName) {
    notFound();
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Gate file/image pages for free users
  if ((typeName === "file" || typeName === "image") && !session.user.isPro) {
    redirect("/upgrade");
  }

  const { page: pageParam, sort: sortParam, tag: tagParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const currentSort: ItemSortOption =
    VALID_SORTS.includes(sortParam as ItemSortOption)
      ? (sortParam as ItemSortOption)
      : "pinned";
  const activeTag = tagParam ?? null;

  const [{ items, totalCount }, collectionOptions, allTags] = await Promise.all([
    getItemsByType(session.user.id, typeName, currentPage, ITEMS_PER_PAGE, currentSort, activeTag ?? undefined),
    getCollections(session.user.id),
    getTagsByType(session.user.id, typeName),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // For image items, pre-generate short-lived signed URLs server-side so
  // thumbnails don't go through the buffering download proxy.
  const thumbnailUrls: Record<string, string> = {};
  if (typeName === "image") {
    await Promise.all(
      items
        .filter((item) => item.fileUrl)
        .map(async (item) => {
          thumbnailUrls[item.id] = await getSignedDownloadUrl(
            item.fileUrl!,
            300,
          );
        }),
    );
  }

  const label = typeName.charAt(0).toUpperCase() + typeName.slice(1) + "s";
  const Icon = TYPE_ICONS[typeName];
  const typeColor = TYPE_COLORS[typeName];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ backgroundColor: `${typeColor}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: typeColor }} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground leading-none">
            {label}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </p>
        </div>
        {totalCount > 0 && <SortControls currentSort={currentSort} />}
        {CREATABLE_TYPES.includes(typeName) && (
          <NewItemButton
            defaultType={typeName as CreatableType}
            label={`New ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}`}
            collections={collectionOptions}
          />
        )}
      </div>

      {/* Tag filter */}
      <TagFilter tags={allTags} activeTag={activeTag} />

      {/* Grid */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ backgroundColor: `${typeColor}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: typeColor }} />
          </div>
          <p className="text-base text-foreground/40">No {typeName}s yet.</p>
          {CREATABLE_TYPES.includes(typeName) && (
            <NewItemButton
              defaultType={typeName as CreatableType}
              label={`New ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}`}
              collections={collectionOptions}
            />
          )}
        </div>
      ) : (
        <>
          <ItemsGridClient
            items={items}
            columns={typeName === "file" ? "two" : "three"}
            layout={typeName === "file" ? "list" : "grid"}
            thumbnailUrls={thumbnailUrls}
            collections={collectionOptions}
            isPro={session.user.isPro}
            hideTypeBadge
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildHref={(page) => {
              const params = new URLSearchParams();
              params.set("page", String(page));
              if (currentSort !== "pinned") params.set("sort", currentSort);
              if (activeTag) params.set("tag", activeTag);
              return `/items/${slug}?${params.toString()}`;
            }}
          />
        </>
      )}
    </div>
  );
}
