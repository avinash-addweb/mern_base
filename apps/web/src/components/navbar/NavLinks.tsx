"use client";

import Link from "next/link";

interface NavLinksProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
];

export function NavLinks({ mobile, onNavigate }: NavLinksProps) {
  const className = "text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]";

  return (
    <div className={mobile ? "flex flex-col gap-2" : "hidden items-center gap-4 md:flex"}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={className} onClick={onNavigate}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}
