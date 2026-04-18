'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Sparkles, Loader2, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { optimizePrompt } from '@/actions/ai'

const MIN_HEIGHT = 80
const DEFAULT_MAX_HEIGHT = 400

interface MarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  maxHeight?: number
  // Optimize feature — only active in read-only drawer view for prompt type
  showOptimize?: boolean
  isPro?: boolean
  itemId?: string
  itemTitle?: string
  onAcceptOptimized?: (optimized: string) => void
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Write markdown…',
  maxHeight = DEFAULT_MAX_HEIGHT,
  showOptimize = false,
  isPro = false,
  itemId,
  itemTitle = '',
  onAcceptOptimized,
}: MarkdownEditorProps) {
  const queryClient = useQueryClient()
  const cachedResult = itemId
    ? (queryClient.getQueryData<{ optimized: string; note: string }>(['item-optimize', itemId]) ?? null)
    : null

  const [tab, setTab] = useState<'write' | 'preview'>(readOnly ? 'preview' : 'write')
  const [activeView, setActiveView] = useState<'original' | 'optimized'>(cachedResult ? 'optimized' : 'original')
  const [optimizeResult, setOptimizeResult] = useState<{ optimized: string; note: string } | null>(cachedResult)
  const [optimizing, setOptimizing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const textToCopy = activeView === 'optimized' && optimizeResult ? optimizeResult.optimized : value
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [value, activeView, optimizeResult])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
    },
    [onChange]
  )

  const handleOptimize = useCallback(async () => {
    if (!value.trim()) return
    setOptimizing(true)
    const result = await optimizePrompt({ title: itemTitle, content: value })
    setOptimizing(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setOptimizeResult(result.data)
    if (itemId) {
      queryClient.setQueryData(['item-optimize', itemId], result.data)
    }
    setActiveView('optimized')
  }, [value, itemTitle, itemId, queryClient])

  const handleAccept = useCallback(() => {
    if (!optimizeResult) return
    onAcceptOptimized?.(optimizeResult.optimized)
    setOptimizeResult(null)
    setActiveView('original')
    if (itemId) {
      queryClient.removeQueries({ queryKey: ['item-optimize', itemId] })
    }
  }, [optimizeResult, onAcceptOptimized, itemId, queryClient])

  // Estimate textarea rows for fluid height
  const lineCount = value ? value.split('\n').length : 1
  const textareaRows = Math.max(4, Math.min(20, lineCount + 1))

  const displayValue = activeView === 'optimized' && optimizeResult ? optimizeResult.optimized : value
  const hasOptimization = optimizeResult !== null

  return (
    <div className="rounded-lg overflow-hidden border border-border/60" style={{ background: '#1e1e1e' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background: '#2d2d2d', borderBottom: '1px solid #3a3a3a' }}
      >
        {/* Left: tabs */}
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
          {readOnly && !hasOptimization && (
            <span className="text-xs font-medium" style={{ color: '#858585' }}>
              Preview
            </span>
          )}
          {readOnly && hasOptimization && (
            <>
              <TabButton active={activeView === 'original'} onClick={() => setActiveView('original')}>
                Original
              </TabButton>
              <TabButton active={activeView === 'optimized'} onClick={() => setActiveView('optimized')}>
                Optimized
              </TabButton>
            </>
          )}
        </div>

        {/* Right: Copy + Optimize */}
        <div className="flex items-center gap-3">
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

          {showOptimize && (
            isPro ? (
              <button
                type="button"
                onClick={handleOptimize}
                disabled={optimizing}
                title="Optimize this prompt"
                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
                style={{ color: '#858585' }}
                onMouseEnter={(e) => { if (!optimizing) e.currentTarget.style.color = '#cccccc' }}
                onMouseLeave={(e) => { if (!optimizing) e.currentTarget.style.color = '#858585' }}
              >
                {optimizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{optimizing ? 'Optimizing…' : 'Optimize'}</span>
              </button>
            ) : (
              <span
                title="AI features require Pro subscription"
                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded cursor-default select-none opacity-50"
                style={{ color: '#858585' }}
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Optimize</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* Body */}
      <div className="editor-scrollbar" style={{ minHeight: MIN_HEIGHT, maxHeight, overflowY: 'auto' }}>
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
            {displayValue ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayValue}
              </ReactMarkdown>
            ) : (
              <span style={{ color: '#555555', fontSize: '0.8125rem' }}>
                Nothing to preview.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Optimization note + Accept banner */}
      {hasOptimization && activeView === 'optimized' && optimizeResult && (
        <div
          className="px-4 py-3 space-y-3"
          style={{ background: '#1a1a2e', borderTop: '1px solid #4f46e520' }}
        >
          {optimizeResult.note && (
            <div className="flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#818cf8' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#a5b4fc' }}>
                {optimizeResult.note}
              </p>
            </div>
          )}
          {onAcceptOptimized && (
            <button
              type="button"
              onClick={handleAccept}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all"
              style={{ background: '#4f46e5', color: '#ffffff' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#4338ca')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
            >
              <Sparkles className="h-4 w-4" />
              Use optimized prompt
            </button>
          )}
        </div>
      )}
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
