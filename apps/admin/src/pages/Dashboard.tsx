import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-2xl font-bold">0</p>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>API Health</CardTitle>
            <CardDescription>Service status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-2xl font-bold text-green-600">Healthy</p>
            <Button variant="outline" size="sm">
              Check Status
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>API reference</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-[var(--muted-foreground)]">
              View the API documentation and test endpoints.
            </p>
            <a href="http://localhost:4100/api-docs" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Open Swagger
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
