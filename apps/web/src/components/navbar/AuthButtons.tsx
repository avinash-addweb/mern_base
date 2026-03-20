"use client";

import Link from "next/link";
import type { IUser } from "@base-mern/types";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface AuthButtonsProps {
  user: IUser | null;
  loading: boolean;
  logout: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function AuthButtons({ user, loading, logout, mobile, onNavigate }: AuthButtonsProps) {
  if (loading) return null;

  if (mobile) {
    return user ? (
      <>
        <Link
          href="/profile"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={onNavigate}
        >
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {user.name}
          </span>
        </Link>
        <button
          className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </>
    ) : (
      <>
        <Link
          href="/login"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={onNavigate}
        >
          Login
        </Link>
        <Link
          href="/register"
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={onNavigate}
        >
          Register
        </Link>
      </>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      {user ? (
        <>
          <Link href="/profile">
            <Button variant="ghost" size="sm">
              <User className="mr-1 h-4 w-4" />
              {user.name}
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-1 h-4 w-4" />
            Logout
          </Button>
        </>
      ) : (
        <>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Register</Button>
          </Link>
        </>
      )}
    </div>
  );
}
