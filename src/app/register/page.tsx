import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export default function RegisterPage() {
  return (
    <AuthPageLayout
      heading={"Stop losing your\nbest developer work"}
      subheading="Save snippets, prompts, commands, and notes — all in one searchable hub."
      footerNote="Free to start — no credit card required"
    >
      <RegisterForm />
    </AuthPageLayout>
  );
}
