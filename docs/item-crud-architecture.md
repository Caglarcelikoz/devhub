# Item CRUD Architecture

Design document for a unified CRUD system covering all 7 item types (snippet, prompt, command, note, file, image, link).

---

## Guiding principles

- **Mutations → Server Actions** (`src/actions/items.ts`) — one file, shared by all types
- **Queries → lib/db** (`src/lib/db/items.ts`) — called directly from Server Components
- **Type-specific rendering → components** — actions and queries stay type-agnostic; only UI adapts
- **One dynamic route** — `/items/[type]` handles all 7 type list pages

---

## File structure

```
src/
├── actions/
│   └── items.ts              # create, update, delete, toggleFavorite, togglePin
│
├── lib/db/
│   └── items.ts              # getItemsByType, getPinnedItems, getRecentItems,
│                             # getItemStats, getItemTypesWithCount, getItemById
│
├── app/
│   └── items/
│       └── [type]/
│           ├── layout.tsx    # loads sidebar data (itemTypes, collections)
│           └── page.tsx      # resolves slug → type name, fetches items, renders list
│
└── components/
    └── items/
        ├── ItemList.tsx          # renders the list, passes each item to ItemCard
        ├── ItemCard.tsx          # type-aware card (delegates content display)
        ├── ItemContent.tsx       # switches on contentType: code block / link / file badge
        ├── ItemActions.tsx       # edit / delete / pin / favorite buttons
        ├── ItemFormModal.tsx     # create + edit modal (Sheet or Dialog)
        ├── ItemForm.tsx          # controlled form, switches fields by type
        └── fields/
            ├── TextField.tsx     # content + language (snippet, prompt, command, note)
            ├── FileField.tsx     # file upload input (file, image) — Pro only
            └── UrlField.tsx      # URL + description (link)
```

---

## Routing: `/items/[type]`

The `[type]` segment uses the **plural slug** defined in `Sidebar.tsx`:

| Slug | Type name |
|------|-----------|
| `snippets` | snippet |
| `prompts` | prompt |
| `commands` | command |
| `notes` | note |
| `files` | file |
| `images` | image |
| `links` | link |

### Slug → type name resolution

```ts
// src/app/items/[type]/page.tsx
const SLUG_TO_TYPE: Record<string, string> = {
  snippets: 'snippet',
  prompts: 'prompt',
  commands: 'command',
  notes: 'note',
  files: 'file',
  images: 'image',
  links: 'link',
}

export default async function ItemsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type: slug } = await params
  const typeName = SLUG_TO_TYPE[slug]
  if (!typeName) notFound()

  const session = await auth()
  const items = await getItemsByType(session.user.id, typeName)

  return <ItemList items={items} typeName={typeName} />
}
```

### Layout responsibility

`src/app/items/[type]/layout.tsx` loads sidebar data once per navigation:
- `getItemTypesWithCount(userId)` — sidebar type list with counts
- `getCollectionsWithMeta(userId)` — sidebar collections

The page itself loads its own `getItemsByType()` — these are separate concerns.

---

## Data fetching: `src/lib/db/items.ts`

All functions accept `userId` and return typed data. Called directly in Server Components — no API round-trip.

### Existing functions

| Function | Purpose |
|---|---|
| `getItemTypesWithCount(userId)` | Sidebar: all system types with per-user item count |
| `getPinnedItems(userId)` | Dashboard: pinned items across all types |
| `getRecentItems(userId, limit)` | Dashboard: most recently updated items |
| `getItemStats(userId)` | Dashboard: total + favorite counts |

### Functions to add

```ts
// Get all items of a specific type (for /items/[type] page)
getItemsByType(userId: string, typeName: string): Promise<ItemWithMeta[]>

// Get a single item for the edit form
getItemById(userId: string, itemId: string): Promise<ItemWithMeta | null>
```

### `ItemWithMeta` (existing)

```ts
interface ItemWithMeta {
  id: string
  title: string
  description: string | null
  content: string | null        // TEXT types; capped at 500 chars in list view
  contentType: 'TEXT' | 'FILE' | 'URL'
  url: string | null            // URL type
  language: string | null       // TEXT types with syntax highlighting
  isFavorite: boolean
  isPinned: boolean
  updatedAt: Date
  tags: string[]
  itemType: { id: string; name: string; color: string; icon: string }
}
```

File-specific fields (`fileUrl`, `fileName`, `fileSize`) should be added to `ItemWithMeta` and `itemSelect` for FILE type support.

---

## Mutations: `src/actions/items.ts`

Single Server Action file for all mutations. Returns `{ success: boolean; data?: T; error?: string }`.

```ts
'use server'

export async function createItem(formData: FormData) {}
export async function updateItem(itemId: string, formData: FormData) {}
export async function deleteItem(itemId: string) {}
export async function toggleFavorite(itemId: string, value: boolean) {}
export async function togglePin(itemId: string, value: boolean) {}
```

### Type-agnostic action design

Actions do not branch by type — they write whatever validated fields are present. The `contentType` enum (`TEXT | FILE | URL`) is the only split:

| contentType | Fields written |
|---|---|
| `TEXT` | `content`, `language` |
| `FILE` | `fileUrl`, `fileName`, `fileSize` |
| `URL` | `url`, `description` |

Shared fields always written: `title`, `description`, `itemTypeId`, `isFavorite`, `isPinned`.

### Validation (Zod)

```ts
const baseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  itemTypeId: z.string().cuid(),
  tags: z.array(z.string()).optional(),
})

const textSchema = baseSchema.extend({
  contentType: z.literal('TEXT'),
  content: z.string().min(1),
  language: z.string().optional(),
})

const urlSchema = baseSchema.extend({
  contentType: z.literal('URL'),
  url: z.string().url(),
})

const fileSchema = baseSchema.extend({
  contentType: z.literal('FILE'),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
})

const itemSchema = z.discriminatedUnion('contentType', [textSchema, urlSchema, fileSchema])
```

---

## Component responsibilities

### `ItemList`
- Server or Client component
- Renders a grid/list of `ItemCard` components
- Owns the "New item" button that opens `ItemFormModal`
- Shows empty state when no items

### `ItemCard`
- Displays: type-colored left border, icon, title, tags, timestamps, `ItemActions`
- Delegates content preview to `ItemContent`
- Optimistic UI for pin/favorite toggles

### `ItemContent`
- Switches on `contentType`:
  - `TEXT` → syntax-highlighted code block (uses `language`) or markdown preview
  - `URL` → link with domain favicon and description
  - `FILE` → file name, size badge, download button; image types show thumbnail

### `ItemActions`
- Edit button → opens `ItemFormModal` pre-filled
- Delete button → confirmation, then calls `deleteItem` action
- Pin / Favorite icon toggles → call `togglePin` / `toggleFavorite`

### `ItemFormModal`
- Sheet (drawer) on desktop; fullscreen on mobile
- Pre-fills all fields when editing; blank when creating
- Passes `typeName` to `ItemForm` to control which fields render

### `ItemForm`
- Controlled form with `react-hook-form` + Zod resolver
- Renders `TextField`, `FileField`, or `UrlField` based on `contentType`
- Always renders: title, description, tags, collection picker

### Field components
- `TextField` — textarea + language selector (for snippet, command) or plain markdown (for note, prompt)
- `FileField` — drag-and-drop upload → uploads to R2 → stores returned URL; Pro gate shown if free user
- `UrlField` — URL input + description textarea; auto-fetches page title on blur (nice-to-have)

---

## Where type-specific logic lives

| Concern | Location |
|---|---|
| Which fields to show in the form | `ItemForm` (switches on `contentType`) |
| How content is displayed | `ItemContent` (switches on `contentType`) |
| Type icon & color | Resolved from `itemType.icon` / `itemType.color` in `ItemCard` |
| Route slug ↔ type name mapping | `SLUG_TO_TYPE` in page + `TYPE_SLUGS` in `Sidebar` |
| Pro gate (file, image) | `ItemForm` (blocks submit) + `Sidebar` (PRO badge) |
| Language selector visibility | `TextField` (shown only when `typeName` is snippet or command) |

Actions and db queries are fully type-agnostic — they operate on fields, not type names.

---

## Data flow summary

```
User opens /items/snippets
  → layout.tsx fetches sidebar data (itemTypes, collections)
  → page.tsx resolves "snippets" → "snippet", fetches getItemsByType()
  → ItemList renders ItemCards
  → User clicks "New item"
  → ItemFormModal opens with typeName="snippet"
  → ItemForm renders TextField + language selector
  → Submit → createItem() Server Action
  → Prisma insert → revalidatePath('/items/snippets')
  → Page re-renders with new item
```

---

## Existing code to build on

| File | Status | Notes |
|---|---|---|
| `src/lib/db/items.ts` | Exists | Add `getItemsByType`, `getItemById`; extend `ItemWithMeta` with file fields |
| `src/app/items/[type]/page.tsx` | Stub | Replace placeholder with real data fetch + `ItemList` |
| `src/app/items/[type]/layout.tsx` | Exists (uses DEMO_USER_ID) | Replace with real session user |
| `src/actions/items.ts` | Does not exist | Create from scratch |
| `src/components/items/` | Does not exist | Create all item components |
