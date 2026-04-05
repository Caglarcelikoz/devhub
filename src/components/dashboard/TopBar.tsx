"use client";

import { Search, Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopBar() {
  return (
    <header className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-border bg-background">
      <span className="text-sm font-semibold text-foreground mr-2">DevHub</span>

      <div className="flex-1 max-w-sm relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          className="pl-8 h-7 text-xs bg-muted border-transparent focus-visible:border-border"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <List className="h-4 w-4" />
        </Button>
        <Button size="sm" className="h-7 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
          New Item
        </Button>
      </div>
    </header>
  );
}
