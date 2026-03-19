import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Base MERN</CardTitle>
          <CardDescription>
            A production-ready monorepo with Express API, Next.js frontend, and React admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-md bg-[var(--secondary)] p-3">
              <p className="font-medium">API</p>
              <p className="text-[var(--muted-foreground)]">:4100</p>
            </div>
            <div className="rounded-md bg-[var(--secondary)] p-3">
              <p className="font-medium">Web</p>
              <p className="text-[var(--muted-foreground)]">:4200</p>
            </div>
            <div className="rounded-md bg-[var(--secondary)] p-3">
              <p className="font-medium">Admin</p>
              <p className="text-[var(--muted-foreground)]">:4300</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" asChild>
              <a href="/api-docs" target="_blank" rel="noopener noreferrer">
                API Docs
              </a>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a href="http://localhost:4300" target="_blank" rel="noopener noreferrer">
                Admin Panel
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
