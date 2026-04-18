'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeEditor } from '@/components/ui/code-editor'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { FileUpload } from '@/components/ui/file-upload'
import type { UploadedFile } from '@/components/ui/file-upload'
import { createItem } from '@/actions/items'
import { CollectionSelector } from '@/components/ui/collection-selector'
import type { CollectionOption } from '@/lib/db/collections'
import { TagsField } from '@/components/ui/tags-field'
import { DescriptionField } from '@/components/ui/description-field'
import { useUsageLimits } from '@/context/UsageLimitsContext'

export type CreatableType = 'snippet' | 'prompt' | 'command' | 'note' | 'link' | 'file' | 'image'

const TYPES: { value: CreatableType; label: string }[] = [
  { value: 'snippet', label: 'Snippet' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'command', label: 'Command' },
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'file', label: 'File' },
  { value: 'image', label: 'Image' },
]

const TEXT_TYPES: CreatableType[] = ['snippet', 'prompt', 'command', 'note']
const LANGUAGE_TYPES: CreatableType[] = ['snippet', 'command']
const MARKDOWN_TYPES: CreatableType[] = ['note', 'prompt']
const FILE_TYPES: CreatableType[] = ['file', 'image']

interface CreateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: CreatableType
  collections?: CollectionOption[]
}

export function CreateItemDialog({ open, onOpenChange, defaultType, collections = [] }: CreateItemDialogProps) {
  const router = useRouter()
  const { isPro } = useUsageLimits()

  const [itemTypeName, setItemTypeName] = useState<CreatableType>(defaultType ?? 'snippet')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [saving, setSaving] = useState(false)

  const showContent = TEXT_TYPES.includes(itemTypeName)
  const showLanguage = LANGUAGE_TYPES.includes(itemTypeName)
  const showMarkdown = MARKDOWN_TYPES.includes(itemTypeName)
  const showUrl = itemTypeName === 'link'
  const showFileUpload = FILE_TYPES.includes(itemTypeName)

  const resetForm = () => {
    setItemTypeName(defaultType ?? 'snippet')
    setTitle('')
    setDescription('')
    setContent('')
    setUrl('')
    setLanguage('')
    setTagsInput('')
    setSelectedCollections([])
    setUploadedFile(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const handleTypeChange = (v: string | null) => {
    if (!v) return
    setItemTypeName(v as CreatableType)
    setUploadedFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    setSaving(true)
    const result = await createItem({
      itemTypeName,
      title: title.trim(),
      description: description.trim() || null,
      content: content || null,
      fileUrl: uploadedFile?.key ?? null,
      fileName: uploadedFile?.fileName ?? null,
      fileSize: uploadedFile?.fileSize ?? null,
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

    toast.success('Item created')
    handleOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
              Type
            </label>
            <Select value={itemTypeName} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Item title"
              required
            />
          </div>

          {/* Description */}
          <DescriptionField
            value={description}
            onChange={setDescription}
            isPro={isPro}
            title={title}
            itemType={itemTypeName}
            content={content || undefined}
            url={url || undefined}
            fileName={uploadedFile?.fileName ?? undefined}
            language={language || undefined}
          />

          {/* URL — link only */}
          {showUrl && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
                URL <span className="text-destructive">*</span>
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          )}

          {/* Content — text types */}
          {showContent && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
                Content
              </label>
              {showLanguage ? (
                <CodeEditor value={content} onChange={setContent} language={language} onLanguageChange={setLanguage} />
              ) : showMarkdown ? (
                <MarkdownEditor value={content} onChange={setContent} />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Content…"
                  rows={5}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y placeholder:text-muted-foreground"
                />
              )}
            </div>
          )}

          {/* File/image upload */}
          {showFileUpload && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
                {itemTypeName === 'image' ? 'Image' : 'File'} <span className="text-destructive">*</span>
              </label>
              <FileUpload
                itemType={itemTypeName as 'file' | 'image'}
                uploaded={uploadedFile}
                onUploaded={setUploadedFile}
                onClear={() => setUploadedFile(null)}
              />
            </div>
          )}

          {/* Tags */}
          <TagsField
            value={tagsInput}
            onChange={setTagsInput}
            isPro={isPro}
            title={title}
            content={content || undefined}
            itemType={itemTypeName}
          />

          {/* Collections */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
              Collections
            </label>
            <CollectionSelector
              collections={collections}
              selected={selectedCollections}
              onChange={setSelectedCollections}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !title.trim() ||
                saving ||
                (showFileUpload && !uploadedFile)
              }
            >
              {saving ? 'Creating…' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
