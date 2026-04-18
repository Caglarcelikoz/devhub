'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';

export const freeFeatures = [
  { text: '50 items',          included: true  },
  { text: '3 collections',     included: true  },
  { text: 'All 7 item types',  included: true  },
  { text: 'Full-text search',  included: true  },
  { text: 'AI features',       included: false },
  { text: 'File uploads',      included: false },
];

export const proFeatures = [
  { text: 'Unlimited items',              included: true },
  { text: 'Unlimited collections',        included: true },
  { text: 'File & image uploads (50 MB)', included: true },
  { text: 'AI auto-tagging',              included: true },
  { text: 'AI code explanation',          included: true },
  { text: 'AI description generator',     included: true },
  { text: 'AI prompt optimizer',          included: true },
  { text: 'Data export (JSON / ZIP)',      included: true },
];

interface PricingCardsProps {
  /** Called when the user clicks the Pro CTA. If omitted, renders a link to /register instead. */
  onUpgrade?: (plan: 'monthly' | 'yearly') => void;
  /** When true the Pro CTA shows a loading spinner label */
  upgrading?: boolean;
  /** Replace the Pro CTA with a static "Current plan" badge (for logged-in Pro users) */
  isPro?: boolean;
}

export function PricingCards({ onUpgrade, upgrading = false, isPro = false }: PricingCardsProps) {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="flex flex-col items-center gap-10">
      {/* Billing toggle */}
      <div className="flex items-center gap-3 text-sm">
        <span className={yearly ? 'text-muted-foreground' : 'text-foreground font-medium'}>Monthly</span>
        <button
          type="button"
          onClick={() => setYearly((v) => !v)}
          aria-label="Toggle billing period"
          aria-pressed={yearly}
          className="relative flex items-center justify-center min-w-11 min-h-11 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={`relative w-10 h-6 rounded-full transition-colors block ${yearly ? 'bg-primary' : 'bg-white/15'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${yearly ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </button>
        <span className={yearly ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          Yearly{' '}
          <em className="not-italic text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Save 25%
          </em>
        </span>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">

        {/* Free */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Free</h3>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-foreground">€0</span>
              <span className="text-muted-foreground pb-1">forever</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {freeFeatures.map((f) => (
              <li key={f.text} className={`flex items-center gap-2 text-sm ${f.included ? 'text-foreground/80' : 'text-muted-foreground/50'}`}>
                {f.included
                  ? <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
                  : <X    size={14} className="text-muted-foreground/40 shrink-0" strokeWidth={2.5} />
                }
                {f.text}
              </li>
            ))}
          </ul>
          <div className="block text-center py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium">
            {isPro ? 'Previous plan' : 'Current plan'}
          </div>
        </div>

        {/* Pro */}
        <div className="rounded-xl border border-primary/50 bg-card p-6 flex flex-col gap-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold whitespace-nowrap">
            Most Popular
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Pro</h3>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-foreground">{yearly ? '€72' : '€8'}</span>
              <span className="text-muted-foreground pb-1">{yearly ? '/year' : '/month'}</span>
            </div>
            <p className={`text-xs text-muted-foreground mt-1 ${yearly ? 'visible' : 'invisible'}`}>
              Billed as €72/year · save 25%
            </p>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {proFeatures.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm text-foreground/80">
                <Check size={14} className="text-primary shrink-0" strokeWidth={2.5} />
                {f.text}
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="block text-center py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
              Current plan
            </div>
          ) : onUpgrade ? (
            <button
              type="button"
              onClick={() => onUpgrade(yearly ? 'yearly' : 'monthly')}
              disabled={upgrading}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors disabled:opacity-60"
            >
              {upgrading ? 'Redirecting…' : yearly ? 'Get Pro — €72/yr' : 'Get Pro — €8/mo'}
            </button>
          ) : (
            <a
              href="/register"
              className="block text-center py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
            >
              {yearly ? 'Get Pro — €72/yr' : 'Get Pro — €8/mo'}
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
