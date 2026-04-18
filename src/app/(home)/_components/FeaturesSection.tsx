import { Code, Sparkles, Terminal, StickyNote, Link as LinkIcon, File, Image, Search, FolderOpen, Tag, Download } from 'lucide-react';

const itemTypes = [
  {
    icon: Code,
    title: 'Snippets',
    description: 'Monaco editor built in. Syntax highlighting for every language — feels exactly like VS Code, not a textarea.',
    color: '#3b82f6',
  },
  {
    icon: Sparkles,
    title: 'AI Prompts',
    description: 'Build a personal prompt library that actually works. Markdown editor with live preview and one-click optimizer.',
    color: '#8b5cf6',
  },
  {
    icon: Terminal,
    title: 'Commands',
    description: 'Shell commands, npm scripts, kubectl incantations. Stop grepping your bash history.',
    color: '#f97316',
  },
  {
    icon: StickyNote,
    title: 'Notes',
    description: 'Architecture decisions, README drafts, meeting notes. Full GFM Markdown with tables and code blocks.',
    color: '#fde047',
  },
  {
    icon: LinkIcon,
    title: 'Links',
    description: 'Bookmark docs and tools with context. Searchable alongside your code — not buried in browser tabs.',
    color: '#10b981',
  },
  {
    icon: File,
    title: 'Files',
    description: 'Upload PDFs, diagrams, and docs up to 50 MB. Reference them in context without leaving your workflow.',
    color: '#6b7280',
  },
  {
    icon: Image,
    title: 'Images',
    description: 'Store design assets, screenshots, and architecture diagrams alongside the code they belong to.',
    color: '#ec4899',
  },
];

const platformFeatures = [
  {
    icon: Search,
    title: '⌘K instant search',
    description: 'Full-text across every item, tag, and collection. Results as you type.',
  },
  {
    icon: FolderOpen,
    title: 'Collections',
    description: 'Group items your way — React patterns, interview prep, project contexts. Items belong to multiple collections.',
  },
  {
    icon: Tag,
    title: 'Tags',
    description: 'Manually tag anything, or let AI suggest them. Filter by tag across all types at once.',
  },
  {
    icon: Download,
    title: 'Export anytime',
    description: 'Download your entire library as JSON or ZIP. Your data is always yours — no lock-in.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-20">

        {/* Item types */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Every format. One hub.
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Seven knowledge types built for how developers actually work.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {itemTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.title}
                  className="rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15 p-5 flex flex-col gap-3 transition-all duration-200"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${type.color}18`, color: type.color }}
                  >
                    <Icon size={17} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm mb-1.5">{type.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{type.description}</p>
                  </div>
                </div>
              );
            })}
            {/* Empty slot filler for 4-col grid alignment */}
            <div className="hidden lg:block" />
          </div>
        </div>

        {/* Platform capabilities */}
        <div className="border-t border-white/6 pt-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 text-center mb-10">
            Built into every page
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 text-white">
                  <Icon size={15} className="text-primary shrink-0" />
                  <h3 className="text-sm font-semibold">{title}</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
