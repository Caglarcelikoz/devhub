import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FolderOpen } from "lucide-react";
import { getCollectionsWithMetaPaginated } from "@/lib/db/collections";
import { CollectionsRow } from "@/components/dashboard/CollectionsRow";
import { Pagination } from "@/components/ui/Pagination";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants";

interface CollectionsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const { collections, totalCount } = await getCollectionsWithMetaPaginated(
    session.user.id,
    currentPage,
    COLLECTIONS_PER_PAGE,
  );

  const totalPages = Math.ceil(totalCount / COLLECTIONS_PER_PAGE);

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
            {totalCount} {totalCount === 1 ? "collection" : "collections"}
          </p>
        </div>
      </div>

      {/* Collections grid */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-foreground/8">
            <FolderOpen className="w-5 h-5 text-foreground/40" />
          </div>
          <p className="text-sm text-foreground/40">No collections yet.</p>
        </div>
      ) : (
        <>
          <CollectionsRow collections={collections} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildHref={(page) => `/collections?page=${page}`}
          />
        </>
      )}
    </div>
  );
}
