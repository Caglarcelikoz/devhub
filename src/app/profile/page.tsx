import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      password: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const [totalItems, totalCollections, itemTypeCounts] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      include: {
        _count: {
          select: { items: { where: { userId } } },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasPassword = !!user.password;
  const joinedDate = user.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left column */}
      <div className="space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground/50">
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar name={user.name} image={user.image} size={56} />
              <div>
                <p className="font-semibold text-foreground">{user.name ?? "No name"}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Member since</span>
              <span className="text-foreground">{joinedDate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sign-in method</span>
              <span className="text-foreground">{hasPassword ? "Email / Password" : "GitHub OAuth"}</span>
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground/50">
              Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                <p className="text-xs text-muted-foreground mt-1">Total items</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalCollections}</p>
                <p className="text-xs text-muted-foreground mt-1">Collections</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                By type
              </p>
              <div className="space-y-2">
                {itemTypeCounts.map((type) => (
                  <div key={type.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="capitalize text-foreground">{type.name}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">{type._count.items}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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
  );
}
