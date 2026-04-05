import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
