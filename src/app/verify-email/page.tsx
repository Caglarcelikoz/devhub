import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to your email address. Click the link to
            activate your account.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it? Check your spam folder or{" "}
          <Link
            href="/register"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            try again
          </Link>
          .
        </p>

        <Link
          href="/sign-in"
          className="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
