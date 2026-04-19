'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { colorBg } from '@/lib/utils/color'
import { ItemDrawerView } from './ItemDrawerView'
import { ItemDrawerEdit } from './ItemDrawerEdit'
import {
  updateItem,
  deleteItem,
  toggleFavorite,
  togglePin,
} from "@/actions/items";
import type { ItemDetail } from '@/lib/db/items'
import type { CollectionOption } from '@/lib/db/collections'

interface ItemDrawerProps {
  itemId: string | null
  onClose: () => void
  collections?: CollectionOption[]
  isPro?: boolean
}

async function fetchItem(id: string): Promise<ItemDetail> {
  const res = await fetch(`/api/items/${id}`)
  if (!res.ok) throw new Error('Failed to load item')
  return res.json()
}

export function ItemDrawer({ itemId, onClose, collections = [], isPro = false }: ItemDrawerProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingFavorite, setTogglingFavorite] = useState(false)
  const [togglingPin, setTogglingPin] = useState(false);

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => fetchItem(itemId!),
    enabled: itemId !== null,
    staleTime: 0,
  })

  // Edit form state — initialised from item when entering edit mode
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  const handleEditStart = useCallback(() => {
    if (!item) return
    setTitle(item.title)
    setDescription(item.description ?? '')
    setContent(item.content ?? '')
    setUrl(item.url ?? '')
    setLanguage(item.language ?? '')
    setTagsInput(item.tags.join(', '))
    setSelectedCollections(item.collections.map((c) => c.id))
    setIsEditing(true)
  }, [item])

  const handleAcceptOptimized = useCallback(async (optimized: string) => {
    if (!item) return
    const result = await updateItem(item.id, {
      title: item.title,
      description: item.description ?? null,
      content: optimized,
      url: item.url ?? null,
      language: item.language ?? null,
      tags: item.tags,
      collectionIds: item.collections.map((c) => c.id),
    })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    queryClient.setQueryData<ItemDetail>(['item', itemId], result.data)
    toast.success('Prompt updated')
    router.refresh()
  }, [item, itemId, queryClient, router])

  const handleCancel = useCallback(() => setIsEditing(false), [])

  const handleCopy = useCallback(() => {
    if (!item) return
    const text = item.contentType === 'URL' ? (item.url ?? '') : (item.content ?? '')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [item])

  const handleSave = useCallback(async () => {
    if (!item || !title.trim()) return
    setSaving(true)

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    const result = await updateItem(item.id, {
      title: title.trim(),
      description: description.trim() || null,
      content: content || null,
      url: url.trim() || null,
      language: language.trim() || null,
      tags,
      collectionIds: selectedCollections,
    })

    setSaving(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }

    // Update cache immediately so the view reflects the new data without waiting for router.refresh()
    queryClient.setQueryData<ItemDetail>(['item', itemId], result.data)
    setIsEditing(false)
    toast.success('Item updated')
    router.refresh()
  }, [item, title, description, content, url, language, tagsInput, selectedCollections, router])

  const handleDelete = useCallback(async () => {
    if (!item) return
    setDeleting(true)
    const result = await deleteItem(item.id)
    setDeleting(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Item deleted')
    onClose()
    router.refresh()
  }, [item, onClose, router])

  const handleToggleFavorite = useCallback(async () => {
    if (!item || togglingFavorite) return
    setTogglingFavorite(true)
    // Optimistic update — flip isFavorite immediately in the cache
    queryClient.setQueryData<ItemDetail>(['item', itemId], (old) =>
      old ? { ...old, isFavorite: !old.isFavorite } : old,
    )
    const result = await toggleFavorite(item.id)
    setTogglingFavorite(false)
    if (!result.success) {
      // Revert on failure
      queryClient.setQueryData<ItemDetail>(['item', itemId], (old) =>
        old ? { ...old, isFavorite: !old.isFavorite } : old,
      )
      toast.error(result.error)
      return
    }
    router.refresh()
  }, [item, itemId, togglingFavorite, queryClient, router])

  const handleTogglePin = useCallback(async () => {
    if (!item || togglingPin) return;
    setTogglingPin(true);
    // Optimistic update — flip isPinned immediately in the cache
    queryClient.setQueryData<ItemDetail>(["item", itemId], (old) =>
      old ? { ...old, isPinned: !old.isPinned } : old,
    );
    const result = await togglePin(item.id);
    setTogglingPin(false);
    if (!result.success) {
      // Revert on failure
      queryClient.setQueryData<ItemDetail>(["item", itemId], (old) =>
        old ? { ...old, isPinned: !old.isPinned } : old,
      );
      toast.error(result.error);
      return;
    }
    toast.success(item.isPinned ? "Item unpinned" : "Item pinned");
    router.refresh();
  }, [item, itemId, togglingPin, queryClient, router]);

  const handleOpenChange = useCallback(
    (open: boolean) => { if (!open) { setIsEditing(false); onClose() } },
    [onClose],
  )

  return (
    <Sheet open={itemId !== null} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="w-[95vw] sm:w-[70vw] lg:w-[45vw] xl:w-[38vw] 2xl:w-[35vw] max-w-[95vw]! p-0 flex flex-col overflow-hidden gap-0"
      >
        {isLoading && <DrawerSkeleton />}
        {isError && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Failed to load item
          </div>
        )}
        {!isLoading && !isError && item && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* ── Header ── */}
            <SheetHeader className="px-5 pt-5 pb-4 shrink-0">
              <div className="flex items-center gap-2 pr-8">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0"
                  style={{
                    backgroundColor: colorBg(item.itemType.color),
                    color: item.itemType.color,
                  }}
                >
                  {item.itemType.name.charAt(0).toUpperCase() +
                    item.itemType.name.slice(1)}
                </span>
                {!isEditing && item.language && (
                  <span className="text-xs text-muted-foreground">
                    {item.language}
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-base font-semibold text-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <h2 className="text-base font-semibold text-foreground leading-snug mt-1">
                  {item.title}
                </h2>
              )}
            </SheetHeader>

            {isEditing ? (
              <ItemDrawerEdit
                item={item}
                title={title}
                description={description}
                content={content}
                url={url}
                language={language}
                tagsInput={tagsInput}
                selectedCollections={selectedCollections}
                collections={collections}
                saving={saving}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onContentChange={setContent}
                onUrlChange={setUrl}
                onLanguageChange={setLanguage}
                onTagsInputChange={setTagsInput}
                onSelectedCollectionsChange={setSelectedCollections}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <ItemDrawerView
                item={item}
                copied={copied}
                deleting={deleting}
                isPro={isPro}
                onCopy={handleCopy}
                onEditStart={handleEditStart}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onTogglePin={handleTogglePin}
                onAcceptOptimized={handleAcceptOptimized}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="px-5 pt-5 pb-4 space-y-2.5">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
      </div>
      <div className="flex items-center gap-2 px-4 py-2 border-y border-border/60">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-16 rounded-md bg-muted" />
        ))}
      </div>
      <div className="flex-1 px-5 py-4 space-y-5">
        {[80, 140, 60, 60].map((h, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="rounded-md bg-muted" style={{ height: h }} />
          </div>
        ))}
      </div>
    </div>
  )
}
