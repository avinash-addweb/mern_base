"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NavLinks } from "./navbar/NavLinks";
import { AuthButtons } from "./navbar/AuthButtons";
import { MobileMenu } from "./navbar/MobileMenu";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            Base MERN
          </Link>
          <NavLinks />
        </div>
        <AuthButtons user={user} loading={loading} logout={logout} />
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <MobileMenu
        open={menuOpen}
        user={user}
        loading={loading}
        logout={logout}
        onClose={() => setMenuOpen(false)}
      />
    </nav>
  );
}
