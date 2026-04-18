"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PricingCards } from "@/components/ui/PricingCards";

export default function UpgradePage() {
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade(plan: "monthly" | "yearly") {
    setUpgrading(true);
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
      setUpgrading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-2">
          <Sparkles className="h-3 w-3" />
          DevHub Pro
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Upgrade your workflow
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Unlimited items, file uploads, and four AI tools — all in one place.
        </p>
      </div>

      <PricingCards onUpgrade={handleUpgrade} upgrading={upgrading} />

      <p className="text-xs text-muted-foreground mt-8 text-center">
        Secure checkout via Stripe · Cancel anytime
      </p>
    </div>
  );
}
