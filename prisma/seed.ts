import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const systemItemTypes = [
  { name: 'snippet', icon: 'Code', color: '#3b82f6', isSystem: true },
  { name: 'prompt', icon: 'Sparkles', color: '#8b5cf6', isSystem: true },
  { name: 'command', icon: 'Terminal', color: '#f97316', isSystem: true },
  { name: 'note', icon: 'StickyNote', color: '#fde047', isSystem: true },
  { name: 'file', icon: 'File', color: '#6b7280', isSystem: true },
  { name: 'image', icon: 'Image', color: '#ec4899', isSystem: true },
  { name: 'link', icon: 'Link', color: '#10b981', isSystem: true },
]

async function main() {
  // ── System Item Types ──────────────────────────────────────────────────────
  console.log('Seeding system item types...')

  for (const type of systemItemTypes) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, userId: null },
    })
    if (!existing) {
      await prisma.itemType.create({
        data: { ...type, userId: null },
      })
    }
  }

  // ── Demo User ──────────────────────────────────────────────────────────────
  console.log('Seeding demo user...')

  const hashedPassword = await bcrypt.hash('12345678', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@devstash.io' },
    update: {},
    create: {
      email: 'demo@devstash.io',
      name: 'Demo User',
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  })

  // Fetch item type IDs
  const typeMap: Record<string, string> = {}
  const allTypes = await prisma.itemType.findMany({ where: { isSystem: true } })
  for (const t of allTypes) typeMap[t.name] = t.id

  // ── Collections & Items ────────────────────────────────────────────────────
  console.log('Seeding collections and items...')

  // Helper to create a collection + items atomically
  async function createCollection(
    name: string,
    description: string,
    defaultTypeName: string,
    items: Array<{
      title: string
      contentType: 'TEXT' | 'URL'
      content?: string
      url?: string
      description?: string
      language?: string
      typeName: string
      isPinned?: boolean
      isFavorite?: boolean
    }>
  ) {
    const existing = await prisma.collection.findFirst({
      where: { name, userId: user.id },
    })
    if (existing) {
      console.log(`  Collection "${name}" already exists, skipping.`)
      return
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId: user.id,
        defaultTypeId: typeMap[defaultTypeName],
      },
    })

    for (const item of items) {
      const created = await prisma.item.create({
        data: {
          title: item.title,
          contentType: item.contentType,
          content: item.content,
          url: item.url,
          description: item.description,
          language: item.language,
          isPinned: item.isPinned ?? false,
          isFavorite: item.isFavorite ?? false,
          userId: user.id,
          itemTypeId: typeMap[item.typeName],
        },
      })

      await prisma.itemCollection.create({
        data: { itemId: created.id, collectionId: collection.id },
      })
    }

    console.log(`  Created "${name}" with ${items.length} item(s).`)
  }

  // ── React Patterns ─────────────────────────────────────────────────────────
  await createCollection('React Patterns', 'Reusable React patterns and hooks', 'snippet', [
    {
      title: 'Custom Hooks: useDebounce & useLocalStorage',
      typeName: 'snippet',
      contentType: 'TEXT',
      language: 'typescript',
      isPinned: true,
      content: `import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}`,
    },
    {
      title: 'Component Patterns: Context Provider & Compound Components',
      typeName: 'snippet',
      contentType: 'TEXT',
      language: 'typescript',
      content: `import React, { createContext, useContext, useState } from 'react'

// ── Context Provider Pattern ───────────────────────────────
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

// ── Compound Component Pattern ─────────────────────────────
interface CardProps { children: React.ReactNode; className?: string }

function Card({ children, className = '' }: CardProps) {
  return <div className={\`rounded-lg border p-4 \${className}\`}>{children}</div>
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 font-semibold">{children}</div>
}

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground">{children}</div>
}

export { Card }`,
    },
    {
      title: 'Utility Functions: cn, formatDate, truncate',
      typeName: 'snippet',
      contentType: 'TEXT',
      language: 'typescript',
      content: `import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a date to a readable string */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

/** Truncate a string to a given length */
export function truncate(str: string, length: number): string {
  return str.length > length ? \`\${str.slice(0, length)}…\` : str
}

/** Sleep for N milliseconds (useful in tests/demos) */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))`,
    },
  ])

  // ── AI Workflows ───────────────────────────────────────────────────────────
  await createCollection('AI Workflows', 'AI prompts and workflow automations', 'prompt', [
    {
      title: 'Code Review Prompt',
      typeName: 'prompt',
      contentType: 'TEXT',
      isPinned: true,
      content: `You are an expert code reviewer. Review the following code and provide structured feedback.

Focus on:
1. **Correctness** — Are there bugs, edge cases, or logic errors?
2. **Security** — Any vulnerabilities (injection, XSS, auth issues, exposed secrets)?
3. **Performance** — Unnecessary re-renders, N+1 queries, memory leaks?
4. **Readability** — Clear variable names, comments where needed, consistent style?
5. **Best Practices** — Does it follow the language/framework conventions?

Format your response as:
## Summary
<one-line verdict>

## Issues
- 🔴 Critical: ...
- 🟡 Warning: ...
- 🟢 Suggestion: ...

## Positive Highlights
- ...

Code to review:
\`\`\`
{{CODE}}
\`\`\``,
    },
    {
      title: 'Documentation Generation Prompt',
      typeName: 'prompt',
      contentType: 'TEXT',
      content: `Generate comprehensive documentation for the following code.

Include:
- **Overview**: What this code does in 1-2 sentences
- **Parameters / Props**: Name, type, required, description for each
- **Return value**: What is returned and its shape
- **Usage example**: A concise, realistic code snippet
- **Edge cases / Notes**: Any gotchas or important behaviour to know

Keep the tone technical but accessible. Use Markdown.

Code:
\`\`\`
{{CODE}}
\`\`\``,
    },
    {
      title: 'Refactoring Assistant Prompt',
      typeName: 'prompt',
      contentType: 'TEXT',
      content: `You are a senior engineer helping me refactor code for clarity and maintainability.

Goals:
- Improve readability without changing external behaviour
- Apply SOLID principles where appropriate
- Reduce duplication (DRY)
- Improve naming conventions
- Suggest splitting large functions/components
- Keep the same language and framework

Constraints:
- Do NOT change public APIs or function signatures unless explicitly asked
- Preserve all existing comments that add value
- Output only the refactored code with brief inline comments explaining key changes

Code to refactor:
\`\`\`
{{CODE}}
\`\`\``,
    },
  ])

  // ── DevOps ─────────────────────────────────────────────────────────────────
  await createCollection('DevOps', 'Infrastructure and deployment resources', 'snippet', [
    {
      title: 'Dockerfile — Node.js Multi-Stage Build',
      typeName: 'snippet',
      contentType: 'TEXT',
      language: 'dockerfile',
      content: `# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --omit=dev

FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]`,
    },
    {
      title: 'Deploy to Production',
      typeName: 'command',
      contentType: 'TEXT',
      language: 'bash',
      content: `# Pull latest, run migrations, restart app
git pull origin main && \\
  npx prisma migrate deploy && \\
  pm2 restart all

# Or with Docker Compose:
docker compose pull && docker compose up -d --remove-orphans`,
    },
    {
      title: 'Docker Documentation',
      typeName: 'link',
      contentType: 'URL',
      url: 'https://docs.docker.com',
      description: 'Official Docker documentation — reference for Dockerfiles, Compose, and CLI.',
    },
    {
      title: 'GitHub Actions Documentation',
      typeName: 'link',
      contentType: 'URL',
      url: 'https://docs.github.com/en/actions',
      description: 'GitHub Actions docs — workflows, triggers, jobs, and marketplace actions.',
    },
  ])

  // ── Terminal Commands ──────────────────────────────────────────────────────
  await createCollection(
    'Terminal Commands',
    'Useful shell commands for everyday development',
    'command',
    [
      {
        title: 'Git — Undo & Cleanup',
        typeName: 'command',
        contentType: 'TEXT',
        language: 'bash',
        isPinned: true,
        content: `# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Discard all uncommitted changes
git checkout -- .

# Delete merged local branches
git branch --merged | grep -v '\\*\\|main\\|master\\|develop' | xargs git branch -d

# Interactive rebase last 3 commits
git rebase -i HEAD~3

# Show pretty log
git log --oneline --graph --decorate --all`,
      },
      {
        title: 'Docker — Container Management',
        typeName: 'command',
        contentType: 'TEXT',
        language: 'bash',
        content: `# Remove all stopped containers
docker container prune -f

# Remove dangling images
docker image prune -f

# Stop and remove all containers
docker stop $(docker ps -aq) && docker rm $(docker ps -aq)

# Shell into running container
docker exec -it <container_name> sh

# View real-time logs
docker logs -f <container_name>`,
      },
      {
        title: 'Process Management',
        typeName: 'command',
        contentType: 'TEXT',
        language: 'bash',
        content: `# Find process on port 3000
lsof -i :3000

# Kill process by port
kill -9 $(lsof -t -i:3000)

# Show top CPU/memory processes
ps aux --sort=-%cpu | head -10

# Monitor file changes (macOS/Linux)
watch -n 2 'ls -lh /var/log/app.log'`,
      },
      {
        title: 'Package Manager Utilities',
        typeName: 'command',
        contentType: 'TEXT',
        language: 'bash',
        content: `# List outdated npm packages
npm outdated

# Audit and auto-fix vulnerabilities
npm audit fix

# Check why a package is installed
npm why <package>

# Clean install (delete node_modules first)
rm -rf node_modules package-lock.json && npm install

# pnpm: deduplicate lockfile
pnpm dedupe`,
      },
    ]
  )

  // ── Design Resources ───────────────────────────────────────────────────────
  await createCollection('Design Resources', 'UI/UX resources and references', 'link', [
    {
      title: 'Tailwind CSS Documentation',
      typeName: 'link',
      contentType: 'URL',
      url: 'https://tailwindcss.com/docs',
      description: 'Official Tailwind CSS v4 docs — utilities, theming, and configuration.',
      isFavorite: true,
    },
    {
      title: 'shadcn/ui Components',
      typeName: 'link',
      contentType: 'URL',
      url: 'https://ui.shadcn.com',
      description: 'Copy-paste accessible components built with Radix UI and Tailwind CSS.',
      isFavorite: true,
    },
    {
      title: 'Radix UI Design System',
      typeName: 'link',
      contentType: 'URL',
      url: 'https://www.radix-ui.com',
      description: 'Unstyled, accessible component primitives for building high-quality design systems.',
    },
    {
      title: 'Lucide Icons',
      typeName: 'link',
      contentType: 'URL',
      url: 'https://lucide.dev/icons',
      description: 'Beautiful & consistent open-source icon library — used throughout DevHub.',
    },
  ])

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
