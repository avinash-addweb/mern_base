"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@base-mern/types";
import type { LoginInput } from "@base-mern/types";
import { useAuth } from "@/hooks/useAuth";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { FormField } from "@/components/ui/form-field";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setError("");
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormCard
      title="Login"
      description="Enter your credentials to access your account"
      error={error}
      submitLabel="Login"
      submitting={submitting}
      submittingLabel="Logging in..."
      footerText="Don't have an account?"
      footerLinkText="Register"
      footerLinkHref="/register"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register("password")}
      />
    </AuthFormCard>
  );
}
