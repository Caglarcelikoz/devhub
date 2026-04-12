'use client'

import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Copy, Check } from 'lucide-react'

const LINE_HEIGHT = 20 // px per line (matches fontSize 13 + line spacing)
const EDITOR_PADDING = 24 // top + bottom padding
const MIN_HEIGHT = 80
const MAX_HEIGHT = 400

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, language = '', readOnly = false }: CodeEditorProps) {
  const [copied, setCopied] = useState(false)

  const normalizedLanguage = normalizeLanguage(language)

  // Fluid height: grow with content, cap at MAX_HEIGHT
  const lineCount = value ? value.split('\n').length : 1
  const editorHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, lineCount * LINE_HEIGHT + EDITOR_PADDING))

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [value])

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange?.(val ?? '')
    },
    [onChange]
  )

  return (
    <div className="rounded-lg overflow-hidden border border-border/60" style={{ background: '#1e1e1e' }}>
      {/* macOS-style header */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background: '#2d2d2d', borderBottom: '1px solid #3a3a3a' }}
      >
        {/* Window dots */}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
        </div>

        {/* Language + Copy */}
        <div className="flex items-center gap-3">
          {language && (
            <span className="text-xs font-mono select-none" style={{ color: '#858585' }}>
              {language}
            </span>
          )}
          <button
            onClick={handleCopy}
            title="Copy code"
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
      </div>

      {/* Monaco Editor */}
      <Editor
        value={value}
        language={normalizedLanguage}
        theme="vs-dark"
        onChange={readOnly ? undefined : handleChange}
        loading={<EditorLoader />}
        height={editorHeight}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'hidden',
            verticalScrollbarSize: 6,
            useShadows: false,
          },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          renderLineHighlight: readOnly ? 'none' : 'line',
          contextmenu: false,
          folding: false,
          lineDecorationsWidth: 8,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  )
}

function EditorLoader() {
  return (
    <div
      className="flex items-center justify-center text-xs"
      style={{ height: MIN_HEIGHT, background: '#1e1e1e', color: '#858585' }}
    >
      Loading editor…
    </div>
  )
}

// Map common language aliases to Monaco's supported language IDs
function normalizeLanguage(lang: string): string {
  const map: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yml: 'yaml',
    md: 'markdown',
    rs: 'rust',
    go: 'go',
    cs: 'csharp',
    cpp: 'cpp',
    cc: 'cpp',
    kt: 'kotlin',
    java: 'java',
    php: 'php',
    sql: 'sql',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    xml: 'xml',
    dockerfile: 'dockerfile',
    plaintext: 'plaintext',
    text: 'plaintext',
    '': 'plaintext',
  }
  return map[lang.toLowerCase()] ?? lang.toLowerCase()
}
