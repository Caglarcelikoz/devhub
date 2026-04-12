import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FolderOpen } from "lucide-react";
import { getCollectionsWithMeta } from "@/lib/db/collections";
import { CollectionsRow } from "@/components/dashboard/CollectionsRow";

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const collections = await getCollectionsWithMeta(session.user.id);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-foreground/8">
          <FolderOpen className="w-4 h-4 text-foreground/60" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-none">
            Collections
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>
      </div>

      {/* Collections grid */}
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-foreground/8">
            <FolderOpen className="w-5 h-5 text-foreground/40" />
          </div>
          <p className="text-sm text-foreground/40">No collections yet.</p>
        </div>
      ) : (
        <CollectionsRow collections={collections} />
      )}
    </div>
  );
}
