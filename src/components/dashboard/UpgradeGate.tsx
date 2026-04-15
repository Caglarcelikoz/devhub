import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeGateProps {
  title: string;
  description: string;
}

export function UpgradeGate({ title, description }: UpgradeGateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      </div>
      <Button
        size="sm"
        className="gap-2"
        render={<Link href="/settings#billing" />}
      >
        <Sparkles className="h-4 w-4" />
        Upgrade to Pro
      </Button>
    </div>
  );
}
