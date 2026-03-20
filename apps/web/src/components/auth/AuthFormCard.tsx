"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface AuthFormCardProps {
  title: string;
  description: string;
  error?: string;
  submitLabel: string;
  submitting: boolean;
  submittingLabel: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export function AuthFormCard({
  title,
  description,
  error,
  submitLabel,
  submitting,
  submittingLabel,
  footerText,
  footerLinkText,
  footerLinkHref,
  onSubmit,
  children,
}: AuthFormCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)]">
                {error}
              </div>
            )}
            {children}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? submittingLabel : submitLabel}
            </Button>
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              {footerText}{" "}
              <Link href={footerLinkHref} className="text-[var(--primary)] hover:underline">
                {footerLinkText}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
