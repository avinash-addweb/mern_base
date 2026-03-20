"use client";

import type { IUser } from "@base-mern/types";
import { NavLinks } from "./NavLinks";
import { AuthButtons } from "./AuthButtons";

interface MobileMenuProps {
  open: boolean;
  user: IUser | null;
  loading: boolean;
  logout: () => void;
  onClose: () => void;
}

export function MobileMenu({ open, user, loading, logout, onClose }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="border-t border-[var(--border)] px-4 pb-4 pt-2 md:hidden">
      <div className="flex flex-col gap-2">
        <NavLinks mobile onNavigate={onClose} />
        <AuthButtons user={user} loading={loading} logout={logout} mobile onNavigate={onClose} />
      </div>
    </div>
  );
}
