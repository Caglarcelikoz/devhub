import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCollectionsWithMeta } from "@/lib/db/collections";
import { getItemTypesWithCount } from "@/lib/db/items";

// TODO: replace with session user ID once auth is set up
const DEMO_USER_ID = "cmnm8t5ha0000xyuibvonf4vz";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [itemTypes, collections] = await Promise.all([
    getItemTypesWithCount(DEMO_USER_ID),
    getCollectionsWithMeta(DEMO_USER_ID),
  ]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />
      <DashboardShell itemTypes={itemTypes} collections={collections}>
        {children}
      </DashboardShell>
    </div>
  );
}
