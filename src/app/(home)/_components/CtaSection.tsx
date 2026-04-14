import Link from 'next/link';

export function CtaSection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-8 py-16 text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Organize Your Knowledge?
          </h2>
          <p className="text-zinc-400 text-lg max-w-lg">
            Join developers who stopped losing their best work. Free to start, no credit card needed.
          </p>
          <Link
            href="/register"
            className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-lg transition-colors"
          >
            Get Started Free →
          </Link>
        </div>
      </div>
    </section>
  );
}
