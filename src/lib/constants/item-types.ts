import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link,
} from 'lucide-react'

export const ITEM_TYPE_ICONS = {
  snippet: Code,
  prompt: Sparkles,
  command: Terminal,
  note: StickyNote,
  file: File,
  image: Image,
  link: Link,
} as const

export const ITEM_TYPE_COLORS = {
  snippet: '#3b82f6',
  prompt: '#8b5cf6',
  command: '#f97316',
  note: '#fde047',
  file: '#6b7280',
  image: '#ec4899',
  link: '#10b981',
} as const

export const TEXT_TYPES = ['snippet', 'prompt', 'command', 'note'] as const
export const LANGUAGE_TYPES = ['snippet', 'command'] as const
export const MARKDOWN_TYPES = ['note', 'prompt'] as const
export const FILE_TYPES = ['file', 'image'] as const

export type TextType = (typeof TEXT_TYPES)[number]
export type LanguageType = (typeof LANGUAGE_TYPES)[number]
export type MarkdownType = (typeof MARKDOWN_TYPES)[number]
export type FileType = (typeof FILE_TYPES)[number]

export const isTextType = (name: string): name is TextType =>
  (TEXT_TYPES as readonly string[]).includes(name)
export const isLanguageType = (name: string): name is LanguageType =>
  (LANGUAGE_TYPES as readonly string[]).includes(name)
export const isMarkdownType = (name: string): name is MarkdownType =>
  (MARKDOWN_TYPES as readonly string[]).includes(name)
export const isFileType = (name: string): name is FileType =>
  (FILE_TYPES as readonly string[]).includes(name)
