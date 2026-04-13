import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Star } from "lucide-react";
import { getFavoriteItems } from "@/lib/db/items";
import { getFavoriteCollections, getCollections } from "@/lib/db/collections";
import { FavoritesListClient } from "@/components/dashboard/FavoritesListClient";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [items, collections, collectionOptions] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
    getCollections(userId),
  ]);

  const totalCount = items.length + collections.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-foreground/8">
          <Star className="w-4 h-4 text-foreground/60" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-none">
            Favorites
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {totalCount} {totalCount === 1 ? "item" : "items"} starred
          </p>
        </div>
      </div>

      <FavoritesListClient
        items={items}
        collections={collections}
        collectionOptions={collectionOptions}
      />
    </div>
  );
}
