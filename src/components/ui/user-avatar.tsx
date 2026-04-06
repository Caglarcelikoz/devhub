import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
  size?: number;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAvatar({ name, image, className, size = 32 }: UserAvatarProps) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "User avatar"}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = name ? getInitials(name) : "?";

  return (
    <div
      className={cn(
        "rounded-full bg-primary/20 flex items-center justify-center shrink-0 select-none",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={name ?? "User"}
    >
      <span className="font-semibold text-primary" style={{ fontSize: size * 0.38 }}>
        {initials}
      </span>
    </div>
  );
}
