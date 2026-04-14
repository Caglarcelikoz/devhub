'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

const freeFeatures = [
  { text: '50 items',        included: true  },
  { text: '3 collections',   included: true  },
  { text: 'All 7 item types', included: true  },
  { text: 'Full-text search', included: true  },
  { text: 'AI features',     included: false },
  { text: 'File uploads',    included: false },
];

const proFeatures = [
  { text: 'Unlimited items',       included: true },
  { text: 'Unlimited collections', included: true },
  { text: 'All 7 item types',      included: true },
  { text: 'AI auto-tagging',       included: true },
  { text: 'Semantic search',       included: true },
  { text: 'File uploads (50 MB)',  included: true },
];

export function PricingToggle() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="flex flex-col items-center gap-10">
      {/* Toggle */}
      <div className="flex items-center gap-3 text-sm">
        <span className={yearly ? 'text-zinc-500' : 'text-white'}>Monthly</span>
        <button
          onClick={() => setYearly(!yearly)}
          aria-label="Toggle billing period"
          aria-pressed={yearly}
          className={`relative w-10 h-6 rounded-full transition-colors ${yearly ? 'bg-blue-600' : 'bg-zinc-700'}`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${yearly ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
        <span className={yearly ? 'text-white' : 'text-zinc-500'}>
          Yearly{' '}
          <em className="not-italic text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Save 25%
          </em>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">

        {/* Free */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Free</h3>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-zinc-400 pb-1">forever</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {freeFeatures.map((f) => (
              <li key={f.text} className={`flex items-center gap-2 text-sm ${f.included ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {f.included
                  ? <Check size={14} className="text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
                  : <X size={14} className="text-zinc-700 flex-shrink-0" strokeWidth={2.5} />
                }
                {f.text}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="block text-center py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro */}
        <div className="rounded-xl border border-blue-500/50 bg-zinc-900 p-6 flex flex-col gap-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
            Most Popular
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Pro</h3>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">{yearly ? '$72' : '$8'}</span>
              <span className="text-zinc-400 pb-1">{yearly ? '/year' : '/month'}</span>
            </div>
            {yearly && (
              <p className="text-xs text-zinc-500 mt-1">Billed as $72/year</p>
            )}
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {proFeatures.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check size={14} className="text-blue-400 flex-shrink-0" strokeWidth={2.5} />
                {f.text}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="block text-center py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Start Pro Trial
          </Link>
        </div>

      </div>
    </div>
  );
}
