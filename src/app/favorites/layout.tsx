import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  getCollectionsWithMeta,
  getCollections,
  getSearchCollections,
} from "@/lib/db/collections";
import { getItemTypesWithCount, getSearchItems } from "@/lib/db/items";
import {
  EditorPreferencesProvider,
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from "@/context/EditorPreferencesContext";
import { editorPreferencesSchema } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

export default async function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const [
    itemTypes,
    collections,
    collectionOptions,
    searchItems,
    searchCollections,
    user,
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
  ]);

  const parsedPrefs = editorPreferencesSchema.safeParse(
    user?.editorPreferences,
  );
  const initialPreferences: EditorPreferences = parsedPrefs.success
    ? parsedPrefs.data
    : DEFAULT_EDITOR_PREFERENCES;

  return (
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
  );
}
