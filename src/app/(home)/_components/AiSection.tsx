import { Sparkles, Tag, Code2, FileText, Zap } from 'lucide-react';

const aiFeatures = [
  {
    icon: Tag,
    title: 'Auto-tagging',
    description: 'Save anything and DevHub instantly generates the right tags — no manual labeling ever again.',
  },
  {
    icon: Code2,
    title: 'Code explanation',
    description: 'Highlight any snippet and get a plain-English breakdown in seconds. Perfect for reviewing code you wrote months ago.',
  },
  {
    icon: FileText,
    title: 'Description generator',
    description: 'One click turns a raw snippet or link into a searchable description that actually makes sense to future-you.',
  },
  {
    icon: Zap,
    title: 'Prompt optimizer',
    description: 'Paste a rough prompt and get a battle-tested version back — sharper instructions, better outputs, every time.',
  },
];

const tags = ['typescript', 'react', 'hooks', 'debounce', 'performance'];

export function AiSection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-white/2 border-t border-white/6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-5">
            <Sparkles size={12} />
            Pro — AI Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            Your knowledge hub,<br />powered by AI
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed">
            Four AI tools built right into your workflow — no copy-pasting into ChatGPT, no context switching.
          </p>
        </div>

        {/* Feature grid + code mockup */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — feature cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {aiFeatures.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-white/8 bg-white/3 p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon size={15} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — code editor mockup with AI tags */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden shadow-2xl font-mono text-sm">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-zinc-400">useDebounce.ts</span>
            </div>

            {/* Code body */}
            <div className="flex text-xs leading-6 overflow-x-auto">
              <div
                className="select-none text-right pr-4 pl-4 py-4 text-zinc-600 border-r border-zinc-800"
                aria-hidden="true"
              >
                {Array.from({ length: 13 }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="py-4 px-4 text-zinc-300 overflow-x-auto">
                <code>
                  <span className="text-blue-400">import</span>
                  {' { useState, useEffect } '}
                  <span className="text-blue-400">from</span>
                  {' '}
                  <span className="text-emerald-400">&apos;react&apos;</span>
                  {'\n\n'}
                  <span className="text-blue-400">function</span>
                  {' '}
                  <span className="text-yellow-300">useDebounce</span>
                  {'<'}
                  <span className="text-orange-300">T</span>
                  {'>(\n  value: '}
                  <span className="text-orange-300">T</span>
                  {',\n  delay: '}
                  <span className="text-orange-300">number</span>
                  {'): '}
                  <span className="text-orange-300">T</span>
                  {' {\n  '}
                  <span className="text-blue-400">const</span>
                  {' [debouncedValue, set] =\n    '}
                  <span className="text-yellow-300">useState</span>
                  {'<'}
                  <span className="text-orange-300">T</span>
                  {'>(value)\n\n  '}
                  <span className="text-yellow-300">useEffect</span>
                  {'(() => {\n    '}
                  <span className="text-blue-400">const</span>
                  {' t = '}
                  <span className="text-yellow-300">setTimeout</span>
                  {'(() => '}
                  <span className="text-yellow-300">set</span>
                  {'(value), delay)\n    '}
                  <span className="text-blue-400">return</span>
                  {' () => '}
                  <span className="text-yellow-300">clearTimeout</span>
                  {'(t)\n  }, [value, delay])'}
                </code>
              </pre>
            </div>

            {/* AI tags bar */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-zinc-800 bg-zinc-900/70">
              <span className="text-xs text-primary font-medium">✦ AI Generated Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
