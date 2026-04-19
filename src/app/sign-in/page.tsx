import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export default function SignInPage() {
  return (
    <AuthPageLayout
      heading={"Your developer\nknowledge hub"}
      subheading="One fast, searchable place for everything you reach for while building."
      footerNote="Built for developers who move fast"
    >
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthPageLayout>
  );
}
