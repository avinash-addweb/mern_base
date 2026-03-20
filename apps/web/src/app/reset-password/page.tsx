"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface ResetForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetForm>();

  const password = watch("password");

  async function onSubmit(data: ResetForm) {
    if (!token) {
      setError("Missing reset token");
      return;
    }
    setError("");
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: data.password }),
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Invalid or missing reset token.</p>
            <Link href="/forgot-password">
              <Button variant="outline">Request New Reset Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center">
              <p className="mb-4 text-green-600">
                Password reset successfully! Redirecting to login...
              </p>
              <Link href="/login">
                <Button variant="outline">Go to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
              <FormField
                id="password"
                label="New Password"
                type="password"
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Minimum 6 characters" },
                })}
              />
              <FormField
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords do not match",
                })}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
