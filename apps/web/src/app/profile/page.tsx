"use client";

import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@base-mern/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
              <User className="h-6 w-6" />
            </div>
            <CardTitle>{user.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4">
            <div>
              <dt className="text-sm font-medium text-[var(--muted-foreground)]">Email</dt>
              <dd className="mt-1 text-sm">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--muted-foreground)]">Role</dt>
              <dd className="mt-1 text-sm">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--muted-foreground)]">Member since</dt>
              <dd className="mt-1 text-sm">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
