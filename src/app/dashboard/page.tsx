import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCollectionsWithMeta, getCollections } from "@/lib/db/collections";
import {
  getPinnedItems,
  getAllItemsPaginated,
  getItemStats,
} from "@/lib/db/items";
import { DASHBOARD_COLLECTIONS_LIMIT } from "@/lib/constants";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionsRow } from "@/components/dashboard/CollectionsRow";
import { ItemsGridClient } from "@/components/dashboard/ItemsGridClient";
import { Pagination } from "@/components/ui/Pagination";
import { Pin, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

const DASHBOARD_ITEMS_PAGE_SIZE = 12;

interface DashboardPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [
    allCollections,
    collectionOptions,
    pinnedItems,
    { items: allItems, totalCount },
    itemStats,
  ] = await Promise.all([
    getCollectionsWithMeta(userId),
    getCollections(userId),
    getPinnedItems(userId),
    getAllItemsPaginated(userId, currentPage, DASHBOARD_ITEMS_PAGE_SIZE),
    getItemStats(userId),
  ]);

  const totalPages = Math.ceil(totalCount / DASHBOARD_ITEMS_PAGE_SIZE);
  const visibleCollections = allCollections.slice(
    0,
    DASHBOARD_COLLECTIONS_LIMIT,
  );
  const hasMoreCollections =
    allCollections.length > DASHBOARD_COLLECTIONS_LIMIT;

  const stats = {
    totalItems: itemStats.totalItems,
    totalCollections: allCollections.length,
    favoriteItems: itemStats.favoriteItems,
    favoriteCollections: allCollections.filter((c) => c.isFavorite).length,
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Collections */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
            Collections
          </h2>
          {hasMoreCollections && (
            <Link
              href="/collections"
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-border text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              Show all {allCollections.length}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <CollectionsRow collections={visibleCollections} />
      </section>

      {/* Pinned Items */}
      {pinnedItems.length > 0 && (
        <section>
          <SectionHeading label="Pinned" icon={<Pin className="h-4 w-4" />} />
          <ItemsGridClient
            items={pinnedItems}
            collections={collectionOptions}
            isPro={session.user.isPro}
          />
        </section>
      )}

      {/* All Items */}
      <section>
        <SectionHeading
          label="All Items"
          icon={<Clock className="h-4 w-4" />}
        />
        <ItemsGridClient items={allItems} collections={collectionOptions} isPro={session.user.isPro} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={(page) => `/dashboard?page=${page}`}
        />
      </section>
    </div>
  );
}

function SectionHeading({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-foreground/40">{icon}</span>}
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </h2>
    </div>
  );
}
