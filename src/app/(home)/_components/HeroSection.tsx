import Link from 'next/link';
import { ChaosStage } from './ChaosStage';
import { DashboardMockup } from './DashboardMockup';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-8 px-4 sm:px-6 overflow-hidden">
      {/* Brand glow — uses primary color */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl bg-primary/8" />
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-14">
        {/* Headline */}
        <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <p className="text-sm font-medium text-primary tracking-wide uppercase">
            For developers who ship a lot of code
          </p>
          <h1 className="text-4xl sm:text-[2.75rem] md:text-5xl font-bold leading-tight text-white">
            One place for every piece of{' '}
            <span className="text-primary">developer knowledge</span>{' '}
            you need to keep
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
            Snippets, prompts, commands, notes, links — scattered across Gists, Notion, Slack, and browser tabs.
            DevHub brings them into one fast, searchable hub that actually fits your workflow.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
            >
              Start for Free →
            </Link>
            <a
              href="#features"
              className="px-6 py-3 rounded-lg border border-white/15 hover:border-white/30 text-zinc-300 hover:text-white font-medium transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="text-xs text-zinc-600">Free forever · No credit card required</p>
        </div>

        {/* Visual */}
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
          <div className="flex-1 flex flex-col gap-2 min-w-0 w-full">
            <p className="text-xs text-zinc-600 text-center">Your knowledge today…</p>
            <div className="h-48 lg:h-56">
              <ChaosStage />
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-1">
            <svg className="animate-pulse rotate-90 lg:rotate-0" width="36" height="36" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M10 24H38M38 24L26 12M38 24L26 36" stroke="oklch(0.72 0.15 175)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] text-zinc-600 font-medium">DevHub</span>
          </div>

          <div className="flex-1 flex flex-col gap-2 min-w-0 w-full">
            <p className="text-xs text-zinc-600 text-center">…with DevHub</p>
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
