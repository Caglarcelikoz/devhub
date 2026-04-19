'use client'

import { Check, X, Calendar } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'
import { CodeEditor } from '@/components/ui/code-editor'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { CollectionSelector } from '@/components/ui/collection-selector'
import { TagsField } from '@/components/ui/tags-field'
import { DescriptionField } from '@/components/ui/description-field'
import { useUsageLimits } from '@/context/UsageLimitsContext'
import type { ItemDetail } from '@/lib/db/items'
import type { CollectionOption } from '@/lib/db/collections'
import { isTextType, isLanguageType, isMarkdownType } from '@/lib/constants/item-types'
import { formatDate } from '@/lib/utils/format'

interface ItemDrawerEditProps {
  item: ItemDetail
  title: string
  description: string
  content: string
  url: string
  language: string
  tagsInput: string
  selectedCollections: string[]
  collections: CollectionOption[]
  saving: boolean
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onContentChange: (v: string) => void
  onUrlChange: (v: string) => void
  onLanguageChange: (v: string) => void
  onTagsInputChange: (v: string) => void
  onSelectedCollectionsChange: (ids: string[]) => void
  onSave: () => void
  onCancel: () => void
}

export function ItemDrawerEdit({
  item,
  title,
  description,
  content,
  url,
  language,
  tagsInput,
  selectedCollections,
  collections,
  saving,
  onTitleChange,
  onDescriptionChange,
  onContentChange,
  onUrlChange,
  onLanguageChange,
  onTagsInputChange,
  onSelectedCollectionsChange,
  onSave,
  onCancel,
}: ItemDrawerEditProps) {
  const { isPro } = useUsageLimits()
  const { itemType } = item
  const showContent = isTextType(itemType.name)
  const showLanguage = isLanguageType(itemType.name)
  const showMarkdown = isMarkdownType(itemType.name)
  const showUrl = itemType.name === 'link'
  const createdDate = formatDate(new Date(item.createdAt))
  const updatedDate = formatDate(new Date(item.updatedAt))

  return (
    <>
      {/* ── Save / Cancel bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-y border-border/60 shrink-0">
        <button
          onClick={onSave}
          disabled={!title.trim() || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <DescriptionField
          value={description}
          onChange={onDescriptionChange}
          isPro={isPro}
          title={title}
          itemType={item.itemType.name}
          content={content || undefined}
          url={url || undefined}
          fileName={item.fileName ?? undefined}
          language={language || undefined}
          rows={4}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
        />

        {showUrl && (
          <SectionLabel label="URL">
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </SectionLabel>
        )}

        {showContent && (
          <SectionLabel label="Content">
            {showLanguage ? (
              <CodeEditor value={content} onChange={onContentChange} language={language} onLanguageChange={onLanguageChange} minHeight={300} />
            ) : showMarkdown ? (
              <MarkdownEditor value={content} onChange={onContentChange} />
            ) : (
              <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Content…"
                rows={8}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-foreground outline-none focus:ring-1 focus:ring-ring resize-y"
              />
            )}
          </SectionLabel>
        )}

        <TagsField
          value={tagsInput}
          onChange={onTagsInputChange}
          isPro={isPro}
          title={title}
          content={content || undefined}
          itemType={item.itemType.name}
        />

        <SectionLabel label="Collections">
          <CollectionSelector
            collections={collections}
            selected={selectedCollections}
            onChange={onSelectedCollectionsChange}
          />
        </SectionLabel>

        <SectionLabel label="Details" icon={<Calendar className="h-3.5 w-3.5" />}>
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
        </SectionLabel>
      </div>
    </>
  )
}


