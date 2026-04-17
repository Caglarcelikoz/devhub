"use client";

import { useState } from "react";
import { Check, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const freeFeatures = [
  { text: "50 items", included: true },
  { text: "3 collections", included: true },
  { text: "All 7 item types", included: true },
  { text: "Full-text search", included: true },
  { text: "AI features", included: false },
  { text: "File uploads", included: false },
];

const proFeatures = [
  { text: "Unlimited items", included: true },
  { text: "Unlimited collections", included: true },
  { text: "All 7 item types", included: true },
  { text: "AI auto-tagging", included: true },
  { text: "Semantic search", included: true },
  { text: "File uploads (50 MB)", included: true },
];

export default function UpgradePage() {
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "yearly" | null>(
    null,
  );

  async function handleUpgrade(plan: "monthly" | "yearly") {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to create checkout session");
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-2">
          <Sparkles className="h-3 w-3" />
          DevHub Pro
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Upgrade your workflow
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Get unlimited items, collections, file uploads, and AI features.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-3 text-sm mb-8">
        <span
          className={
            yearly ? "text-muted-foreground" : "text-foreground font-medium"
          }
        >
          Monthly
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          aria-label="Toggle billing period"
          aria-pressed={yearly}
          className="relative flex items-center justify-center min-w-11 min-h-11 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={`relative w-10 h-6 rounded-full transition-colors block ${yearly ? "bg-primary" : "bg-muted-foreground/30"}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${yearly ? "translate-x-4" : "translate-x-0"}`}
            />
          </span>
        </button>
        <span
          className={
            yearly ? "text-foreground font-medium" : "text-muted-foreground"
          }
        >
          Yearly{" "}
          <em className="not-italic text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Save 25%
          </em>
        </span>
      </div>

      {/* Plan cards */}
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
              <li
                key={f.text}
                className={`flex items-center gap-2 text-sm ${f.included ? "text-foreground/80" : "text-muted-foreground/50"}`}
              >
                {f.included ? (
                  <Check
                    size={14}
                    className="text-emerald-400 shrink-0"
                    strokeWidth={2.5}
                  />
                ) : (
                  <X
                    size={14}
                    className="text-muted-foreground/40 shrink-0"
                    strokeWidth={2.5}
                  />
                )}
                {f.text}
              </li>
            ))}
          </ul>
          <div className="block text-center py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium">
            Current plan
          </div>
        </div>

        {/* Pro */}
        <div className="rounded-xl border border-primary/50 bg-card p-6 flex flex-col gap-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            Most Popular
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Pro</h3>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-foreground">
                {yearly ? "€72" : "€8"}
              </span>
              <span className="text-muted-foreground pb-1">
                {yearly ? "/year" : "/month"}
              </span>
            </div>
            <p className={`text-xs text-muted-foreground mt-1 ${yearly ? "visible" : "invisible"}`}>
              Billed as €72/year
            </p>
          </div>
          <ul className="flex flex-col gap-2.5 flex-1">
            {proFeatures.map((f) => (
              <li
                key={f.text}
                className="flex items-center gap-2 text-sm text-foreground/80"
              >
                <Check
                  size={14}
                  className="text-primary shrink-0"
                  strokeWidth={2.5}
                />
                {f.text}
              </li>
            ))}
          </ul>
          <Button
            className="w-full"
            onClick={() => handleUpgrade(yearly ? "yearly" : "monthly")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan !== null && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {loadingPlan !== null
              ? "Redirecting..."
              : `Upgrade to Pro — ${yearly ? "€72/yr" : "€8/mo"}`}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        Secure checkout via Stripe · Cancel anytime
      </p>
    </div>
  );
}
