"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code,
  Sparkles,
  StickyNote,
  Terminal,
  File,
  Image,
  Link as LinkIcon,
  Star,
  Clock,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ItemTypeWithCount } from "@/lib/db/items";
import type { CollectionWithMeta } from "@/lib/db/collections";

const TYPE_ICONS: Record<string, React.ElementType> = {
  Code,
  Sparkles,
  StickyNote,
  Terminal,
  File,
  Image,
  Link: LinkIcon,
};

const TYPE_SLUGS: Record<string, string> = {
  snippet: "snippets",
  prompt: "prompts",
  note: "notes",
  command: "commands",
  file: "files",
  image: "images",
  link: "links",
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  itemTypes: ItemTypeWithCount[];
  collections: CollectionWithMeta[];
}

export function Sidebar({ collapsed, onToggle, itemTypes, collections }: SidebarProps) {
  const pathname = usePathname();

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.slice(0, 3);

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-sidebar transition-all duration-200 overflow-hidden shrink-0",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Toggle button */}
      <div
        className={cn(
          "flex items-center border-b border-border h-14 shrink-0 px-2",
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
          <p className="px-3 pt-5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Types
          </p>
        )}
        {collapsed && <div className="h-3" />}

        {itemTypes.map((type) => {
          const Icon = TYPE_ICONS[type.icon] ?? File;
          const slug = TYPE_SLUGS[type.name] ?? type.name.toLowerCase() + "s";
          const isPro = type.name === "file" || type.name === "image";
          return (
            <NavItem
              key={type.id}
              icon={Icon}
              iconColor={type.color}
              label={type.name.charAt(0).toUpperCase() + type.name.slice(1)}
              href={`/items/${slug}`}
              pathname={pathname}
              collapsed={collapsed}
              count={type.itemCount}
              isPro={isPro}
            />
          );
        })}

        {/* Collections */}
        {!collapsed && (
          <p className="px-3 pt-5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Collections
          </p>
        )}
        {collapsed && <div className="h-3" />}

        {/* Favorites */}
        {favoriteCollections.length > 0 && (
          <>
            {!collapsed && (
              <p className="px-3 pb-1 text-xs text-foreground/40">Favorites</p>
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
        {!collapsed && recentCollections.length > 0 && (
          <p className="px-3 pt-3 pb-1 text-xs text-foreground/40">Recent</p>
        )}
        {recentCollections.map((col) => {
          const dominantColor = col.dominantColor;
          return (
            <NavItem
              key={col.id}
              icon={File}
              iconColor={dominantColor}
              label={col.name}
              href={`/dashboard/collections/${col.id}`}
              pathname={pathname}
              collapsed={collapsed}
              count={col.itemCount}
              dotColor={dominantColor}
            />
          );
        })}

        {/* View all collections */}
        {!collapsed && (
          <Link
            href="/collections"
            className="flex items-center px-3 py-1.5 mx-1 mt-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
          >
            View all collections
          </Link>
        )}
      </div>

      {/* User avatar area */}
      <div
        className={cn(
          "border-t border-border flex items-center gap-3 p-3 shrink-0",
          collapsed ? "justify-center" : ""
        )}
      >
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">D</span>
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Demo User</p>
              <p className="text-xs text-foreground/50 truncate">demo@devhub.dev</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            >
              <Settings className="h-4 w-4" />
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
  dotColor?: string;
  isPro?: boolean;
}

function NavItem({ icon: Icon, iconColor, label, href, pathname, collapsed, count, dotColor, isPro }: NavItemProps) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 mx-1 rounded-md transition-colors",
        "text-foreground/60 hover:text-foreground hover:bg-sidebar-accent",
        isActive && "bg-sidebar-accent text-foreground",
        collapsed && "justify-center"
      )}
    >
      {dotColor ? (
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      ) : (
        <Icon
          className="h-4 w-4 shrink-0"
          style={iconColor ? { color: iconColor } : undefined}
        />
      )}
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-sm">{label}</span>
          {isPro && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] font-semibold tracking-wide text-foreground/50">
              PRO
            </Badge>
          )}
          {count !== undefined && count > 0 && (
            <span className="text-xs text-foreground/40 tabular-nums">{count}</span>
          )}
        </>
      )}
    </Link>
  );
}
