"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  email: string;
}

export function ResendVerificationButton({ email }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleResend() {
    setStatus("sending");
    setErrorMsg(null);

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.status === 429) {
      const data = await res.json();
      setErrorMsg(data.error ?? "Too many attempts. Please try again later.");
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return <p className="text-sm text-green-500">Verification email resent!</p>;
  }

  return (
    <div className="space-y-2">
      {status === "error" && errorMsg && (
        <p className="text-sm text-destructive text-center">{errorMsg}</p>
      )}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Resend verification email"}
      </Button>
    </div>
  );
}
