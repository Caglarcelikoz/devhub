import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCollectionsWithMeta, getCollections } from "@/lib/db/collections";
import { getItemTypesWithCount } from "@/lib/db/items";

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

  const [itemTypes, collections, collectionOptions] = await Promise.all([
    getItemTypesWithCount(userId),
    getCollectionsWithMeta(userId),
    getCollections(userId),
  ]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar collections={collectionOptions} />
      <DashboardShell itemTypes={itemTypes} collections={collections} user={session.user}>
        {children}
      </DashboardShell>
    </div>
  );
}
