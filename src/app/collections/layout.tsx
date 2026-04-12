import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCollectionsWithMeta, getCollections, getSearchCollections } from "@/lib/db/collections";
import { getItemTypesWithCount, getSearchItems } from "@/lib/db/items";

export default async function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [itemTypes, collections, collectionOptions, searchItems, searchCollections] = await Promise.all([
    getItemTypesWithCount(userId),
    getCollectionsWithMeta(userId),
    getCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
  ]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar collections={collectionOptions} searchItems={searchItems} searchCollections={searchCollections} />
      <DashboardShell itemTypes={itemTypes} collections={collections} user={session.user}>
        {children}
      </DashboardShell>
    </div>
  );
}
