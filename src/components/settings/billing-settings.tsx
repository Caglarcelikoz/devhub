"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BillingSettingsProps {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}

export function BillingSettings({
  isPro,
  itemCount,
  collectionCount,
}: BillingSettingsProps) {
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<
    "monthly" | "yearly" | "portal" | null
  >(null);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast.success("Welcome to DevStash Pro!");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

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

  async function handleManageBilling() {
    setLoadingPlan("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to open billing portal");
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }

  if (isPro) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/20 hover:bg-amber-500/15">
            Pro
          </Badge>
          <span className="text-[15px] text-muted-foreground">
            Your plan is active
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManageBilling}
          disabled={loadingPlan === "portal"}
        >
          {loadingPlan === "portal" && (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          )}
          Manage Billing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[15px] text-muted-foreground">
        {itemCount}/50 items · {collectionCount}/3 collections
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          size="sm"
          onClick={() => handleUpgrade("monthly")}
          disabled={loadingPlan !== null}
          className="flex-1"
        >
          {loadingPlan === "monthly" && (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          )}
          Upgrade €8/mo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpgrade("yearly")}
          disabled={loadingPlan !== null}
          className="flex-1"
        >
          {loadingPlan === "yearly" && (
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          )}
          Upgrade €72/yr{" "}
          <span className="ml-1 text-xs text-muted-foreground">(save 25%)</span>
        </Button>
      </div>
    </div>
  );
}
