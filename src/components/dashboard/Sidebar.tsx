"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code,
  Sparkles,
  FileText,
  Terminal,
  File,
  Image,
  Link as LinkIcon,
  Star,
  Clock,
  ChevronRight,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockUser, mockItemTypes, mockCollections, mockItems } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const TYPE_ICONS: Record<string, React.ElementType> = {
  code: Code,
  sparkles: Sparkles,
  "file-text": FileText,
  terminal: Terminal,
  file: File,
  image: Image,
  link: LinkIcon,
};

const TYPE_SLUGS: Record<string, string> = {
  Snippet: "snippets",
  Prompt: "prompts",
  Note: "notes",
  Command: "commands",
  File: "files",
  Image: "images",
  URL: "urls",
};

function getItemCountForType(typeId: string) {
  return mockItems.filter((item) => item.typeId === typeId).length;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const favoriteCollections = mockCollections.filter((c) => c.isFavorite);
  const recentCollections = [...mockCollections]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 3);

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-sidebar transition-all duration-200 overflow-hidden shrink-0",
        collapsed ? "w-12" : "w-56"
      )}
    >
      {/* Toggle button */}
      <div
        className={cn(
          "flex items-center border-b border-border h-10 shrink-0 px-2",
          collapsed ? "justify-center" : "justify-end"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {/* Quick nav */}
        <NavItem
          icon={Star}
          label="Favorites"
          href="/dashboard/favorites"
          pathname={pathname}
          collapsed={collapsed}
        />
        <NavItem
          icon={Clock}
          label="Recent"
          href="/dashboard/recent"
          pathname={pathname}
          collapsed={collapsed}
        />

        {/* Types */}
        {!collapsed && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Types
          </p>
        )}
        {collapsed && <div className="h-3" />}

        {mockItemTypes.map((type) => {
          const Icon = TYPE_ICONS[type.icon] ?? File;
          const slug = TYPE_SLUGS[type.name] ?? type.name.toLowerCase() + "s";
          const count = getItemCountForType(type.id);
          return (
            <NavItem
              key={type.id}
              icon={Icon}
              iconColor={type.color}
              label={type.name}
              href={`/items/${slug}`}
              pathname={pathname}
              collapsed={collapsed}
              count={count}
            />
          );
        })}

        {/* Collections */}
        {!collapsed && (
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Collections
          </p>
        )}
        {collapsed && <div className="h-3" />}

        {/* Favorites */}
        {favoriteCollections.length > 0 && (
          <>
            {!collapsed && (
              <p className="px-3 pb-0.5 text-[10px] text-muted-foreground/60">
                Favorites
              </p>
            )}
            {favoriteCollections.map((col) => (
              <NavItem
                key={col.id}
                icon={Star}
                iconColor="#f59e0b"
                label={col.name}
                href={`/dashboard/collections/${col.id}`}
                pathname={pathname}
                collapsed={collapsed}
                count={col.itemCount}
              />
            ))}
          </>
        )}

        {/* Recent collections */}
        {!collapsed && (
          <p className="px-3 pt-2 pb-0.5 text-[10px] text-muted-foreground/60">
            Recent
          </p>
        )}
        {recentCollections.map((col) => (
          <NavItem
            key={col.id}
            icon={ChevronRight}
            label={col.name}
            href={`/dashboard/collections/${col.id}`}
            pathname={pathname}
            collapsed={collapsed}
            count={col.itemCount}
          />
        ))}
      </div>

      {/* User avatar area */}
      <div
        className={cn(
          "border-t border-border flex items-center gap-2.5 p-2 shrink-0",
          collapsed ? "justify-center" : ""
        )}
      >
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-semibold text-primary">
            {mockUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{mockUser.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{mockUser.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  iconColor?: string;
  label: string;
  href: string;
  pathname: string;
  collapsed: boolean;
  count?: number;
}

function NavItem({ icon: Icon, iconColor, label, href, pathname, collapsed, count }: NavItemProps) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-1.5 mx-1 rounded-md text-sm transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent text-foreground",
        collapsed && "justify-center"
      )}
    >
      <Icon
        className="h-3.5 w-3.5 shrink-0"
        style={iconColor ? { color: iconColor } : undefined}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-xs">{label}</span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] text-muted-foreground/70 tabular-nums">{count}</span>
          )}
        </>
      )}
    </Link>
  );
}
