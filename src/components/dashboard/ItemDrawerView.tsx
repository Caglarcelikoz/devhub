'use client'

import {
  Star,
  Pin,
  Copy,
  Pencil,
  Trash2,
  Tag,
  FolderOpen,
  Calendar,
  Download,
  File,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { CodeEditor } from '@/components/ui/code-editor'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import type { ItemDetail } from '@/lib/db/items'

const TEXT_TYPES = ['snippet', 'prompt', 'command', 'note']
const LANGUAGE_TYPES = ['snippet', 'command']
const MARKDOWN_TYPES = ['note', 'prompt']
const FILE_TYPES = ['file', 'image']

interface ItemDrawerViewProps {
  item: ItemDetail
  copied: boolean
  deleting: boolean
  onCopy: () => void
  onEditStart: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}

export function ItemDrawerView({
  item,
  copied,
  deleting,
  onCopy,
  onEditStart,
  onDelete,
  onToggleFavorite,
}: ItemDrawerViewProps) {
  const { itemType } = item
  const preview = item.contentType === 'URL' ? item.url : item.content
  const showLanguage = LANGUAGE_TYPES.includes(itemType.name)
  const showMarkdown = MARKDOWN_TYPES.includes(itemType.name)
  const showFile = FILE_TYPES.includes(itemType.name)
  const isImageType = itemType.name === 'image'
  const createdDate = formatDate(new Date(item.createdAt))
  const updatedDate = formatDate(new Date(item.updatedAt))

  return (
    <>
      {/* ── Action bar ── */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-y border-border/60 shrink-0 overflow-x-auto scrollbar-none">
        <ActionButton
          icon={<Star className={`h-4 w-4 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />}
          label={item.isFavorite ? 'Unfavorite' : 'Favorite'}
          onClick={onToggleFavorite}
        />
        <ActionButton
          icon={<Pin className={`h-4 w-4 ${item.isPinned ? 'text-foreground' : ''}`} />}
          label={item.isPinned ? 'Unpin' : 'Pin'}
        />
        <ActionButton
          icon={<Copy className="h-4 w-4" />}
          label={copied ? 'Copied!' : 'Copy'}
          onClick={onCopy}
        />
        <ActionButton
          icon={<Pencil className="h-4 w-4" />}
          label="Edit"
          onClick={onEditStart}
        />
        {showFile && item.fileUrl && (
          <a
            href={`/api/items/${item.id}/download`}
            download={item.fileName ?? undefined}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
            title="Download"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </a>
        )}
        <div className="ml-auto shrink-0">
          <AlertDialog>
            <AlertDialogTrigger className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete item?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{item.title}</strong> will be permanently deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {item.description && (
          <Section label="Description">
            <p className="text-sm text-foreground/70 leading-relaxed">{item.description}</p>
          </Section>
        )}

        {preview && (
          <Section label="Content">
            {showLanguage ? (
              <CodeEditor value={item.content ?? ''} language={item.language ?? ''} readOnly />
            ) : showMarkdown ? (
              <MarkdownEditor value={item.content ?? ''} readOnly />
            ) : (
              <div
                className="rounded-md border p-3"
                style={{ borderColor: `${itemType.color}30`, backgroundColor: `${itemType.color}06` }}
              >
                <pre className="text-xs text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {preview}
                </pre>
              </div>
            )}
          </Section>
        )}

        {showFile && item.fileUrl && (
          <Section label={isImageType ? 'Image' : 'File'}>
            {isImageType ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/items/${item.id}/download`}
                alt={item.fileName ?? item.title}
                className="rounded-md border border-border max-h-80 w-full object-contain bg-muted/20"
              />
            ) : (
              <div
                className="flex items-center gap-3 rounded-md border p-3"
                style={{ borderColor: `${itemType.color}30`, backgroundColor: `${itemType.color}06` }}
              >
                <File className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.fileName ?? 'File'}</p>
                  {item.fileSize && (
                    <p className="text-xs text-muted-foreground">{formatBytes(item.fileSize)}</p>
                  )}
                </div>
              </div>
            )}
          </Section>
        )}

        {item.tags.length > 0 && (
          <Section label="Tags" icon={<Tag className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 h-auto font-normal rounded-md">
                  {tag}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {item.collections.length > 0 && (
          <Section label="Collections" icon={<FolderOpen className="h-3.5 w-3.5" />}>
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((col) => (
                <Badge key={col.id} variant="outline" className="text-xs px-2 py-0.5 h-auto font-normal rounded-md">
                  {col.name}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        <Section label="Details" icon={<Calendar className="h-3.5 w-3.5" />}>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/45">Created</span>
              <span className="text-foreground/70 tabular-nums">{createdDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/45">Updated</span>
              <span className="text-foreground/70 tabular-nums">{updatedDate}</span>
            </div>
          </div>
        </Section>
      </div>
    </>
  )
}

function Section({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-foreground/40">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
