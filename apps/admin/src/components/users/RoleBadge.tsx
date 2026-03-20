import { UserRole } from "@base-mern/types";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        role === UserRole.ADMIN
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
      )}
    >
      {role}
    </span>
  );
}
