'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Image } from 'lucide-react'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
const FILE_EXTENSIONS = ['.pdf', '.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.csv', '.toml', '.ini']

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
const FILE_TYPES = [
  'application/pdf', 'text/plain', 'text/markdown', 'application/json',
  'application/x-yaml', 'text/yaml', 'application/xml', 'text/xml',
  'text/csv', 'application/toml',
]

const IMAGE_MAX = 5 * 1024 * 1024
const FILE_MAX = 10 * 1024 * 1024

export interface UploadedFile {
  key: string
  fileName: string
  fileSize: number
  fileType: string
}

interface FileUploadProps {
  itemType: 'file' | 'image'
  onUploaded: (file: UploadedFile) => void
  onClear: () => void
  uploaded: UploadedFile | null
}

export function FileUpload({ itemType, onUploaded, onClear, uploaded }: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isImage = itemType === 'image'
  const allowedTypes = isImage ? IMAGE_TYPES : FILE_TYPES
  const allowedExtensions = isImage ? IMAGE_EXTENSIONS : FILE_EXTENSIONS
  const maxSize = isImage ? IMAGE_MAX : FILE_MAX
  const maxLabel = isImage ? '5 MB' : '10 MB'

  const validate = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type not allowed. Accepted: ${allowedExtensions.join(', ')}`
    }
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${maxLabel}`
    }
    return null
  }

  const upload = useCallback(async (file: File) => {
    const validationError = validate(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      // Get presigned URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          itemType,
        }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg ?? 'Failed to get upload URL')
      }

      const { uploadUrl, key } = await res.json() as { uploadUrl: string; key: string }

      // Upload directly to S3 with XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed with status ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
      })

      setProgress(100)
      onUploaded({ key, fileName: file.name, fileSize: file.size, fileType: file.type })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType, onUploaded])

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    upload(files[0])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleClear = () => {
    setError(null)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
    onClear()
  }

  // ── Uploaded state ──
  if (uploaded) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
        <div className="shrink-0 text-muted-foreground">
          {isImage ? <Image className="h-4 w-4" /> : <File className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{uploaded.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(uploaded.fileSize)}</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // ── Upload in progress ──
  if (uploading) {
    return (
      <div className="rounded-md border border-border bg-muted/20 px-4 py-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Uploading…</span>
          <span className="text-muted-foreground tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  // ── Drop zone ──
  return (
    <div className="space-y-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-primary/60 bg-primary/5'
            : 'border-border hover:border-border/80 hover:bg-muted/20'
        }`}
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm text-foreground/80">
            Drop {isImage ? 'an image' : 'a file'} here or{' '}
            <span className="text-primary font-medium">browse</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allowedExtensions.join(', ')} · max {maxLabel}
          </p>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={allowedExtensions.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
