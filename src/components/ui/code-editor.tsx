'use client'

import { useState, useCallback, useEffect } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { Copy, Check } from 'lucide-react'
import { useEditorPreferences } from '@/context/EditorPreferencesContext'

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
}

export function CodeEditor({ value, onChange, language = '', onLanguageChange, readOnly = false, minHeight = MIN_HEIGHT }: CodeEditorProps) {
  const [copied, setCopied] = useState(false)
  const monaco = useMonaco()
  const { preferences } = useEditorPreferences()

  const normalizedLanguage = normalizeLanguage(language)

  // Register custom themes once Monaco is loaded
  useEffect(() => {
    if (!monaco) return
    monaco.editor.defineTheme('monokai', MONOKAI_THEME)
    monaco.editor.defineTheme('github-dark', GITHUB_DARK_THEME)
  }, [monaco])

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

  return (
    <div className="rounded-lg overflow-hidden border border-border/60" style={{ background: bg }}>
      {/* macOS-style header */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}
      >
        {/* Window dots */}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
          <div className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
        </div>

        {/* Language selector + Copy */}
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
        theme={preferences.theme}
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
