import { Users, Activity, Server, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PaginatedResponse, IUser } from "@base-mern/types";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: usersData } = useApiQuery<PaginatedResponse<IUser>>("/users?page=1&limit=1");

  const totalUsers = usersData?.pagination?.total ?? "—";

  const stats = [
    { label: "Total Users", value: String(totalUsers), icon: Users },
    { label: "Active Sessions", value: "—", icon: Activity },
    { label: "API Requests", value: "—", icon: Server },
    { label: "System Uptime", value: "—", icon: Clock },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Welcome back, {user?.name}!</h1>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-5 w-5 text-[var(--muted-foreground)]" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            View Users
          </Button>
          <Button variant="outline" size="sm">
            System Settings
          </Button>
          <a href="http://localhost:4100/api-docs" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              API Docs
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
