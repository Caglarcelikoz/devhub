'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { updateCollection, deleteCollection, toggleFavoriteCollection } from '@/actions/collections'

interface Collection {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
}

/** Shared state + handlers for edit + delete */
function useCollectionActions(collection: Collection, afterDeleteRedirect: string) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateCollection(collection.id, {
        name,
        description: description || null,
      })
      if (result.success) {
        toast.success('Collection updated')
        setEditOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCollection(collection.id)
      if (result.success) {
        toast.success('Collection deleted')
        if (afterDeleteRedirect) {
          router.push(afterDeleteRedirect)
        } else {
          router.refresh()
        }
      } else {
        toast.error(result.error)
      }
    })
  }

  return {
    editOpen, setEditOpen,
    deleteOpen, setDeleteOpen,
    name, setName,
    description, setDescription,
    isPending,
    handleSave,
    handleDelete,
  }
}

type Actions = ReturnType<typeof useCollectionActions>

/** Edit dialog + delete confirmation — shared by both variants */
function CollectionModals({
  collection,
  actions,
}: {
  collection: Collection
  actions: Actions
}) {
  const { editOpen, setEditOpen, deleteOpen, setDeleteOpen, name, setName, description, setDescription, isPending, handleSave, handleDelete } = actions

  return (
    <>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description…"
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || !name.trim()}
            >
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{collection.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              The collection will be removed. Items inside it will not be deleted —
              they will simply no longer belong to this collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Dropdown variant — used on collection cards
// ---------------------------------------------------------------------------

interface CollectionActionsDropdownProps {
  collection: Collection
  /** Where to redirect after delete. Pass empty string to refresh in place. */
  afterDeleteRedirect?: string
}

export function CollectionActionsDropdown({
  collection,
  afterDeleteRedirect = '',
}: CollectionActionsDropdownProps) {
  const router = useRouter()
  const actions = useCollectionActions(collection, afterDeleteRedirect)
  const [togglingFavorite, setTogglingFavorite] = useState(false)

  async function handleToggleFavorite() {
    if (togglingFavorite) return
    setTogglingFavorite(true)
    const result = await toggleFavoriteCollection(collection.id)
    setTogglingFavorite(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center justify-center h-7 w-7 rounded-md text-foreground/50 hover:text-foreground hover:bg-accent transition-colors outline-none"
          onClick={(e: React.MouseEvent) => e.preventDefault()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Collection actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => actions.setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5 text-foreground/60" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleToggleFavorite}
            disabled={togglingFavorite}
          >
            <Star className={`h-3.5 w-3.5 ${collection.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            {collection.isFavorite ? 'Unfavorite' : 'Favorite'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            onClick={() => actions.setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CollectionModals collection={collection} actions={actions} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Inline buttons variant — used on /collections/[id] detail page header
// ---------------------------------------------------------------------------

interface CollectionPageActionsProps {
  collection: Collection
}

export function CollectionPageActions({ collection }: CollectionPageActionsProps) {
  const router = useRouter()
  const actions = useCollectionActions(collection, '/dashboard')
  const [togglingFavorite, setTogglingFavorite] = useState(false)

  async function handleToggleFavorite() {
    if (togglingFavorite) return
    setTogglingFavorite(true)
    const result = await toggleFavoriteCollection(collection.id)
    setTogglingFavorite(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${collection.isFavorite ? 'text-amber-400' : 'text-foreground/40 hover:text-foreground'}`}
          onClick={handleToggleFavorite}
          disabled={togglingFavorite}
          title={collection.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`h-4 w-4 ${collection.isFavorite ? 'fill-amber-400' : ''}`} />
          <span className="sr-only">{collection.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground/50 hover:text-foreground"
          onClick={() => actions.setEditOpen(true)}
          title="Edit collection"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground/50 hover:text-destructive"
          onClick={() => actions.setDeleteOpen(true)}
          title="Delete collection"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      <CollectionModals collection={collection} actions={actions} />
    </>
  )
}
