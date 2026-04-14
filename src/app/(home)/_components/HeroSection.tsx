import Link from 'next/link';
import { ChaosStage } from './ChaosStage';
import { DashboardMockup } from './DashboardMockup';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-14">
        {/* Headline row */}
        <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <p className="text-sm font-medium text-blue-400 tracking-wide uppercase">
            For developers who ship a lot of code
          </p>
          <h1 className="text-4xl sm:text-[2.75rem] md:text-5xl font-bold leading-tight text-white">
            Stop Losing Your{' '}
            <span className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Your best snippets, commands, and prompts are scattered across GitHub Gists, Notion,
            Slack, and sticky notes. Devhub is the single place you can search everything — instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Start for Free →
            </Link>
            <a
              href="#features"
              className="px-6 py-3 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Visual — stacked on mobile, row on sm+ */}
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
          {/* Chaos box */}
          <div className="flex-1 flex flex-col gap-2 min-w-0 w-full">
            <p className="text-xs text-zinc-500 text-center">Your knowledge today…</p>
            <div className="h-48 lg:h-56">
              <ChaosStage />
            </div>
          </div>

          {/* Arrow — points down on mobile, right on sm+ */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <svg
              className="animate-pulse rotate-90 lg:rotate-0"
              width="36"
              height="36"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 24H38M38 24L26 12M38 24L26 36"
                stroke="url(#arrowGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="arrowGrad" x1="10" y1="24" x2="38" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-[10px] text-zinc-500 font-medium">Transform</span>
          </div>

          {/* Dashboard mockup */}
          <div className="flex-1 flex flex-col gap-2 min-w-0 w-full">
            <p className="text-xs text-zinc-500 text-center">…with Devhub</p>
            <DashboardMockup />
          </div>
        </div>

      </div>
    </section>
  );
}
