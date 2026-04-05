import { getCollectionsWithMeta } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems, getItemStats } from "@/lib/db/items";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionsRow } from "@/components/dashboard/CollectionsRow";
import { ItemsGrid } from "@/components/dashboard/ItemsGrid";
import { Pin, Clock } from "lucide-react";

// TODO: replace with session user ID once auth is set up
const DEMO_USER_ID = "cmnm8t5ha0000xyuibvonf4vz";

export default async function DashboardPage() {
  const [collections, pinnedItems, recentItems, itemStats] = await Promise.all([
    getCollectionsWithMeta(DEMO_USER_ID),
    getPinnedItems(DEMO_USER_ID),
    getRecentItems(DEMO_USER_ID, 10),
    getItemStats(DEMO_USER_ID),
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
          <ItemsGrid items={pinnedItems} />
        </section>
      )}

      {/* Recent Items */}
      <section>
        <SectionHeading label="All Items" icon={<Clock className="h-4 w-4" />} />
        <ItemsGrid items={recentItems} />
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
