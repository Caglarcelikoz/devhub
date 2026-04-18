'use client'

import { Download, FileText, FileImage, FileCode, FileArchive, FileAudio, FileVideo, File } from 'lucide-react'
import type { ItemWithMeta } from '@/lib/db/items'

interface FileListViewProps {
  items: ItemWithMeta[]
  onItemClick?: (id: string) => void
}

export function FileListView({ items, onItemClick }: FileListViewProps) {
  if (items.length === 0) {
    return <p className="text-sm text-foreground/40">No items yet.</p>
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border bg-card overflow-hidden">
      {items.map((item) => (
        <FileListRow key={item.id} item={item} onItemClick={onItemClick} />
      ))}
    </div>
  )
}

function FileListRow({
  item,
  onItemClick,
}: {
  item: ItemWithMeta
  onItemClick?: (id: string) => void
}) {
  const extension = getExtension(item.fileName)
  const iconColor = '#6b7280'

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = `/api/items/${item.id}/download`
    link.download = item.fileName ?? item.title
    link.click()
  }

  return (
    <div
      onClick={() => onItemClick?.(item.id)}
      className="group flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40"
    >
      {/* File icon */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ backgroundColor: `${iconColor}18` }}
      >
        {getFileIcon(extension, iconColor)}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-foreground leading-snug truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.fileName && (
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {item.fileName}
            </span>
          )}
          {item.fileName && item.fileSize != null && (
            <span className="text-xs text-muted-foreground/50">·</span>
          )}
          {item.fileSize != null && (
            <span className="text-sm text-muted-foreground shrink-0">
              {formatFileSize(item.fileSize)}
            </span>
          )}
        </div>
      </div>

      {/* Date — hidden on mobile, shown on sm+ */}
      <span className="hidden sm:block text-[13px] text-foreground/35 tabular-nums shrink-0">
        {formatDate(item.updatedAt)}
      </span>

      {/* Download button */}
      <button
        onClick={handleDownload}
        aria-label={`Download ${item.title}`}
        className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  )
}

function getExtension(fileName: string | null): string {
  if (!fileName) return ''
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function getFileIcon(ext: string, color: string) {
  const props = { className: 'w-4 h-4', style: { color } }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp'].includes(ext)) return <FileImage {...props} />
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) return <FileAudio {...props} />
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return <FileVideo {...props} />
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) return <FileArchive {...props} />
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'cs', 'php', 'html', 'css', 'json', 'yaml', 'yml', 'toml', 'sh', 'bash'].includes(ext)) return <FileCode {...props} />
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'csv', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return <FileText {...props} />
  return <File {...props} />
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
