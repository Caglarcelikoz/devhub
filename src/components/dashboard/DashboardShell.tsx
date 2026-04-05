"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { ItemTypeWithCount } from "@/lib/db/items";
import type { CollectionWithMeta } from "@/lib/db/collections";

interface DashboardShellProps {
  children: React.ReactNode;
  itemTypes: ItemTypeWithCount[];
  collections: CollectionWithMeta[];
}

export function DashboardShell({ children, itemTypes, collections }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          itemTypes={itemTypes}
          collections={collections}
        />
      </div>

      {/* Mobile drawer via Sheet */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="p-0 w-56">
          <Sidebar
            collapsed={false}
            onToggle={() => setDrawerOpen(false)}
            itemTypes={itemTypes}
            collections={collections}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2 px-4 h-10 border-b border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
