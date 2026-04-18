import Link from 'next/link';

export function CtaSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-white/8 bg-white/3 px-8 py-20 text-center flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Subtle brand glow */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-primary/4 rounded-2xl" />
          </div>
          <p className="text-sm font-medium text-primary tracking-wide uppercase">
            Free to start
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white max-w-xl">
            Stop losing your best developer work
          </h2>
          <p className="text-zinc-400 text-lg max-w-lg">
            Join developers who built a searchable knowledge hub that actually helps them ship faster.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base transition-colors"
            >
              Get Started Free →
            </Link>
            <a
              href="#pricing"
              className="px-8 py-3 rounded-lg border border-white/15 hover:border-white/30 text-zinc-300 hover:text-white font-medium text-base transition-colors"
            >
              View Pricing
            </a>
          </div>
          <p className="text-xs text-zinc-600">No credit card required · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}
