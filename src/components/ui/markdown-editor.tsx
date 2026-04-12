'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'

const MIN_HEIGHT = 80
const MAX_HEIGHT = 400

interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Write markdown…',
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>(readOnly ? 'preview' : 'write')
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
    },
    [onChange]
  )

  // Estimate textarea rows for fluid height (cap at MAX_HEIGHT)
  const lineCount = value ? value.split('\n').length : 1
  const textareaRows = Math.max(4, Math.min(20, lineCount + 1))

  return (
    <div className="rounded-lg overflow-hidden border border-border/60" style={{ background: '#1e1e1e' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background: '#2d2d2d', borderBottom: '1px solid #3a3a3a' }}
      >
        {/* Tabs — only show in edit mode */}
        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <TabButton active={tab === 'write'} onClick={() => setTab('write')}>
                Write
              </TabButton>
              <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
                Preview
              </TabButton>
            </>
          )}
          {readOnly && (
            <span className="text-xs font-medium" style={{ color: '#858585' }}>
              Preview
            </span>
          )}
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          title="Copy content"
          className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors"
          style={{ color: '#858585' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#cccccc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = copied ? '#34d399' : '#858585')}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" style={{ color: '#34d399' }} />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Body */}
      <div style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT, overflowY: 'auto' }}>
        {tab === 'write' && !readOnly ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={textareaRows}
            className="w-full bg-transparent px-4 py-3 text-sm font-mono outline-none resize-none"
            style={{
              color: '#cccccc',
              caretColor: '#cccccc',
              minHeight: MIN_HEIGHT,
            }}
          />
        ) : (
          <div
            className="markdown-preview px-4 py-3"
            style={{ minHeight: MIN_HEIGHT }}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            ) : (
              <span style={{ color: '#555555', fontSize: '0.8125rem' }}>
                Nothing to preview.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
      style={{
        color: active ? '#e8e8e8' : '#858585',
        background: active ? '#3a3a3a' : 'transparent',
      }}
    >
      {children}
    </button>
  )
}
