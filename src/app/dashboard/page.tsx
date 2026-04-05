export default function DashboardPage() {
  return (
    <>
      <aside className="w-60 shrink-0 border-r border-border bg-sidebar h-full overflow-y-auto">
        <h2 className="p-4 text-sm font-semibold text-muted-foreground">Sidebar</h2>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Main</h2>
      </main>
    </>
  );
}
