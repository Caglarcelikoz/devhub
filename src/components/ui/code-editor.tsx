'use client'

import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Copy, Check, Sparkles, Loader2, Crown } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useQueryClient } from '@tanstack/react-query'
import { useEditorPreferences } from '@/context/EditorPreferencesContext'
import { explainCode } from '@/actions/ai'

export const SUPPORTED_LANGUAGES = [
  { value: '', label: 'Plain Text' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'tsx', label: 'TSX' },
  { value: 'jsx', label: 'JSX' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'dockerfile', label: 'Dockerfile' },
]

const LINE_HEIGHT = 20 // px per line (matches fontSize 13 + line spacing)
const EDITOR_PADDING = 24 // top + bottom padding
const MIN_HEIGHT = 80
const MAX_HEIGHT = 600

// Custom theme definitions
const MONOKAI_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'f92672' },
    { token: 'string', foreground: 'e6db74' },
    { token: 'number', foreground: 'ae81ff' },
    { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
    { token: 'function', foreground: 'a6e22e' },
    { token: 'variable', foreground: 'f8f8f2' },
    { token: 'operator', foreground: 'f92672' },
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#f8f8f2',
    'editor.lineHighlightBackground': '#3e3d32',
    'editorLineNumber.foreground': '#75715e',
    'editor.selectionBackground': '#49483e',
    'editorCursor.foreground': '#f8f8f0',
  },
}

const GITHUB_DARK_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff7b72' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'number', foreground: '79c0ff' },
    { token: 'type', foreground: 'ffa657' },
    { token: 'function', foreground: 'd2a8ff' },
    { token: 'variable', foreground: 'ffa657' },
    { token: 'operator', foreground: 'ff7b72' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
    'editor.lineHighlightBackground': '#161b22',
    'editorLineNumber.foreground': '#8b949e',
    'editor.selectionBackground': '#3b5070',
    'editorCursor.foreground': '#c9d1d9',
  },
}

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  onLanguageChange?: (language: string) => void
  readOnly?: boolean
  minHeight?: number
  // Explain feature — only active in read-only drawer view
  showExplain?: boolean
  isPro?: boolean
  itemId?: string
  itemTitle?: string
  itemType?: 'snippet' | 'command'
}

import type { Monaco } from '@monaco-editor/react'

function registerThemes(monaco: Monaco) {
  monaco.editor.defineTheme('monokai', MONOKAI_THEME)
  monaco.editor.defineTheme('github-dark', GITHUB_DARK_THEME)
}

export function CodeEditor({
  value,
  onChange,
  language = '',
  onLanguageChange,
  readOnly = false,
  minHeight = MIN_HEIGHT,
  showExplain = false,
  isPro = false,
  itemId,
  itemTitle = '',
  itemType,
}: CodeEditorProps) {
  const queryClient = useQueryClient()
  const cachedExplanation = itemId
    ? (queryClient.getQueryData<string>(['item-explain', itemId]) ?? null)
    : null

  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'explain'>(cachedExplanation ? 'explain' : 'code')
  const [explanation, setExplanation] = useState<string | null>(cachedExplanation)
  const [explaining, setExplaining] = useState(false)
  const { preferences } = useEditorPreferences()

  const normalizedLanguage = normalizeLanguage(language)

  // Fluid height: grow with content, cap at MAX_HEIGHT
  const lineCount = value ? value.split('\n').length : 1
  const editorHeight = Math.min(MAX_HEIGHT, Math.max(minHeight, lineCount * LINE_HEIGHT + EDITOR_PADDING))

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

  const handleExplain = useCallback(async () => {
    if (!value.trim() || !itemType) return
    setExplaining(true)
    const result = await explainCode({
      title: itemTitle,
      content: value,
      language: language || null,
      itemType,
    })
    setExplaining(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setExplanation(result.data)
    if (itemId) {
      queryClient.setQueryData(['item-explain', itemId], result.data)
    }
    setActiveTab('explain')
  }, [value, itemTitle, language, itemType, itemId, queryClient])

  // Background color by theme
  const bg = preferences.theme === 'monokai'
    ? '#272822'
    : preferences.theme === 'github-dark'
      ? '#0d1117'
      : '#1e1e1e'

  const headerBg = preferences.theme === 'monokai'
    ? '#3e3d32'
    : preferences.theme === 'github-dark'
      ? '#161b22'
      : '#2d2d2d'

  const headerBorder = preferences.theme === 'monokai'
    ? '#49483e'
    : preferences.theme === 'github-dark'
      ? '#30363d'
      : '#3a3a3a'

  const hasExplanation = explanation !== null

  return (
    <div className="rounded-lg overflow-hidden border border-border/60" style={{ background: bg }}>
      {/* macOS-style header */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}
      >
        {/* Left: window dots + optional Code/Explain tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
            <div className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
          </div>

          {/* Code/Explain tabs — appear once explanation is available */}
          {hasExplanation && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className="text-xs px-2 py-0.5 rounded transition-colors"
                style={{
                  color: activeTab === 'code' ? '#cccccc' : '#858585',
                  background: activeTab === 'code' ? `${headerBorder}80` : 'transparent',
                }}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explain')}
                className="text-xs px-2 py-0.5 rounded transition-colors"
                style={{
                  color: activeTab === 'explain' ? '#cccccc' : '#858585',
                  background: activeTab === 'explain' ? `${headerBorder}80` : 'transparent',
                }}
              >
                Explain
              </button>
            </div>
          )}
        </div>

        {/* Right: Language selector + Copy + Explain */}
        <div className="flex items-center gap-3">
          {onLanguageChange ? (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="text-xs font-mono rounded px-1.5 py-0.5 outline-none cursor-pointer border-0"
              style={{ background: headerBg, color: '#858585' }}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value} style={{ background: '#1e1e1e' }}>
                  {l.label}
                </option>
              ))}
            </select>
          ) : language ? (
            <span className="text-xs font-mono select-none" style={{ color: '#858585' }}>
              {language}
            </span>
          ) : null}

          <button
            type="button"
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

          {showExplain && (
            isPro ? (
              <button
                type="button"
                onClick={handleExplain}
                disabled={explaining}
                title="Explain this code"
                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
                style={{ color: '#858585' }}
                onMouseEnter={(e) => { if (!explaining) e.currentTarget.style.color = '#cccccc' }}
                onMouseLeave={(e) => { if (!explaining) e.currentTarget.style.color = '#858585' }}
              >
                {explaining ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{explaining ? 'Explaining…' : 'Explain'}</span>
              </button>
            ) : (
              <span
                title="AI features require Pro subscription"
                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded cursor-default select-none opacity-50"
                style={{ color: '#858585' }}
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Explain</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* Explain tab content */}
      {activeTab === 'explain' && explanation ? (
        <div
          className="markdown-preview overflow-y-auto px-4 py-4 text-base leading-7"
          style={{ minHeight, maxHeight: MAX_HEIGHT, background: bg, color: '#cccccc' }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
        </div>
      ) : (
        /* Monaco Editor */
        <Editor
          value={value}
          language={normalizedLanguage}
          theme={preferences.theme}
          beforeMount={registerThemes}
          onChange={readOnly ? undefined : handleChange}
          loading={<EditorLoader bg={bg} />}
          height={editorHeight}
          options={{
            readOnly,
            minimap: { enabled: preferences.minimap },
            fontSize: preferences.fontSize,
            tabSize: preferences.tabSize,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: preferences.wordWrap ? 'on' : 'off',
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
      )}
    </div>
  )
}

function EditorLoader({ bg }: { bg: string }) {
  return (
    <div
      className="flex items-center justify-center text-xs"
      style={{ height: MIN_HEIGHT, background: bg, color: '#858585' }}
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
