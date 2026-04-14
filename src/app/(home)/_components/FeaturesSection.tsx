import { Code, MessageSquare, Terminal, FileText, Search, Folder } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Code,
    title: 'Code Snippets',
    description: 'Syntax-highlighted storage for every language. Monaco editor built in — feels exactly like VS Code.',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
  },
  {
    icon: MessageSquare,
    title: 'AI Prompts',
    description: 'Build a personal library of prompts that actually work. Full Markdown editor with live preview.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: Terminal,
    title: 'Commands',
    description: 'Shell commands, npm scripts, kubectl incantations — all findable in under a second.',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
  },
  {
    icon: FileText,
    title: 'Notes',
    description: 'Meeting notes, architecture decisions, README drafts. Full Markdown with GFM tables and code blocks.',
    color: '#fde047',
    bg: 'rgba(253,224,71,0.1)',
  },
  {
    icon: Search,
    title: 'Instant Search',
    description: 'Full-text search across everything you\'ve ever saved. Filter by type, tag, or collection.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
  },
  {
    icon: Folder,
    title: 'Files & Docs',
    description: 'Upload any file up to 50 MB. Reference architecture diagrams, PDFs, and design assets alongside your code.',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            A home for everything you build
          </h2>
          <p className="text-zinc-400 text-lg">
            Seven knowledge types — one place to search them all.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors"
                style={{ borderTopColor: feature.color, borderTopWidth: 2 }}
              >
                <CardContent className="p-6 flex flex-col gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: feature.bg, color: feature.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}
