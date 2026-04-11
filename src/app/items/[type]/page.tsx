import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getItemsByType } from "@/lib/db/items";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";
import { ItemsGridClient } from "@/components/dashboard/ItemsGridClient";

const VALID_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

type ValidType = (typeof VALID_TYPES)[number];

const TYPE_ICONS: Record<ValidType, LucideIcon> = {
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: Image,
  link: LinkIcon,
};

function typeSlugToName(slug: string): string {
  if (slug === "images") return "image";
  if (slug.endsWith("s")) return slug.slice(0, -1);
  return slug;
}

interface ItemsPageProps {
  params: Promise<{ type: string }>;
}

export default async function ItemsPage({ params }: ItemsPageProps) {
  const { type: slug } = await params;
  const typeName = typeSlugToName(slug) as ValidType;

  if (!VALID_TYPES.includes(typeName)) {
    notFound();
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const items = await getItemsByType(session.user.id, typeName);
  const label = typeName.charAt(0).toUpperCase() + typeName.slice(1) + "s";
  const Icon = TYPE_ICONS[typeName];
  const typeColor = items[0]?.itemType.color ?? "#6b7280";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ backgroundColor: `${typeColor}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: typeColor }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-none">
            {label}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ backgroundColor: `${typeColor}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: typeColor }} />
          </div>
          <p className="text-sm text-foreground/40">No {typeName}s yet.</p>
        </div>
      ) : (
        <ItemsGridClient items={items} columns="two" />
      )}
    </div>
  );
}
