'use client'

import { Check, X, FolderOpen, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CodeEditor } from '@/components/ui/code-editor'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import type { ItemDetail } from '@/lib/db/items'

const LANGUAGE_TYPES = ['snippet', 'command']
const MARKDOWN_TYPES = ['note', 'prompt']
const TEXT_TYPES = ['snippet', 'prompt', 'command', 'note']

interface ItemDrawerEditProps {
  item: ItemDetail
  title: string
  description: string
  content: string
  url: string
  language: string
  tagsInput: string
  saving: boolean
  onTitleChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onContentChange: (v: string) => void
  onUrlChange: (v: string) => void
  onLanguageChange: (v: string) => void
  onTagsInputChange: (v: string) => void
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
  saving,
  onTitleChange,
  onDescriptionChange,
  onContentChange,
  onUrlChange,
  onLanguageChange,
  onTagsInputChange,
  onSave,
  onCancel,
}: ItemDrawerEditProps) {
  const { itemType } = item
  const showContent = TEXT_TYPES.includes(itemType.name)
  const showLanguage = LANGUAGE_TYPES.includes(itemType.name)
  const showMarkdown = MARKDOWN_TYPES.includes(itemType.name)
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
        <EditSection label="Description">
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Optional description…"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </EditSection>

        {showUrl && (
          <EditSection label="URL">
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </EditSection>
        )}

        {showLanguage && (
          <EditSection label="Language">
            <input
              type="text"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              placeholder="e.g. typescript, bash…"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </EditSection>
        )}

        {showContent && (
          <EditSection label="Content">
            {showLanguage ? (
              <CodeEditor value={content} onChange={onContentChange} language={language} />
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
          </EditSection>
        )}

        <EditSection label="Tags">
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => onTagsInputChange(e.target.value)}
            placeholder="react, hooks, auth (comma-separated)"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
        </EditSection>

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

function EditSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/40">{label}</span>
      {children}
    </div>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
