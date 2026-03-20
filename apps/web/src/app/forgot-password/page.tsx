"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@base-mern/types";
import type { ForgotPasswordInput } from "@base-mern/types";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setError("");
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center">
              <p className="mb-4 text-[var(--muted-foreground)]">
                If an account exists with that email, you will receive a password reset link
                shortly.
              </p>
              <Link href="/login">
                <Button variant="outline">Back to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
              <FormField
                id="email"
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="text-center text-sm">
                <Link href="/login" className="text-[var(--primary)] hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
