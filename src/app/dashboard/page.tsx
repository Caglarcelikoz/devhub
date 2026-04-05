import {
  mockCollections,
  mockItems,
  mockItemTypes,
} from "@/lib/mock-data";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CollectionsRow } from "@/components/dashboard/CollectionsRow";
import { ItemsGrid } from "@/components/dashboard/ItemsGrid";
import { Pin, Clock } from "lucide-react";

export default function DashboardPage() {
  const pinnedItems = mockItems.filter((item) => item.isPinned);
  const recentItems = [...mockItems]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  const recentCollections = [...mockCollections]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 3);

  const stats = {
    totalItems: mockItems.length,
    totalCollections: mockCollections.length,
    favoriteItems: mockItems.filter((i) => i.isFavorite).length,
    favoriteCollections: mockCollections.filter((c) => c.isFavorite).length,
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Recent Collections */}
      <section>
        <SectionHeading label="Collections" />
        <CollectionsRow collections={recentCollections} itemTypes={mockItemTypes} allItems={mockItems} />
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
