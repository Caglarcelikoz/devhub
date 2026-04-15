import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCollectionsWithMeta, getCollections, getSearchCollections } from "@/lib/db/collections";
import { getItemTypesWithCount, getSearchItems } from "@/lib/db/items";
import { EditorPreferencesProvider, DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from "@/context/EditorPreferencesContext";
import { UsageLimitsProvider } from "@/context/UsageLimitsContext";
import { editorPreferencesSchema } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";
import { canCreateItem, canCreateCollection } from "@/lib/usage";

export default async function ItemsLayout({
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
    user,
    itemAllowed,
    collectionAllowed,
  ] = await Promise.all([
    getItemTypesWithCount(userId),
    getCollectionsWithMeta(userId),
    getCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { editorPreferences: true },
    }),
    canCreateItem(userId, isPro),
    canCreateCollection(userId, isPro),
  ]);

  const parsedPrefs = editorPreferencesSchema.safeParse(user?.editorPreferences);
  const initialPreferences: EditorPreferences = parsedPrefs.success ? parsedPrefs.data : DEFAULT_EDITOR_PREFERENCES;

  return (
    <UsageLimitsProvider
      canCreateItem={itemAllowed}
      canCreateCollection={collectionAllowed}
      isPro={isPro}
    >
      <EditorPreferencesProvider initialPreferences={initialPreferences}>
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
      </EditorPreferencesProvider>
    </UsageLimitsProvider>
  );
}
