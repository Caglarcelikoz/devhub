import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import { EditorPreferencesProvider, DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from "@/context/EditorPreferencesContext";
import { editorPreferencesSchema } from "@/lib/editor-preferences";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      password: true,
      editorPreferences: true,
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const hasPassword = !!user.password;

  const parsedPrefs = editorPreferencesSchema.safeParse(user.editorPreferences);
  const initialPreferences: EditorPreferences = parsedPrefs.success
    ? parsedPrefs.data
    : DEFAULT_EDITOR_PREFERENCES;

  return (
    <EditorPreferencesProvider initialPreferences={initialPreferences}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6">
          {/* Editor Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground/50">
                Editor preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditorPreferencesForm />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Change Password */}
          {hasPassword && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground/50">
                  Change password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChangePasswordForm />
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-destructive/70">
                Danger zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              <DeleteAccountDialog />
            </CardContent>
          </Card>
        </div>
      </div>
    </EditorPreferencesProvider>
  );
}
