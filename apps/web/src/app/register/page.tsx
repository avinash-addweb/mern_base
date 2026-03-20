"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@base-mern/types";
import type { RegisterInput } from "@base-mern/types";
import { useAuth } from "@/hooks/useAuth";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { FormField } from "@/components/ui/form-field";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setError("");
    setSubmitting(true);
    try {
      await registerUser(data.name, data.email, data.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormCard
      title="Register"
      description="Create a new account to get started"
      error={error}
      submitLabel="Register"
      submitting={submitting}
      submittingLabel="Creating account..."
      footerText="Already have an account?"
      footerLinkText="Login"
      footerLinkHref="/login"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        id="name"
        label="Name"
        type="text"
        placeholder="Your name"
        error={errors.name?.message}
        {...register("name")}
      />
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
        placeholder="Create a password"
        error={errors.password?.message}
        {...register("password")}
      />
    </AuthFormCard>
  );
}
