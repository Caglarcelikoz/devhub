import { Check, Sparkles } from 'lucide-react';

const bullets = [
  'Auto-tag items on save',
  'Semantic search across your library',
  'Generate code explanations',
  'Suggest related snippets',
  'Natural language queries: "that React hook I wrote for forms"',
];

const tags = ['typescript', 'react', 'hooks', 'debounce', 'performance'];

export function AiSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-zinc-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium w-fit">
              <Sparkles size={12} />
              Pro Feature
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              AI that understands<br />what you saved
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Stop tagging everything manually. Devhub Pro uses AI to understand your code and docs —
              so you can find anything with a natural language query.
            </p>
            <ul className="flex flex-col gap-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check size={16} className="text-blue-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span dangerouslySetInnerHTML={{ __html: bullet.replace(/"([^"]+)"/, '<em class="text-zinc-400">"$1"</em>') }} />
                </li>
              ))}
            </ul>
          </div>

          {/* Right — static code editor mockup */}
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
              {/* Line numbers */}
              <div
                className="select-none text-right pr-4 pl-4 py-4 text-zinc-600 border-r border-zinc-800"
                aria-hidden="true"
              >
                {Array.from({ length: 13 }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code */}
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
              <span className="text-xs text-blue-400 font-medium">✦ AI Generated Tags</span>
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
