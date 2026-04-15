import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCollectionsWithMeta, getCollections, getSearchCollections } from "@/lib/db/collections";
import { getItemTypesWithCount, getSearchItems } from "@/lib/db/items";
import { UsageLimitsProvider } from "@/context/UsageLimitsContext";
import { canCreateItem, canCreateCollection } from "@/lib/usage";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const isPro = session.user.isPro ?? false;

  const [
    itemTypes,
    collections,
    collectionOptions,
    searchItems,
    searchCollections,
    itemAllowed,
    collectionAllowed,
  ] = await Promise.all([
    getItemTypesWithCount(userId),
    getCollectionsWithMeta(userId),
    getCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
    canCreateItem(userId, isPro),
    canCreateCollection(userId, isPro),
  ]);

  return (
    <UsageLimitsProvider
      canCreateItem={itemAllowed}
      canCreateCollection={collectionAllowed}
      isPro={isPro}
    >
      <div className="flex flex-col h-screen bg-background">
        <TopBar
          collections={collectionOptions}
          searchItems={searchItems}
          searchCollections={searchCollections}
        />
        <DashboardShell
          itemTypes={itemTypes}
          collections={collections}
          user={session.user}
        >
          {children}
        </DashboardShell>
      </div>
    </UsageLimitsProvider>
  );
}
