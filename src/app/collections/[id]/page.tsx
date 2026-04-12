import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { Star, FolderOpen } from "lucide-react";
import { getCollectionById, getCollections } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { ItemsGridClient } from "@/components/dashboard/ItemsGridClient";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [collection, items, collectionOptions] = await Promise.all([
    getCollectionById(session.user.id, id),
    getItemsByCollection(session.user.id, id),
    getCollections(session.user.id),
  ]);

  if (!collection) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-foreground/8 mt-0.5">
          <FolderOpen className="w-4 h-4 text-foreground/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground leading-none truncate">
              {collection.name}
            </h1>
            {collection.isFavorite && (
              <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
            )}
          </div>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {collection.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-foreground/8">
            <FolderOpen className="w-5 h-5 text-foreground/40" />
          </div>
          <p className="text-sm text-foreground/40">No items in this collection yet.</p>
        </div>
      ) : (
        <ItemsGridClient items={items} columns="two" collections={collectionOptions} />
      )}
    </div>
  );
}
