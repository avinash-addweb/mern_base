import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Server, Globe, Shield } from "lucide-react";

const features = [
  {
    icon: Server,
    title: "Express API",
    description:
      "Robust REST API built with Express.js, featuring authentication, validation, and error handling.",
  },
  {
    icon: Globe,
    title: "Next.js Frontend",
    description:
      "Modern web application with server-side rendering, routing, and a beautiful UI powered by Tailwind CSS.",
  },
  {
    icon: Shield,
    title: "Admin Panel",
    description:
      "Secure admin dashboard for managing users, content, and application settings with role-based access.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight">Build Faster with Base MERN</h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--muted-foreground)]">
          A production-ready monorepo starter with Express API, Next.js frontend, and React admin
          panel. Everything you need to ship your next project.
        </p>
        <div className="mt-10 flex gap-4">
          <Button size="lg" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#features">Learn More</a>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-2 h-10 w-10 text-[var(--primary)]" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
