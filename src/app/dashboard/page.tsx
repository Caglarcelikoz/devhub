import { mockItems, mockItemTypes } from "@/lib/mock-data";
import { getCollectionsWithMeta } from "@/lib/db/collections";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionsRow } from "@/components/dashboard/CollectionsRow";
import { ItemsGrid } from "@/components/dashboard/ItemsGrid";
import { Pin, Clock } from "lucide-react";

// TODO: replace with session user ID once auth is set up
const DEMO_USER_ID = "cmnm8t5ha0000xyuibvonf4vz";

export default async function DashboardPage() {
  const collections = await getCollectionsWithMeta(DEMO_USER_ID);

  const pinnedItems = mockItems.filter((item) => item.isPinned);
  const recentItems = [...mockItems]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  const stats = {
    totalItems: mockItems.length,
    totalCollections: collections.length,
    favoriteItems: mockItems.filter((i) => i.isFavorite).length,
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
          <ItemsGrid items={pinnedItems} itemTypes={mockItemTypes} />
        </section>
      )}

      {/* Recent Items */}
      <section>
        <SectionHeading label="All Items" icon={<Clock className="h-4 w-4" />} />
        <ItemsGrid items={recentItems} itemTypes={mockItemTypes} />
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
