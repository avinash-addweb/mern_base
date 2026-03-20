import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@base-mern/types";
import type { LoginInput } from "@base-mern/types";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

export default function Login() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--muted)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]">
            <Shield className="h-6 w-6 text-[var(--primary-foreground)]" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Sign in to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)]">
                {error}
              </div>
            )}
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="admin@example.com"
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
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
