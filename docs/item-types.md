# Item Types

DevHub has 7 system item types. All are immutable (`isSystem: true`) and seeded with no `userId` (shared across all users).

---

## Type Reference

### Snippet
| Field | Value |
|-------|-------|
| Icon | `Code` (Lucide) |
| Color | `#3b82f6` (blue) |
| Content Type | `TEXT` |
| Route | `/items/snippets` |
| Purpose | Store reusable code blocks, functions, hooks, and utilities with optional syntax highlighting via the `language` field |
| Key fields | `content`, `language` |

### Prompt
| Field | Value |
|-------|-------|
| Icon | `Sparkles` (Lucide) |
| Color | `#8b5cf6` (purple) |
| Content Type | `TEXT` |
| Route | `/items/prompts` |
| Purpose | Store AI prompts, system messages, and workflow templates — typically contain `{{PLACEHOLDER}}` variables |
| Key fields | `content` |

### Command
| Field | Value |
|-------|-------|
| Icon | `Terminal` (Lucide) |
| Color | `#f97316` (orange) |
| Content Type | `TEXT` |
| Route | `/items/commands` |
| Purpose | Store shell commands, CLI invocations, and multi-step terminal workflows; uses `language: "bash"` for highlighting |
| Key fields | `content`, `language` |

### Note
| Field | Value |
|-------|-------|
| Icon | `StickyNote` (Lucide) |
| Color | `#fde047` (yellow) |
| Content Type | `TEXT` |
| Route | `/items/notes` |
| Purpose | Free-form markdown notes, documentation drafts, and developer journals |
| Key fields | `content`, `description` |

### File
| Field | Value |
|-------|-------|
| Icon | `File` (Lucide) |
| Color | `#6b7280` (gray) |
| Content Type | `FILE` |
| Route | `/items/files` |
| Purpose | Upload and store context files, PDFs, configs, and documents via Cloudflare R2 — **Pro only** |
| Key fields | `fileUrl`, `fileName`, `fileSize` |

### Image
| Field | Value |
|-------|-------|
| Icon | `Image` (Lucide) |
| Color | `#ec4899` (pink) |
| Content Type | `FILE` |
| Route | `/items/images` |
| Purpose | Upload and store screenshots, diagrams, and visual references via Cloudflare R2 — **Pro only** |
| Key fields | `fileUrl`, `fileName`, `fileSize` |

### Link
| Field | Value |
|-------|-------|
| Icon | `Link` (Lucide) |
| Color | `#10b981` (emerald) |
| Content Type | `URL` |
| Route | `/items/links` |
| Purpose | Bookmark URLs — documentation, tools, design references, or any external resource — with an optional description |
| Key fields | `url`, `description` |

---

## Classification Summary

### By content type

| Content Type | Types | Storage |
|---|---|---|
| `TEXT` | snippet, prompt, command, note | `content` field (db.Text) |
| `FILE` | file, image | `fileUrl`, `fileName`, `fileSize` (Cloudflare R2) |
| `URL` | link | `url` field |

### Shared properties (all types)

All item types share these fields regardless of content type:

- `title` — required display name
- `description` — optional supporting text
- `isFavorite` — star/bookmark the item
- `isPinned` — pin to top of lists
- `tags` — many-to-many tag relationships
- `collections` — many-to-many collection memberships
- `createdAt` / `updatedAt` — timestamps
- `userId` — owner

### Display differences

| Type | Display hint |
|---|---|
| snippet, command | Render with syntax highlighting; `language` drives the highlighter |
| prompt | Plain text or markdown; may contain `{{VARIABLE}}` markers |
| note | Full markdown editor and preview |
| file | Shows file name, size, and download/preview action |
| image | Renders inline image preview from R2 URL |
| link | Shows URL domain, description, and external link button |

### Pro-gating

`file` and `image` types are Pro-only features. Free users see them listed in the sidebar with a PRO badge but cannot create items of those types.

---

## Source locations

| Source | Path |
|---|---|
| Seed data | `prisma/seed.ts` |
| DB schema | `prisma/schema.prisma` |
| Route slugs | `src/components/dashboard/Sidebar.tsx` (`TYPE_SLUGS`) |
| Project spec | `context/project-overview.md` |
