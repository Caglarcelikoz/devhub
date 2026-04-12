import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCollectionsWithMeta, getCollections } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems, getItemStats } from "@/lib/db/items";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionsRow } from "@/components/dashboard/CollectionsRow";
import { ItemsGridClient } from "@/components/dashboard/ItemsGridClient";
import { Pin, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [collections, collectionOptions, pinnedItems, recentItems, itemStats] = await Promise.all([
    getCollectionsWithMeta(userId),
    getCollections(userId),
    getPinnedItems(userId),
    getRecentItems(userId, 10),
    getItemStats(userId),
  ]);

  const stats = {
    totalItems: itemStats.totalItems,
    totalCollections: collections.length,
    favoriteItems: itemStats.favoriteItems,
    favoriteCollections: collections.filter((c) => c.isFavorite).length,
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Collections */}
      <section>
        <SectionHeading label="Collections" />
        <CollectionsRow collections={collections} />
      </section>

      {/* Pinned Items */}
      {pinnedItems.length > 0 && (
        <section>
          <SectionHeading label="Pinned" icon={<Pin className="h-4 w-4" />} />
          <ItemsGridClient items={pinnedItems} collections={collectionOptions} />
        </section>
      )}

      {/* Recent Items */}
      <section>
        <SectionHeading label="All Items" icon={<Clock className="h-4 w-4" />} />
        <ItemsGridClient items={recentItems} collections={collectionOptions} />
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
      <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </h2>
    </div>
  );
}
