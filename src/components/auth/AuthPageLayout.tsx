import Link from 'next/link'
import { Code, Sparkles, Terminal, StickyNote } from 'lucide-react'

const features = [
  { icon: Code, label: 'Code Snippets', color: '#3b82f6' },
  { icon: Sparkles, label: 'AI Prompts', color: '#8b5cf6' },
  { icon: Terminal, label: 'Commands', color: '#f97316' },
  { icon: StickyNote, label: 'Notes & Links', color: '#10b981' },
]

const DevHubLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect width="28" height="28" rx="8" fill="#3b82f6" />
    <path d="M7 7h5v14H7V7zm7 0h7v5h-7V7zm0 9h7v5h-7v-5z" fill="white" />
  </svg>
)

interface AuthPageLayoutProps {
  heading: string
  subheading: string
  footerNote: string
  children: React.ReactNode
}

export function AuthPageLayout({ heading, subheading, footerNote, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-zinc-900/50 border-r border-border relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <Link href="/" className="relative flex items-center gap-2.5 w-fit group">
          <DevHubLogo size={32} />
          <span className="text-lg font-semibold text-white tracking-tight group-hover:text-blue-400 transition-colors">
            devhub
          </span>
        </Link>

        <div className="relative space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white leading-snug whitespace-pre-line">{heading}</h2>
            <p className="text-zinc-400 text-base leading-relaxed max-w-xs">{subheading}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-sm text-zinc-300"
              >
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-zinc-600">{footerNote}</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center gap-2 p-6">
          <Link href="/" className="flex items-center gap-2">
            <DevHubLogo size={28} />
            <span className="text-base font-semibold text-foreground">devhub</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          {children}
        </div>
      </div>
    </div>
  )
}
