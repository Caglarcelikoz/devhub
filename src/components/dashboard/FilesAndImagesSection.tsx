'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Download,
  File,
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  Images,
  ChevronRight,
} from 'lucide-react'
import { ItemDrawer } from '@/components/dashboard/ItemDrawer'
import { formatBytes, formatDate } from '@/lib/utils/format'
import type { ItemWithMeta } from '@/lib/db/items'
import type { CollectionOption } from '@/lib/db/collections'

interface FilesAndImagesSectionProps {
  files: ItemWithMeta[]
  images: ItemWithMeta[]
  thumbnailUrls: Record<string, string>
  collections: CollectionOption[]
  isPro: boolean
  totalFiles: number
  totalImages: number
}

export function FilesAndImagesSection({
  files,
  images,
  thumbnailUrls,
  collections,
  isPro,
  totalFiles,
  totalImages,
}: FilesAndImagesSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (files.length === 0 && images.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-foreground/40">
          <Images className="h-4 w-4" />
        </span>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
          Files & Images
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Files column */}
        {files.length > 0 && (
          <div className="flex flex-col rounded-lg border border-border overflow-hidden bg-card">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Files</span>
              {totalFiles > files.length && (
                <Link
                  href="/items/files"
                  className="text-xs text-foreground/50 hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  View all {totalFiles}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="flex flex-col divide-y divide-border">
              {files.map((file) => (
                <FileRow key={file.id} item={file} onItemClick={setSelectedId} />
              ))}
            </div>
          </div>
        )}

        {/* Images column */}
        {images.length > 0 && (
          <div className="flex flex-col rounded-lg border border-border overflow-hidden bg-card">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Images</span>
              {totalImages > images.length && (
                <Link
                  href="/items/images"
                  className="text-xs text-foreground/50 hover:text-foreground flex items-center gap-0.5 transition-colors"
                >
                  View all {totalImages}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {images.map((image) => (
                <ImageThumb
                  key={image.id}
                  item={image}
                  thumbnailUrl={thumbnailUrls[image.id]}
                  onItemClick={setSelectedId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ItemDrawer
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
        collections={collections}
        isPro={isPro}
      />
    </section>
  )
}

function FileRow({ item, onItemClick }: { item: ItemWithMeta; onItemClick: (id: string) => void }) {
  const ext = getExtension(item.fileName)

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = `/api/items/${item.id}/download`
    link.download = item.fileName ?? item.title
    link.click()
  }

  return (
    <div
      onClick={() => onItemClick(item.id)}
      className="group flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-md shrink-0 bg-foreground/6">
        {getFileIcon(ext)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {item.fileSize != null ? formatBytes(item.fileSize) : ''}{item.fileSize != null && item.fileName ? ' · ' : ''}{item.fileName ?? ''}
        </p>
      </div>
      <span className="hidden sm:block text-xs text-foreground/35 shrink-0 tabular-nums">
        {formatDate(item.updatedAt)}
      </span>
      <button
        onClick={handleDownload}
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        aria-label="Download"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function ImageThumb({
  item,
  thumbnailUrl,
  onItemClick,
}: {
  item: ItemWithMeta
  thumbnailUrl?: string
  onItemClick: (id: string) => void
}) {
  return (
    <button
      onClick={() => onItemClick(item.id)}
      className="group relative aspect-square overflow-hidden bg-muted rounded-sm"
      title={item.title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl ?? `/api/items/${item.id}/download`}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
    </button>
  )
}

function getExtension(fileName: string | null): string {
  if (!fileName) return ''
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function getFileIcon(ext: string) {
  const cls = 'w-4 h-4 text-foreground/50'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <FileImage className={cls} />
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return <FileArchive className={cls} />
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'json', 'yaml', 'yml', 'sh'].includes(ext)) return <FileCode className={cls} />
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xls', 'xlsx'].includes(ext)) return <FileText className={cls} />
  return <File className={cls} />
}
